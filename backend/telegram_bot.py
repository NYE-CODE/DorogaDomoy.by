"""Telegram bot: handles /start, /link commands and sends notifications via Bot API."""
import logging
import os
import math
import uuid
from datetime import datetime
from typing import Optional

import httpx
from sqlalchemy.orm import Session

from database import SessionLocal
from models import User, Pet, TelegramLinkCode, NotificationSettings, Notification

logger = logging.getLogger(__name__)

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
BOT_USERNAME = os.getenv("TELEGRAM_BOT_USERNAME", "dorogadomoy_by_bot")
SITE_URL = os.getenv("SITE_URL", "http://localhost:3000")
TELEGRAM_API = f"https://api.telegram.org/bot{BOT_TOKEN}"

ANIMAL_TYPE_LABELS = {"dog": "Собака", "cat": "Кошка", "other": "Другое"}
STATUS_LABELS = {"searching": "Потерян", "found": "Найден"}
OPPOSITE_STATUS = {"searching": "found", "found": "searching"}


async def send_telegram_message(chat_id: int, text: str, parse_mode: str = "HTML") -> bool:
    if not BOT_TOKEN:
        logger.warning("TELEGRAM_BOT_TOKEN not configured, skipping message")
        return False
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                f"{TELEGRAM_API}/sendMessage",
                json={"chat_id": chat_id, "text": text, "parse_mode": parse_mode},
            )
            if resp.status_code != 200:
                logger.error("Telegram sendMessage failed: %s %s", resp.status_code, resp.text)
                return False
            return True
    except Exception as e:
        logger.exception("Failed to send Telegram message to %s: %s", chat_id, e)
        return False


def handle_link_command(telegram_id: int, telegram_username: Optional[str], code_text: str) -> str:
    """Process /link CODE command. Returns reply text for the user."""
    db: Session = SessionLocal()
    try:
        link_code = (
            db.query(TelegramLinkCode)
            .filter(TelegramLinkCode.code == code_text.upper(), TelegramLinkCode.used == False)
            .first()
        )
        if not link_code:
            return "Неверный код. Убедитесь, что скопировали его правильно, и попробуйте снова."

        if link_code.expires_at < datetime.utcnow():
            return "Код истёк. Запросите новый на сайте в настройках профиля."

        existing = db.query(User).filter(User.telegram_id == telegram_id).first()
        if existing and existing.id != link_code.user_id:
            return (
                "Этот Telegram-аккаунт уже привязан к другому профилю на DorogaDomoy.by. "
                "Сначала отвяжите его в настройках того аккаунта."
            )

        user = db.query(User).filter(User.id == link_code.user_id).first()
        if not user:
            return "Пользователь не найден. Попробуйте снова."

        user.telegram_id = telegram_id
        user.telegram_username = telegram_username
        user.telegram_linked_at = datetime.utcnow()

        contacts = dict(user.contacts or {})
        contacts["telegram"] = f"@{telegram_username}" if telegram_username else None
        user.contacts = contacts

        link_code.used = True

        db.query(TelegramLinkCode).filter(
            TelegramLinkCode.user_id == user.id,
            TelegramLinkCode.id != link_code.id,
        ).update({"used": True})

        db.commit()

        return (
            "✅ Аккаунт успешно привязан!\n\n"
            "Теперь вы можете получать уведомления о новых объявлениях рядом с вами.\n\n"
            f"Настроить уведомления: {SITE_URL}"
        )
    except Exception as e:
        db.rollback()
        logger.exception("Error in handle_link_command: %s", e)
        return "Произошла ошибка. Попробуйте позже."
    finally:
        db.close()


def handle_start_command() -> str:
    return (
        "Привет! Я бот платформы ДорогаДомой.by 🐾\n\n"
        "Я помогу вам получать уведомления о потерянных и найденных питомцах рядом с вами.\n\n"
        "Чтобы привязать аккаунт, отправьте мне код с сайта командой:\n"
        "/link ВАШ_КОД\n\n"
        f"Сайт: {SITE_URL}"
    )


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    )
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


