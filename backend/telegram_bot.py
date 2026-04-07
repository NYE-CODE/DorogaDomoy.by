"""Telegram bot: handles /start, /link commands and sends notifications via Bot API."""
import html
import logging
import os
import math
import uuid
from typing import Optional

import httpx
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from database import SessionLocal
from models import (
    User,
    Pet,
    Sighting,
    TelegramLinkCode,
    NotificationSettings,
    Notification,
    ProfilePet,
    ProfilePetScanSignal,
)
from time_utils import utc_now

logger = logging.getLogger(__name__)

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
BOT_USERNAME = os.getenv("TELEGRAM_BOT_USERNAME", "dorogadomoy_by_bot")
SITE_URL = os.getenv("SITE_URL", "http://localhost:3000")
TELEGRAM_API = f"https://api.telegram.org/bot{BOT_TOKEN}"

ANIMAL_TYPE_LABELS = {"dog": "Собака", "cat": "Кошка", "other": "Другое"}
STATUS_LABELS = {"searching": "Потерян", "found": "Найден"}
OPPOSITE_STATUS = {"searching": "found", "found": "searching"}


def _send_telegram_message_sync(
    chat_id: int,
    text: str,
    parse_mode: str = "HTML",
    reply_markup: Optional[dict] = None,
) -> bool:
    """Sync version for background tasks (Starlette runs them in threadpool)."""
    if not BOT_TOKEN:
        logger.warning("TELEGRAM_BOT_TOKEN not configured, skipping message")
        return False
    try:
        payload: dict = {"chat_id": chat_id, "text": text, "parse_mode": parse_mode}
        if reply_markup:
            payload["reply_markup"] = reply_markup
        with httpx.Client(timeout=10) as client:
            resp = client.post(
                f"{TELEGRAM_API}/sendMessage",
                json=payload,
            )
            if resp.status_code != 200:
                logger.error("Telegram sendMessage failed: %s %s", resp.status_code, resp.text)
                return False
            return True
    except Exception as e:
        logger.exception("Failed to send Telegram message to %s: %s", chat_id, e)
        return False


