"""Telegram linking and webhook routes."""
import logging
import os
import secrets
import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from database import get_db
from models import User, TelegramLinkCode
from schemas import TelegramLinkRequestResponse, TelegramLinkStatusResponse
from auth import get_current_user_required
from telegram_bot import process_telegram_update, send_telegram_message, BOT_USERNAME, BOT_TOKEN

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["telegram"])

LINK_CODE_TTL_MINUTES = 5


def _generate_code() -> str:
    chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return "".join(secrets.choice(chars) for _ in range(6))


@router.post("/telegram-link/request", response_model=TelegramLinkRequestResponse)
def request_telegram_link(
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    if not BOT_TOKEN:
        raise HTTPException(status_code=503, detail="Telegram-бот не настроен на сервере")
    if user.telegram_id:
        raise HTTPException(status_code=400, detail="Telegram уже привязан")

    db.query(TelegramLinkCode).filter(
        TelegramLinkCode.user_id == user.id,
        TelegramLinkCode.used == False,
    ).update({"used": True})

    for _ in range(10):
        code = _generate_code()
        existing = db.query(TelegramLinkCode).filter(TelegramLinkCode.code == code).first()
        if not existing:
            break
    else:
        raise HTTPException(status_code=500, detail="Не удалось сгенерировать код")

    expires_at = datetime.utcnow() + timedelta(minutes=LINK_CODE_TTL_MINUTES)

    link_code = TelegramLinkCode(
        id=f"tlc-{uuid.uuid4().hex[:12]}",
        code=code,
        user_id=user.id,
        created_at=datetime.utcnow(),
        expires_at=expires_at,
    )
    db.add(link_code)
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        logger.exception("Failed to create link code: %s", e)
        raise HTTPException(status_code=500, detail="Ошибка при создании кода")

    return TelegramLinkRequestResponse(
        code=code,
        expires_in=LINK_CODE_TTL_MINUTES * 60,
        bot_url=f"https://t.me/{BOT_USERNAME}",
    )


@router.get("/telegram-link/status", response_model=TelegramLinkStatusResponse)
def check_telegram_link_status(
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    db.refresh(user)
    return TelegramLinkStatusResponse(
        linked=user.telegram_id is not None,
        telegram_username=user.telegram_username,
    )


@router.delete("/telegram-unlink")
async def unlink_telegram(
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    if not user.telegram_id:
        raise HTTPException(status_code=400, detail="Telegram не привязан")

    old_telegram_id = user.telegram_id

    user.telegram_id = None
    user.telegram_username = None

    contacts = dict(user.contacts or {})
    contacts.pop("telegram", None)
    user.contacts = contacts
    user.telegram_linked_at = None

    if user.notification_settings:
        user.notification_settings.notifications_enabled = False

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        logger.exception("Failed to unlink telegram: %s", e)
        raise HTTPException(status_code=500, detail="Ошибка при отвязке")

    await send_telegram_message(
        old_telegram_id,
        "ℹ️ Ваш аккаунт на DorogaDomoy.by отвязан. Уведомления остановлены.\n\n"
        "Чтобы привязать снова — зайдите в настройки на сайте.",
    )

    return {"detail": "Telegram отвязан"}


@router.post("/telegram-webhook")
async def telegram_webhook(request: Request):
    """Endpoint for Telegram Bot webhook."""
    try:
        update = await request.json()
        await process_telegram_update(update)
    except Exception as e:
        logger.exception("Error processing telegram webhook: %s", e)
    return {"ok": True}