async def send_notifications_for_pet(pet: Pet, db: Session):
    """Find users whose own ads are nearby and send them Telegram notifications."""
    if not BOT_TOKEN:
        logger.info("Telegram bot token not configured, skipping notifications")
        return

    if not pet.location_lat or not pet.location_lng:
        return

    # Find all users with notifications enabled and Telegram linked (excluding the author)
    settings_list = (
        db.query(NotificationSettings)
        .join(User, User.id == NotificationSettings.user_id)
        .filter(
            NotificationSettings.notifications_enabled == True,
            User.telegram_id.isnot(None),
            User.is_blocked == False,
            User.id != pet.author_id,
        )
        .all()
    )

    for ns in settings_list:
        user = db.query(User).filter(User.id == ns.user_id).first()
        if not user or not user.telegram_id:
            continue

        # Cross-match: "searching" ads match with "found" and vice versa
        matching_status = OPPOSITE_STATUS.get(pet.status)
        if not matching_status:
            continue

        user_pets = (
            db.query(Pet)
            .filter(
                Pet.author_id == user.id,
                Pet.status == matching_status,
                Pet.is_archived == False,
                Pet.moderation_status == "approved",
                Pet.location_lat.isnot(None),
                Pet.location_lng.isnot(None),
            )
            .all()
        )

        if not user_pets:
            continue

        radius = ns.notification_radius_km or 1.0
        closest_distance = None
        closest_user_pet = None

        for up in user_pets:
            dist = _haversine_km(up.location_lat, up.location_lng, pet.location_lat, pet.location_lng)
            if dist <= radius and (closest_distance is None or dist < closest_distance):
                closest_distance = dist
                closest_user_pet = up

        if closest_distance is None:
            continue

        existing = (
            db.query(Notification)
            .filter(Notification.user_id == user.id, Notification.pet_id == pet.id)
            .first()
        )
        if existing:
            continue

        animal_label = ANIMAL_TYPE_LABELS.get(pet.animal_type, pet.animal_type)
        status_label = STATUS_LABELS.get(pet.status, pet.status)
        breed_text = f" ({pet.breed})" if pet.breed else ""
        desc_short = (pet.description[:100] + "...") if len(pet.description) > 100 else pet.description

        message = (
            f"🐾 <b>Новое объявление рядом с вашим!</b>\n\n"
            f"{status_label}: {animal_label}{breed_text}\n"
            f"📍 ~{closest_distance:.1f} км от вашего объявления\n"
        )
        if pet.colors:
            message += f"🎨 Цвет: {', '.join(pet.colors)}\n"
        message += f"\n{desc_short}\n\n"
        message += f"🔗 <a href=\"{SITE_URL}/pet/{pet.id}\">Подробнее</a>"

        sent = await send_telegram_message(user.telegram_id, message)

        notification = Notification(
            id=f"notif-{uuid.uuid4().hex[:12]}",
            user_id=user.id,
            pet_id=pet.id,
            type="new_nearby",
            message=message,
            sent_via="telegram" if sent else "failed",
            sent_at=datetime.utcnow(),
        )
        db.add(notification)

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        logger.exception("Failed to save notifications: %s", e)


async def process_telegram_update(update: dict):
    """Process incoming Telegram webhook update."""
    message = update.get("message")
    if not message:
        return

    text = message.get("text", "").strip()
    chat_id = message["chat"]["id"]
    from_user = message.get("from", {})
    telegram_id = from_user.get("id", chat_id)
    username = from_user.get("username")

    if text.startswith("/start"):
        reply = handle_start_command()
    elif text.startswith("/link"):
        parts = text.split(maxsplit=1)
        if len(parts) < 2 or not parts[1].strip():
            reply = "Укажите код после команды, например: /link A7X3K9"
        else:
            reply = handle_link_command(telegram_id, username, parts[1].strip())
    else:
        reply = (
            "Я понимаю команды:\n"
            "/start — информация о боте\n"
            "/link КОД — привязать аккаунт"
        )

    await send_telegram_message(chat_id, reply)
