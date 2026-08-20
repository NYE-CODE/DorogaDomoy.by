"""Register / unregister mobile push device tokens (FCM)."""
from __future__ import annotations

import logging
import uuid
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from auth import get_current_user_required
from database import get_db
from models import DeviceToken, User
from rate_limit import limiter
from time_utils import utc_now

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/device-tokens", tags=["device-tokens"])

MAX_DEVICES_PER_USER = 10
Platform = Literal["android", "ios", "web"]


class DeviceTokenUpsert(BaseModel):
    token: str = Field(..., min_length=20, max_length=4096)
    platform: Platform = "android"


class DeviceTokenResponse(BaseModel):
    ok: bool = True
    id: str
    platform: str


def _active_token_count(db: Session, user_id: str) -> int:
    return int(
        db.scalar(
            select(func.count())
            .select_from(DeviceToken)
            .where(
                DeviceToken.user_id == user_id,
                DeviceToken.is_active.is_(True),
            )
        )
        or 0
    )


@router.post("", response_model=DeviceTokenResponse, status_code=201)
@limiter.limit("30/minute")
def upsert_device_token(
    request: Request,
    body: DeviceTokenUpsert,
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    token = body.token.strip()
    if not token:
        raise HTTPException(status_code=400, detail="token обязателен")
    platform = body.platform

    existing = db.scalar(select(DeviceToken).where(DeviceToken.token == token))
    now = utc_now()
    if existing:
        if existing.user_id != user.id:
            # Handoff to another account still counts against the new owner's cap.
            if _active_token_count(db, user.id) >= MAX_DEVICES_PER_USER:
                raise HTTPException(
                    status_code=400,
                    detail=f"Слишком много устройств (макс. {MAX_DEVICES_PER_USER})",
                )
            logger.info(
                "FCM token reassigned from user %s to %s",
                existing.user_id,
                user.id,
            )
        existing.user_id = user.id
        existing.platform = platform
        existing.is_active = True
        existing.updated_at = now
        db.commit()
        db.refresh(existing)
        return DeviceTokenResponse(id=existing.id, platform=existing.platform)

    if _active_token_count(db, user.id) >= MAX_DEVICES_PER_USER:
        raise HTTPException(
            status_code=400,
            detail=f"Слишком много устройств (макс. {MAX_DEVICES_PER_USER})",
        )

    row = DeviceToken(
        id=f"dt-{uuid.uuid4().hex[:12]}",
        user_id=user.id,
        token=token,
        platform=platform,
        is_active=True,
        created_at=now,
        updated_at=now,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return DeviceTokenResponse(id=row.id, platform=row.platform)


@router.delete("", status_code=204)
@limiter.limit("30/minute")
def delete_device_token(
    request: Request,
    body: DeviceTokenUpsert,
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    token = body.token.strip()
    row = db.scalar(
        select(DeviceToken).where(
            DeviceToken.token == token,
            DeviceToken.user_id == user.id,
        )
    )
    if row:
        db.delete(row)
        db.commit()
    return None