async def send_telegram_message(
    chat_id: int,
    text: str,
    parse_mode: str = "HTML",
    reply_markup: Optional[dict] = None,
) -> bool:
    if not BOT_TOKEN:
        logger.warning("TELEGRAM_BOT_TOKEN not configured, skipping message")
        return False
    try:
        payload: dict = {"chat_id": chat_id, "text": text, "parse_mode": parse_mode}
        if reply_markup:
            payload["reply_markup"] = reply_markup
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                f"{TELEGRAM_API}/sendMessage",
                json=payload,
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
        link_code = db.scalar(
            select(TelegramLinkCode).where(
                TelegramLinkCode.code == code_text.upper(),
                TelegramLinkCode.used.is_(False),
            )
        )
        if not link_code:
            return "Неверный код. Убедитесь, что скопировали его правильно, и попробуйте снова."

        if link_code.expires_at < utc_now():
            return "Код истёк. Запросите новый на сайте в настройках профиля."

        existing = db.scalar(select(User).where(User.telegram_id == telegram_id))
        if existing and existing.id != link_code.user_id:
            return (
                "Этот Telegram-аккаунт уже привязан к другому профилю на DorogaDomoy.by. "
                "Сначала отвяжите его в настройках того аккаунта."
            )

        user = db.scalar(select(User).where(User.id == link_code.user_id))
        if not user:
            return "Пользователь не найден. Попробуйте снова."

        user.telegram_id = telegram_id
        user.telegram_username = telegram_username
        user.telegram_linked_at = utc_now()

        contacts = dict(user.contacts or {})
        contacts["telegram"] = f"@{telegram_username}" if telegram_username else None
        user.contacts = contacts

        link_code.used = True

        db.execute(
            update(TelegramLinkCode)
            .where(TelegramLinkCode.user_id == user.id, TelegramLinkCode.id != link_code.id)
            .values(used=True)
        )

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

    matching_status = OPPOSITE_STATUS.get(pet.status)
    if not matching_status:
        return

    stmt = (
        select(NotificationSettings, User)
        .join(User, User.id == NotificationSettings.user_id)
        .where(
            NotificationSettings.notifications_enabled.is_(True),
            User.telegram_id.is_not(None),
            User.is_blocked.is_(False),
            User.id != pet.author_id,
        )
    )
    rows = db.execute(stmt).all()
    if not rows:
        return

    user_ids = [u.id for _, u in rows]
    pets_by_author: dict[str, list[Pet]] = {}
    for up in db.scalars(
        select(Pet).where(
            Pet.author_id.in_(user_ids),
            Pet.status == matching_status,
            Pet.is_archived.is_(False),
            Pet.moderation_status == "approved",
            Pet.location_lat.is_not(None),
            Pet.location_lng.is_not(None),
        )
    ).all():
        pets_by_author.setdefault(up.author_id, []).append(up)

    notified_already = set(
        db.scalars(
            select(Notification.user_id).where(
                Notification.pet_id == pet.id,
                Notification.user_id.in_(user_ids),
            )
        ).all()
    )

    for ns, user in rows:
        if not user.telegram_id or user.id in notified_already:
            continue

        user_pets = pets_by_author.get(user.id) or []
        if not user_pets:
            continue

        radius = ns.notification_radius_km or 1.0
        closest_distance = None

        for up in user_pets:
            dist = _haversine_km(up.location_lat, up.location_lng, pet.location_lat, pet.location_lng)
            if dist <= radius and (closest_distance is None or dist < closest_distance):
                closest_distance = dist

        if closest_distance is None:
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
        message += f"\n{desc_short}"

        keyboard = {"inline_keyboard": [[{"text": "Подробнее", "url": f"{SITE_URL}/pet/{pet.id}"}]]}
        sent = await send_telegram_message(user.telegram_id, message, reply_markup=keyboard)

        notification = Notification(
            id=f"notif-{uuid.uuid4().hex[:12]}",
            user_id=user.id,
            pet_id=pet.id,
            type="new_nearby",
            message=message,
            sent_via="telegram" if sent else "failed",
            sent_at=utc_now(),
        )
        db.add(notification)
        notified_already.add(user.id)

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        logger.exception("Failed to save notifications: %s", e)


def send_sighting_notification_sync(sighting_id: str, pet_id: str) -> None:
    """Синхронная отправка уведомления владельцу (для BackgroundTasks, т.к. они выполняются в threadpool)."""
    if not BOT_TOKEN:
        logger.info("TELEGRAM_BOT_TOKEN not configured, skipping sighting notification")
        return
    db = SessionLocal()
    try:
        pet = db.scalar(select(Pet).where(Pet.id == pet_id))
        if not pet:
            return
        author = db.scalar(select(User).where(User.id == pet.author_id))
        if not author or not author.telegram_id:
            return
        sighting = db.scalar(select(Sighting).where(Sighting.id == sighting_id))
        if not sighting:
            return

        animal = ANIMAL_TYPE_LABELS.get(pet.animal_type, pet.animal_type)
        seen_str = sighting.seen_at.strftime("%d.%m.%Y %H:%M") if sighting.seen_at else ""
        comment_line = f"\n💬 {sighting.comment[:80]}..." if sighting.comment and len(sighting.comment) > 80 else (f"\n💬 {sighting.comment}" if sighting.comment else "")
        msg = (
            f"👁 <b>Новое видение!</b>\n\n"
            f"Кто-то видел похожее животное ({animal}) рядом с вашим объявлением.\n"
            f"📍 Когда: {seen_str}{comment_line}"
        )
        keyboard = {"inline_keyboard": [[{"text": "Смотреть на карте", "url": f"{SITE_URL}/pet/{pet.id}"}]]}
        _send_telegram_message_sync(author.telegram_id, msg, reply_markup=keyboard)
    except Exception as e:
        logger.exception("send_sighting_notification error: %s", e)
    finally:
        db.close()


