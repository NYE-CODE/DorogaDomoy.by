"""Notification settings and notification list routes."""
import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import User, NotificationSettings, Notification
from schemas import NotificationSettingsResponse, NotificationSettingsUpdate, NotificationResponse
from auth import get_current_user_required
from time_utils import utc_now

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/notifications", tags=["notifications"])


def _get_or_create_settings(user: User, db: Session) -> NotificationSettings:
    ns = db.scalar(select(NotificationSettings).where(NotificationSettings.user_id == user.id))
    if not ns:
        ns = NotificationSettings(
            id=f"ns-{uuid.uuid4().hex[:12]}",
            user_id=user.id,
            created_at=utc_now(),
            updated_at=utc_now(),
        )
        db.add(ns)
        db.commit()
        db.refresh(ns)
    return ns


@router.get("/settings", response_model=NotificationSettingsResponse)
def get_notification_settings(
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    ns = _get_or_create_settings(user, db)
    return NotificationSettingsResponse(
        notifications_enabled=ns.notifications_enabled,
        notification_radius_km=ns.notification_radius_km,
    )


@router.patch("/settings", response_model=NotificationSettingsResponse)
def update_notification_settings(
    data: NotificationSettingsUpdate,
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    ns = _get_or_create_settings(user, db)

    if data.notifications_enabled is not None:
        if data.notifications_enabled and not user.telegram_id:
            raise HTTPException(
                status_code=400,
                detail="Привяжите Telegram перед включением уведомлений",
            )
        ns.notifications_enabled = data.notifications_enabled

    if data.notification_radius_km is not None:
        ns.notification_radius_km = data.notification_radius_km

    ns.updated_at = utc_now()

    try:
        db.commit()
        db.refresh(ns)
    except Exception as e:
        db.rollback()
        logger.exception("Failed to update notification settings: %s", e)
        raise HTTPException(status_code=500, detail="Ошибка при сохранении настроек")

    return NotificationSettingsResponse(
        notifications_enabled=ns.notifications_enabled,
        notification_radius_km=ns.notification_radius_km,
    )


@router.get("", response_model=list[NotificationResponse])
def list_notifications(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    notifications = db.scalars(
        select(Notification)
        .where(Notification.user_id == user.id)
        .order_by(Notification.sent_at.desc())
        .offset(offset)
        .limit(limit)
    ).all()
    return [
        NotificationResponse(
            id=n.id,
            pet_id=n.pet_id,
            type=n.type,
            message=n.message,
            is_read=n.is_read,
            sent_via=n.sent_via,
            sent_at=n.sent_at,
        )
        for n in notifications
    ]


@router.patch("/{notification_id}/read")
def mark_notification_read(
    notification_id: str,
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    notification = db.scalar(
        select(Notification).where(Notification.id == notification_id, Notification.user_id == user.id)
    )
    if not notification:
        raise HTTPException(status_code=404, detail="Уведомление не найдено")

    notification.is_read = True
    db.commit()
    return {"detail": "ok"}
