"""Уведомления в Telegram подписчикам приютов (новые сборы, закрытые сборы, новые питомцы)."""
from __future__ import annotations

import html
import logging
import os
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import SessionLocal
from models import Pet, Shelter, ShelterCampaign, ShelterPetDetails, ShelterSubscription, User
from telegram_bot import _send_telegram_message_sync

logger = logging.getLogger(__name__)

SITE_URL = os.getenv("SITE_URL", "https://dorogadomoy.by").rstrip("/")


def _esc(s: str | None) -> str:
    return html.escape((s or "").strip(), quote=False)


def _subscriber_chat_ids(db: Session, shelter_id: str) -> list[int]:
    rows = db.scalars(
        select(User.telegram_id)
        .join(ShelterSubscription, ShelterSubscription.user_id == User.id)
        .where(ShelterSubscription.shelter_id == shelter_id, User.telegram_id.isnot(None)),
    ).all()
    out: list[int] = []
    for tg in rows:
        if tg is not None:
            try:
                out.append(int(tg))
            except (TypeError, ValueError):
                continue
    return out


def _pet_public_title(db: Session, pet: Pet) -> str:
    det = db.scalar(select(ShelterPetDetails).where(ShelterPetDetails.pet_id == pet.id))
    nick = (getattr(det, "nickname", None) or "").strip() if det else ""
    if nick:
        return nick
    breed = (pet.breed or "").strip()
    if breed:
        return breed
    # animal type label minimal
    at = (pet.animal_type or "").strip().lower()
    if at == "dog":
        return "Собака"
    if at == "cat":
        return "Кошка"
    return "Питомец"


def schedule_campaign_activated_notifications(campaign_id: str) -> None:
    db = SessionLocal()
    try:
        campaign = db.scalar(select(ShelterCampaign).where(ShelterCampaign.id == campaign_id))
        if not campaign or campaign.status != "active":
            return
        pet = db.scalar(select(Pet).where(Pet.id == campaign.pet_id))
        shelter = db.scalar(select(Shelter).where(Shelter.id == campaign.shelter_id))
        if not pet or not shelter:
            return
        chat_ids = _subscriber_chat_ids(db, shelter.id)
        if not chat_ids:
            return
        pet_url = f"{SITE_URL}/shelter-pet/{pet.id}"
        title = _pet_public_title(db, pet)
        lines = [
            "🔔 <b>Новый сбор</b>",
            "",
            f"Приют: {_esc(shelter.name)}",
            f"Питомец: {_esc(title)}",
            f"Сбор: {_esc(campaign.title)}",
            f"Цель: {campaign.goal_amount} BYN",
            "",
            f'<a href="{pet_url}">Открыть карточку →</a>',
        ]
        text = "\n".join(lines)
        for cid in chat_ids:
            _send_telegram_message_sync(cid, text)
    except Exception:
        logger.exception("schedule_campaign_activated_notifications failed for %s", campaign_id)
    finally:
        db.close()


def schedule_campaign_closed_notifications(campaign_id: str) -> None:
    db = SessionLocal()
    try:
        campaign = db.scalar(select(ShelterCampaign).where(ShelterCampaign.id == campaign_id))
        if not campaign or campaign.status not in ("completed", "cancelled"):
            return
        pet = db.scalar(select(Pet).where(Pet.id == campaign.pet_id))
        shelter = db.scalar(select(Shelter).where(Shelter.id == campaign.shelter_id))
        if not pet or not shelter:
            return
        chat_ids = _subscriber_chat_ids(db, shelter.id)
        if not chat_ids:
            return
        pet_url = f"{SITE_URL}/shelter-pet/{pet.id}"
        title = _pet_public_title(db, pet)
        status_ru = "Завершён" if campaign.status == "completed" else "Отменён"
        lines = [
            f"🏁 <b>Сбор {status_ru.lower()}</b>",
            "",
            f"Приют: {_esc(shelter.name)}",
            f"Питомец: {_esc(title)}",
            f"Сбор: {_esc(campaign.title)}",
            f"Собрано: {campaign.collected_amount} / {campaign.goal_amount} BYN",
        ]
        if campaign.close_reason:
            lines.extend(["", f"Причина: {_esc(campaign.close_reason[:400])}"])
        lines.extend(["", f'<a href="{pet_url}">Открыть карточку →</a>'])
        text = "\n".join(lines)
        for cid in chat_ids:
            _send_telegram_message_sync(cid, text)
    except Exception:
        logger.exception("schedule_campaign_closed_notifications failed for %s", campaign_id)
    finally:
        db.close()


def schedule_new_shelter_pet_notifications(pet_id: str) -> None:
    db = SessionLocal()
    try:
        pet = db.scalar(select(Pet).where(Pet.id == pet_id))
        if not pet or pet.pet_scope != "shelter_pet" or not pet.shelter_id:
            return
        shelter = db.scalar(select(Shelter).where(Shelter.id == pet.shelter_id))
        if not shelter:
            return
        chat_ids = _subscriber_chat_ids(db, shelter.id)
        if not chat_ids:
            return
        pet_url = f"{SITE_URL}/shelter-pet/{pet.id}"
        title = _pet_public_title(db, pet)
        lines = [
            "🐾 <b>Новый питомец в приюте</b>",
            "",
            f"Приют: {_esc(shelter.name)}",
            f"Кличка / карточка: {_esc(title)}",
            "",
            f'<a href="{pet_url}">Открыть профиль →</a>',
        ]
        text = "\n".join(lines)
        for cid in chat_ids:
            _send_telegram_message_sync(cid, text)
    except Exception:
        logger.exception("schedule_new_shelter_pet_notifications failed for %s", pet_id)
    finally:
        db.close()
