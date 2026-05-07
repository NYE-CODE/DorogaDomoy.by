"""Подписка на уведомления о приюте в Telegram (см. shelter_subscription_notify)."""
from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from auth import get_current_user, get_current_user_required
from database import get_db
from models import Shelter, ShelterSubscription, User
from routers.shelters import _can_view, _invited_or_active_membership
from schemas import ShelterSubscriptionOkResponse, ShelterSubscriptionStatusResponse

router = APIRouter(prefix="/shelters", tags=["shelter_subscriptions"])


def _assert_shelter_accessible(db: Session, shelter: Shelter, user: Optional[User]) -> None:
    if _can_view(user, shelter):
        return
    if user is not None and _invited_or_active_membership(db, shelter.id, user.id):
        return
    raise HTTPException(status_code=404, detail="Не найдено")


@router.get("/{shelter_id}/subscription-status", response_model=ShelterSubscriptionStatusResponse)
def subscription_status(
    shelter_id: str,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user),
):
    sh = db.scalar(select(Shelter).where(Shelter.id == shelter_id))
    if not sh:
        raise HTTPException(status_code=404, detail="Не найдено")
    _assert_shelter_accessible(db, sh, user)
    cnt = db.scalar(
        select(func.count()).select_from(ShelterSubscription).where(ShelterSubscription.shelter_id == shelter_id)
    )
    cnt = int(cnt or 0)
    subscribed = False
    if user is not None:
        subscribed = (
            db.scalar(
                select(ShelterSubscription.id).where(
                    ShelterSubscription.shelter_id == shelter_id,
                    ShelterSubscription.user_id == user.id,
                )
            )
            is not None
        )
    return ShelterSubscriptionStatusResponse(subscriber_count=cnt, subscribed=subscribed)


@router.post("/{shelter_id}/subscribe", response_model=ShelterSubscriptionOkResponse)
def subscribe(
    shelter_id: str,
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    if user.telegram_id is None:
        raise HTTPException(
            status_code=400,
            detail="Привяжите Telegram в профиле, чтобы подписаться на уведомления",
        )
    sh = db.scalar(select(Shelter).where(Shelter.id == shelter_id))
    if not sh:
        raise HTTPException(status_code=404, detail="Не найдено")
    _assert_shelter_accessible(db, sh, user)
    existing = db.scalar(
        select(ShelterSubscription).where(
            ShelterSubscription.shelter_id == shelter_id,
            ShelterSubscription.user_id == user.id,
        )
    )
    if existing:
        return ShelterSubscriptionOkResponse()
    row = ShelterSubscription(
        id="ssub-" + str(uuid.uuid4())[:10],
        user_id=user.id,
        shelter_id=shelter_id,
    )
    db.add(row)
    db.commit()
    return ShelterSubscriptionOkResponse()


@router.delete("/{shelter_id}/subscribe", response_model=ShelterSubscriptionOkResponse)
def unsubscribe(
    shelter_id: str,
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    sh = db.scalar(select(Shelter).where(Shelter.id == shelter_id))
    if not sh:
        raise HTTPException(status_code=404, detail="Не найдено")
    _assert_shelter_accessible(db, sh, user)
    sub = db.scalar(
        select(ShelterSubscription).where(
            ShelterSubscription.shelter_id == shelter_id,
            ShelterSubscription.user_id == user.id,
        )
    )
    if sub:
        db.delete(sub)
        db.commit()
    return ShelterSubscriptionOkResponse()
