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
DEFAULT_LISTING_REMINDER_DAYS = (3, 1)

NOTIFICATION_TYPE_EXPIRED = "listing_expired"


def notification_type_expiring(days_left: int) -> str:
    return f"listing_expiring_{days_left}d"


def parse_listing_reminder_days(raw: str | None) -> tuple[int, ...]:
    """Парсит «3,1» или «7, 3, 1» → уникальные дни по убыванию."""
    if not raw or not str(raw).strip():
        return DEFAULT_LISTING_REMINDER_DAYS
    parsed: list[int] = []
    for part in str(raw).split(","):
        part = part.strip()
        if not part:
            continue
        try:
            day = int(part)
        except (TypeError, ValueError):
            continue
        if 1 <= day <= 90 and day not in parsed:
            parsed.append(day)
    if not parsed:
        return DEFAULT_LISTING_REMINDER_DAYS
    return tuple(sorted(parsed, reverse=True))


def get_listing_reminder_days(db: Session) -> tuple[int, ...]:
    from platform_settings import get_setting_value

    raw = get_setting_value(db, "listing_reminder_days", "3,1")
    return parse_listing_reminder_days(raw)


def max_listing_reminder_days(db: Session) -> int:
    return max(get_listing_reminder_days(db), default=1)


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


def _reminder_message(pet: Pet, days_left: int) -> str:
    summary = _pet_summary(pet)
    if days_left == 1:
        return (
            "⚠️ <b>Завтра истекает срок размещения</b>\n\n"
            f"{summary}\n\n"
            "Остался <b>1 день</b>. Продлите публикацию, иначе объявление уйдёт в архив."
        )
    return (
        "⏳ <b>Скоро истечёт срок размещения</b>\n\n"
        f"{summary}\n\n"
        f"Осталось <b>{days_left} дн.</b> Продлите публикацию, чтобы объявление оставалось в ленте."
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
    if not user.telegram_id or user.is_blocked:
        return False
    if _reminder_already_sent(
        db,
        user_id=user.id,
        pet_id=pet.id,
        notif_type=notif_type,
        period_start=period_start,
    ):
        return False
    keyboard = {
        "inline_keyboard": [
            [{"text": "Продлить публикацию", "url": f"{SITE_URL}/my-ads"}],
            [{"text": "Открыть объявление", "url": f"{SITE_URL}/pet/{pet.id}"}],
        ]
    }
    ok = _send_telegram_message_sync(user.telegram_id, message, reply_markup=keyboard)
    _record_notification(
        db,
        user_id=user.id,
        pet_id=pet.id,
        notif_type=notif_type,
        message=message,
        sent_via="telegram" if ok else "failed",
    )
    return ok


def _ensure_expires_at(db: Session, pet: Pet, now: datetime, reminder_days: tuple[int, ...]) -> None:
    """Для старых объявлений без expires_at — выставить срок; дать окно напоминаний."""
    if pet.expires_at is not None:
        return
    if not pet.published_at:
        pet.expires_at = compute_listing_expires_at(db, now)
        pet.updated_at = now
        return
    computed = compute_listing_expires_at(db, pet.published_at)
    if computed <= now:
        grace = max(reminder_days) if reminder_days else 1
        pet.expires_at = now + timedelta(days=grace)
    else:
        pet.expires_at = computed
    pet.updated_at = now


def run_listing_lifecycle(db: Session) -> dict:
    """Напоминания за N дней до истечения (из настроек) + автоархивация по expires_at."""
    now = utc_now()
    reminder_days = get_listing_reminder_days(db)
    stats: dict = {
        "reminders": {},
        "archived": 0,
        "expired_notified": 0,
        "backfilled_expires_at": 0,
        "legacy_grace_applied": 0,
    }
    for day in reminder_days:
        stats["reminders"][str(day)] = 0

    active = db.scalars(
        select(Pet).where(
            Pet.pet_scope == "lost_found",
            Pet.moderation_status == "approved",
            Pet.is_archived.is_(False),
        )
    ).all()

    for pet in active:
        if pet.expires_at is None:
            _ensure_expires_at(db, pet, now, reminder_days)
            stats["backfilled_expires_at"] += 1

        expires_at = pet.expires_at
        if not expires_at:
            continue

        if expires_at <= now:
            days_overdue = (now.date() - expires_at.date()).days
            if days_overdue > 1:
                grace = max(reminder_days) if reminder_days else 1
                pet.expires_at = now + timedelta(days=grace)
                pet.updated_at = now
                stats["legacy_grace_applied"] = stats.get("legacy_grace_applied", 0) + 1
                continue

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
        if days_left not in reminder_days:
            continue

        author = db.scalar(select(User).where(User.id == pet.author_id))
        if not author:
            continue

        period_start = listing_period_start(expires_at, db)
        notif_type = notification_type_expiring(days_left)
        msg = _reminder_message(pet, days_left)

        if _send_listing_telegram(
            db,
            user=author,
            pet=pet,
            notif_type=notif_type,
            message=msg,
            period_start=period_start,
        ):
            stats["reminders"][str(days_left)] = stats["reminders"].get(str(days_left), 0) + 1

    db.commit()
    return stats
