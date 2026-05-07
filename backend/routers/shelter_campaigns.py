from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from auth import get_current_user, get_current_user_required
from database import get_db
from models import Pet, ShelterCampaign, ShelterMembership, User
from schemas import (
    ShelterCampaignCloseBody,
    ShelterCampaignCollectedUpdateBody,
    ShelterCampaignCreate,
    ShelterCampaignResponse,
    ShelterCampaignUpdate,
)
from shelter_subscription_notify import (
    schedule_campaign_activated_notifications,
    schedule_campaign_closed_notifications,
)
from time_utils import utc_now

router = APIRouter(tags=["shelter_campaigns"])


def _is_active_member(db: Session, shelter_id: str, user_id: str) -> bool:
    m = db.scalar(
        select(ShelterMembership).where(
            ShelterMembership.shelter_id == shelter_id,
            ShelterMembership.user_id == user_id,
            ShelterMembership.status == "active",
        )
    )
    return m is not None


def _assert_can_manage(db: Session, user: User, shelter_id: str) -> None:
    if user.role == "admin":
        return
    if _is_active_member(db, shelter_id, user.id):
        return
    raise HTTPException(status_code=403, detail="Нет прав управлять сборами этого приюта")


def _get_shelter_pet_or_404(db: Session, pet_id: str) -> Pet:
    pet = db.scalar(select(Pet).where(Pet.id == pet_id, Pet.pet_scope == "shelter_pet"))
    if not pet:
        raise HTTPException(status_code=404, detail="Питомец приюта не найден")
    if not pet.shelter_id:
        raise HTTPException(status_code=400, detail="У питомца не указан shelter_id")
    return pet


@router.get("/shelter-pets/{pet_id}/campaigns", response_model=list[ShelterCampaignResponse])
def list_campaigns_by_pet(
    pet_id: str,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user),
):
    pet = _get_shelter_pet_or_404(db, pet_id)
    stmt = select(ShelterCampaign).where(ShelterCampaign.pet_id == pet.id)
    can_manage = user is not None and (user.role == "admin" or _is_active_member(db, pet.shelter_id, user.id))
    if not can_manage:
        stmt = stmt.where(ShelterCampaign.status.in_(("active", "completed", "cancelled")))
    stmt = stmt.order_by(ShelterCampaign.created_at.desc())
    return db.scalars(stmt).all()


@router.post("/shelter-pets/{pet_id}/campaigns", response_model=ShelterCampaignResponse, status_code=201)
def create_campaign_for_pet(
    pet_id: str,
    data: ShelterCampaignCreate,
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    pet = _get_shelter_pet_or_404(db, pet_id)
    _assert_can_manage(db, user, pet.shelter_id)
    help_details = data.help_details.strip()
    if len(help_details) < 10:
        raise HTTPException(status_code=400, detail="Инструкции по переводу должны быть не короче 10 символов")
    row = ShelterCampaign(
        id="scm-" + str(uuid.uuid4())[:10],
        pet_id=pet.id,
        shelter_id=pet.shelter_id,
        title=data.title.strip(),
        description=(data.description or "").strip() or None,
        help_details=help_details,
        goal_amount=data.goal_amount,
        collected_amount=0,
        status="draft",
        ends_at=data.ends_at,
        created_by_user_id=user.id,
        created_at=utc_now(),
        updated_at=utc_now(),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.patch("/shelter-campaigns/{campaign_id}", response_model=ShelterCampaignResponse)
def update_campaign(
    campaign_id: str,
    data: ShelterCampaignUpdate,
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    row = db.scalar(select(ShelterCampaign).where(ShelterCampaign.id == campaign_id))
    if not row:
        raise HTTPException(status_code=404, detail="Сбор не найден")
    _assert_can_manage(db, user, row.shelter_id)
    if row.status in ("completed", "cancelled"):
        raise HTTPException(status_code=400, detail="Нельзя редактировать завершенный сбор")
    payload = data.model_dump(exclude_unset=True)
    if "title" in payload and payload["title"] is not None:
        row.title = payload["title"].strip()
    if "description" in payload:
        row.description = (payload["description"] or "").strip() or None
    if "help_details" in payload and payload["help_details"] is not None:
        row.help_details = payload["help_details"].strip()
    if "goal_amount" in payload and payload["goal_amount"] is not None:
        row.goal_amount = payload["goal_amount"]
    if "ends_at" in payload:
        row.ends_at = payload["ends_at"]
    row.updated_at = utc_now()
    db.commit()
    db.refresh(row)
    return row


@router.post("/shelter-campaigns/{campaign_id}/activate", response_model=ShelterCampaignResponse)
def activate_campaign(
    campaign_id: str,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    row = db.scalar(select(ShelterCampaign).where(ShelterCampaign.id == campaign_id))
    if not row:
        raise HTTPException(status_code=404, detail="Сбор не найден")
    _assert_can_manage(db, user, row.shelter_id)
    if row.status in ("completed", "cancelled"):
        raise HTTPException(status_code=400, detail="Нельзя активировать завершенный сбор")
    other_active = db.scalar(
        select(ShelterCampaign).where(
            ShelterCampaign.pet_id == row.pet_id,
            ShelterCampaign.status == "active",
            ShelterCampaign.id != row.id,
        )
    )
    if other_active:
        raise HTTPException(status_code=400, detail="У питомца уже есть активный сбор")
    row.status = "active"
    if row.starts_at is None:
        row.starts_at = utc_now()
    row.updated_at = utc_now()
    db.commit()
    db.refresh(row)
    background_tasks.add_task(schedule_campaign_activated_notifications, row.id)
    return row


@router.post("/shelter-campaigns/{campaign_id}/close", response_model=ShelterCampaignResponse)
def close_campaign(
    campaign_id: str,
    body: ShelterCampaignCloseBody,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    row = db.scalar(select(ShelterCampaign).where(ShelterCampaign.id == campaign_id))
    if not row:
        raise HTTPException(status_code=404, detail="Сбор не найден")
    _assert_can_manage(db, user, row.shelter_id)
    if body.action not in ("completed", "cancelled"):
        raise HTTPException(status_code=400, detail="action: completed | cancelled")
    close_reason = body.close_reason.strip()
    if len(close_reason) < 3:
        raise HTTPException(status_code=400, detail="Причина закрытия должна быть не короче 3 символов")
    row.collected_amount = body.collected_amount
    row.close_reason = close_reason
    row.status = body.action
    row.closed_at = utc_now()
    row.updated_at = utc_now()
    db.commit()
    db.refresh(row)
    background_tasks.add_task(schedule_campaign_closed_notifications, row.id)
    return row


@router.post("/shelter-campaigns/{campaign_id}/collected", response_model=ShelterCampaignResponse)
def update_collected_amount(
    campaign_id: str,
    body: ShelterCampaignCollectedUpdateBody,
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    row = db.scalar(select(ShelterCampaign).where(ShelterCampaign.id == campaign_id))
    if not row:
        raise HTTPException(status_code=404, detail="Сбор не найден")
    _assert_can_manage(db, user, row.shelter_id)
    if row.status != "active":
        raise HTTPException(status_code=400, detail="Обновлять сумму можно только для активного сбора")
    row.collected_amount = body.collected_amount
    row.updated_at = utc_now()
    db.commit()
    db.refresh(row)
    return row
