"""Срок размещения объявлений: продление, напоминания, автоархивация."""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from models import Notification, Pet, User
from platform_settings import get_int_setting
from telegram_bot import SITE_URL, _send_telegram_message_sync, ANIMAL_TYPE_LABELS, STATUS_LABELS
from time_utils import utc_now

logger = logging.getLogger(__name__)

LISTING_EXPIRED_ARCHIVE_REASON = "listing_expired"
LISTING_REMINDER_DAYS = (3, 1)

NOTIFICATION_TYPE_3D = "listing_expiring_3d"
NOTIFICATION_TYPE_1D = "listing_expiring_1d"
NOTIFICATION_TYPE_EXPIRED = "listing_expired"


def compute_listing_expires_at(db: Session, from_dt: Optional[datetime] = None) -> datetime:
    days = get_int_setting(db, "auto_archive_days", default=90)
    base = from_dt or utc_now()
    return base + timedelta(days=days)


def listing_period_start(expires_at: datetime, db: Session) -> datetime:
    days = get_int_setting(db, "auto_archive_days", default=90)
    return expires_at - timedelta(days=days)


def calendar_days_until_expiry(expires_at: datetime, now: Optional[datetime] = None) -> int:
    now = now or utc_now()
    exp_day = expires_at.date()
    cur_day = now.date()
    return (exp_day - cur_day).days


def _pet_summary(pet: Pet) -> str:
    animal = ANIMAL_TYPE_LABELS.get(pet.animal_type, pet.animal_type)
    status = STATUS_LABELS.get(pet.status, pet.status)
    breed = f" ({pet.breed})" if pet.breed else ""
    return f"{status}: {animal}{breed}, {pet.city}"


def _reminder_already_sent(
    db: Session,
    *,
    user_id: str,
    pet_id: str,
    notif_type: str,
    period_start: datetime,
) -> bool:
    row = db.scalar(
        select(Notification.id).where(
            Notification.user_id == user_id,
            Notification.pet_id == pet_id,
            Notification.type == notif_type,
            Notification.sent_at >= period_start,
        ).limit(1)
    )
    return row is not None


def _record_notification(
    db: Session,
    *,
    user_id: str,
    pet_id: str,
    notif_type: str,
    message: str,
    sent_via: str,
) -> None:
    db.add(
        Notification(
            id=f"notif-{uuid.uuid4().hex[:12]}",
            user_id=user_id,
            pet_id=pet_id,
            type=notif_type,
            message=message,
            sent_via=sent_via,
            sent_at=utc_now(),
        )
    )


def _send_listing_telegram(
    db: Session,
    *,
    user: User,
    pet: Pet,
    notif_type: str,
    message: str,
    period_start: datetime,
) -> bool:
    if _reminder_already_sent(
        db,
        user_id=user.id,
        pet_id=pet.id,
        notif_type=notif_type,
        period_start=period_start,
    ):
        return False
    sent_via = "skipped"
    if user.telegram_id and not user.is_blocked:
        keyboard = {
            "inline_keyboard": [
                [{"text": "Продлить публикацию", "url": f"{SITE_URL}/my-ads"}],
                [{"text": "Открыть объявление", "url": f"{SITE_URL}/pet/{pet.id}"}],
            ]
        }
        ok = _send_telegram_message_sync(user.telegram_id, message, reply_markup=keyboard)
        sent_via = "telegram" if ok else "failed"
    _record_notification(
        db,
        user_id=user.id,
        pet_id=pet.id,
        notif_type=notif_type,
        message=message,
        sent_via=sent_via,
    )
    return sent_via == "telegram"


def run_listing_lifecycle(db: Session) -> dict:
    """Напоминания за 3 и 1 день, автоархивация по expires_at."""
    now = utc_now()
    stats = {"reminders_3d": 0, "reminders_1d": 0, "archived": 0, "expired_notified": 0}

    active = db.scalars(
        select(Pet).where(
            Pet.pet_scope == "lost_found",
            Pet.moderation_status == "approved",
            Pet.is_archived.is_(False),
            Pet.expires_at.is_not(None),
        )
    ).all()

    for pet in active:
        expires_at = pet.expires_at
        if not expires_at:
            continue

        if expires_at <= now:
            pet.is_archived = True
            pet.archive_reason = LISTING_EXPIRED_ARCHIVE_REASON
            pet.updated_at = now
            stats["archived"] += 1

            author = db.scalar(select(User).where(User.id == pet.author_id))
            if author:
                period_start = listing_period_start(expires_at, db)
                msg = (
                    "📦 <b>Срок размещения истёк</b>\n\n"
                    f"{_pet_summary(pet)}\n\n"
                    "Объявление перемещено в архив. Если поиск ещё актуален — продлите публикацию."
                )
                if _send_listing_telegram(
                    db,
                    user=author,
                    pet=pet,
                    notif_type=NOTIFICATION_TYPE_EXPIRED,
                    message=msg,
                    period_start=period_start,
                ):
                    stats["expired_notified"] += 1
            continue

        days_left = calendar_days_until_expiry(expires_at, now)
        if days_left not in LISTING_REMINDER_DAYS:
            continue

        author = db.scalar(select(User).where(User.id == pet.author_id))
        if not author:
            continue

        period_start = listing_period_start(expires_at, db)
        if days_left == 3:
            notif_type = NOTIFICATION_TYPE_3D
            msg = (
                "⏳ <b>Скоро истечёт срок размещения</b>\n\n"
                f"{_pet_summary(pet)}\n\n"
                "Осталось <b>3 дня</b>. Продлите публикацию, чтобы объявление оставалось в ленте."
            )
            stat_key = "reminders_3d"
        else:
            notif_type = NOTIFICATION_TYPE_1D
            msg = (
                "⚠️ <b>Завтра истекает срок размещения</b>\n\n"
                f"{_pet_summary(pet)}\n\n"
                "Остался <b>1 день</b>. Продлите публикацию, иначе объявление уйдёт в архив."
            )
            stat_key = "reminders_1d"

        if _send_listing_telegram(
            db,
            user=author,
            pet=pet,
            notif_type=notif_type,
            message=msg,
            period_start=period_start,
        ):
            stats[stat_key] += 1

    db.commit()
    return stats
