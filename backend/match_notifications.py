"""Уведомления владельцам похожих объявлений при публикации нового (lost ↔ found)."""
from __future__ import annotations

import logging
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from database import SessionLocal
from models import Notification, NotificationSettings, Pet, User
from pet_similarity import DEFAULT_RADIUS_KM, find_similar_pets
from watch_zone import passes_watch_zone
from telegram_bot import (
    ANIMAL_TYPE_LABELS,
    BOT_TOKEN,
    OPPOSITE_STATUS,
    SITE_URL,
    STATUS_LABELS,
    _send_telegram_message_sync,
)
from time_utils import utc_now

logger = logging.getLogger(__name__)

MIN_MATCH_PERCENT = 55
SIMILAR_MATCH_NOTIFY_LIMIT = 15

REASON_LABELS: dict[str, str] = {
    "same_breed": "порода",
    "similar_breed": "похожая порода",
    "related_breed": "родственная порода",
    "same_color": "окрас",
    "similar_color": "похожий окрас",
    "same_gender": "пол",
    "same_age": "возраст",
    "similar_description": "описание",
    "matching_marks": "общие приметы",
    "visual_similarity": "похоже на фото",
    "very_nearby": "очень близко",
    "nearby": "рядом",
    "same_area": "в районе",
    "same_city": "тот же город",
}


def send_similar_match_notifications_sync(pet_id: str) -> None:
    """Фоновая задача: уведомить владельцев похожих объявлений о новом кандидате."""
    db = SessionLocal()
    try:
        pet = db.scalar(select(Pet).where(Pet.id == pet_id))
        if pet:
            _send_similar_match_notifications(pet, db)
    except Exception as e:
        logger.exception("send_similar_match_notifications_sync failed for %s: %s", pet_id, e)
    finally:
        db.close()


def _format_reasons(reasons: list[str], limit: int = 4) -> str:
    labels: list[str] = []
    for key in reasons:
        label = REASON_LABELS.get(key)
        if label and label not in labels:
            labels.append(label)
        if len(labels) >= limit:
            break
    return ", ".join(labels) if labels else "характеристики"


def _already_notified(db: Session, user_id: str, pet_id: str) -> bool:
    existing = db.scalar(
        select(Notification.id).where(
            Notification.user_id == user_id,
            Notification.pet_id == pet_id,
        ).limit(1)
    )
    return existing is not None


def _send_similar_match_notifications(pet: Pet, db: Session) -> None:
    if (pet.pet_scope or "lost_found") != "lost_found":
        return
    if pet.moderation_status != "approved" or pet.is_archived:
        return
    if pet.status not in OPPOSITE_STATUS:
        return

    matches = find_similar_pets(
        db,
        pet,
        limit=SIMILAR_MATCH_NOTIFY_LIMIT,
        radius_km=DEFAULT_RADIUS_KM,
    )
    qualified = [m for m in matches if m.get("match_percent", 0) >= MIN_MATCH_PERCENT]
    if not qualified:
        return

    new_status_label = STATUS_LABELS.get(pet.status, pet.status)
    new_animal_label = ANIMAL_TYPE_LABELS.get(pet.animal_type, pet.animal_type)
    new_breed_text = f" ({pet.breed})" if pet.breed else ""

    owner_ids = {
        m["pet"].author_id
        for m in qualified
        if m["pet"].author_id and m["pet"].author_id != pet.author_id
    }
    owners_by_id = {
        u.id: u
        for u in db.scalars(select(User).where(User.id.in_(owner_ids))).all()
    } if owner_ids else {}
    from models import DeviceToken

    push_owner_ids = set(
        db.scalars(
            select(DeviceToken.user_id).where(
                DeviceToken.user_id.in_(owner_ids),
                DeviceToken.is_active.is_(True),
            ).distinct()
        ).all()
    ) if owner_ids else set()
    settings_by_user = {
        ns.user_id: ns
        for ns in db.scalars(
            select(NotificationSettings).where(NotificationSettings.user_id.in_(owner_ids))
        ).all()
    } if owner_ids else {}

    for match in qualified:
        candidate: Pet = match["pet"]
        owner_id = candidate.author_id
        if not owner_id or owner_id == pet.author_id:
            continue
        if _already_notified(db, owner_id, pet.id):
            continue

        owner = owners_by_id.get(owner_id)
        if not owner or owner.is_blocked:
            continue
        has_push = owner_id in push_owner_ids
        if not owner.telegram_id and not has_push:
            continue

        ns = settings_by_user.get(owner_id)
        if ns and not ns.notifications_enabled:
            continue
        if ns and getattr(ns, "notify_similar_matches", True) is False:
            continue
        if ns and ns.notify_animal_types and pet.animal_type not in ns.notify_animal_types:
            continue
        if not passes_watch_zone(ns, pet):
            continue

        own_status_label = STATUS_LABELS.get(candidate.status, candidate.status)
        match_percent = match["match_percent"]
        dist = match.get("distance_km")
        reasons_text = _format_reasons(match.get("reasons") or [])

        message = (
            f"🔍 <b>Возможное совпадение — {match_percent}%</b>\n\n"
            f"Новое объявление «{new_status_label}»: {new_animal_label}{new_breed_text}\n"
            f"похоже на ваше «{own_status_label}»"
        )
        if candidate.breed:
            message += f" ({candidate.breed})"
        message += "\n"
        if dist is not None:
            message += f"📍 ~{dist:.1f} км\n"
        message += f"Совпадения: {reasons_text}"

        keyboard = {
            "inline_keyboard": [
                [
                    {"text": "Новое объявление", "url": f"{SITE_URL}/pet/{pet.id}"},
                    {"text": "Ваше объявление", "url": f"{SITE_URL}/pet/{candidate.id}"},
                ]
            ]
        }
        channels: list[str] = []
        if BOT_TOKEN and owner.telegram_id:
            sent = _send_telegram_message_sync(owner.telegram_id, message, reply_markup=keyboard)
            if sent:
                channels.append("telegram")
        try:
            from push_delivery import push_to_user

            if push_to_user(
                db,
                user_id=owner.id,
                title="Возможное совпадение",
                message=message,
                data={"pet_id": pet.id, "type": "similar_match"},
            ):
                channels.append("fcm")
        except Exception:
            logger.exception("FCM similar_match failed for %s", owner.id)

        db.add(
            Notification(
                id=f"notif-{uuid.uuid4().hex[:12]}",
                user_id=owner.id,
                pet_id=pet.id,
                type="similar_match",
                message=message,
                sent_via=",".join(channels) if channels else "failed",
                sent_at=utc_now(),
            )
        )

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        logger.exception("Failed to save similar match notifications: %s", e)