def send_profile_pet_signal_sync(signal_id: str, profile_pet_id: str) -> bool:
    """Синхронная отправка сигнала владельцу адресника (QR/NFC)."""
    if not BOT_TOKEN:
        logger.info("TELEGRAM_BOT_TOKEN not configured, skipping profile pet signal")
        return False
    db = SessionLocal()
    try:
        signal = db.scalar(select(ProfilePetScanSignal).where(ProfilePetScanSignal.id == signal_id))
        pet = db.scalar(select(ProfilePet).where(ProfilePet.id == profile_pet_id))
        if not signal or not pet:
            return False
        owner = db.scalar(select(User).where(User.id == pet.owner_id))
        if not owner or not owner.telegram_id:
            return False

        settings = db.scalar(
            select(NotificationSettings).where(NotificationSettings.user_id == owner.id)
        )
        if settings and not settings.notifications_enabled:
            return False

        source_label = "QR-коду" if signal.source == "qr" else ("NFC-брелока" if signal.source == "nfc" else "адресника")
        msg = (
            f"🐾 <b>Сигнал по питомцу!</b>\n\n"
            f"Кто-то нажал «Я нашёл этого питомца» после сканирования {source_label}.\n"
            f"Питомец: <b>{pet.name}</b>\n\n"
            f"Проверьте контакты и, если нужно, обновите статус."
        )
        keyboard = {
            "inline_keyboard": [[{"text": "Открыть карточку питомца", "url": f"{SITE_URL}/pet-profile/{pet.id}"}]]
        }
        sent = _send_telegram_message_sync(owner.telegram_id, msg, reply_markup=keyboard)
        return bool(sent)
    except Exception as e:
        logger.exception("send_profile_pet_signal_sync error: %s", e)
        return False
    finally:
        db.close()


async def publish_blog_post_to_telegram(
    *,
    chat_id: str,
    title: str,
    excerpt: Optional[str],
    article_url: str,
    cover_image_url: Optional[str],
) -> tuple[Optional[int], Optional[str]]:
    """
    Публикует анонс статьи в канал/супергруппу (chat_id — @username или -100...).
    Возвращает (message_id, None) при успехе или (None, текст_ошибки).
    """
    if not BOT_TOKEN:
        return None, "TELEGRAM_BOT_TOKEN не задан"
    chat = (chat_id or "").strip()
    if not chat:
        return None, "Не задан чат для публикации блога"
    safe_title = html.escape(title.strip())
    safe_url = html.escape(article_url.strip(), quote=True)
    lines = [f"<b>{safe_title}</b>"]
    if excerpt and excerpt.strip():
        ex = html.escape(excerpt.strip())
        if len(ex) > 400:
            ex = ex[:397] + "…"
        lines.extend(["", ex])
    lines.extend(["", f'<a href="{safe_url}">Читать на сайте →</a>'])
    text = "\n".join(lines)
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            use_photo = bool(
                cover_image_url
                and (
                    cover_image_url.startswith("http://")
                    or cover_image_url.startswith("https://")
                )
            )
            if use_photo:
                cap = text if len(text) <= 1024 else (text[:1021] + "…")
                resp = await client.post(
                    f"{TELEGRAM_API}/sendPhoto",
                    json={
                        "chat_id": chat,
                        "photo": cover_image_url,
                        "caption": cap,
                        "parse_mode": "HTML",
                    },
                )
            else:
                resp = await client.post(
                    f"{TELEGRAM_API}/sendMessage",
                    json={
                        "chat_id": chat,
                        "text": text[:4096],
                        "parse_mode": "HTML",
                        "disable_web_page_preview": False,
                    },
                )
            data = resp.json()
            if not data.get("ok"):
                err = data.get("description") or resp.text
                logger.error("Telegram blog publish failed: %s", err)
                return None, str(err)
            result = data.get("result") or {}
            mid = result.get("message_id")
            return (int(mid) if mid is not None else None), None
    except Exception as e:
        logger.exception("publish_blog_post_to_telegram: %s", e)
        return None, str(e)


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
