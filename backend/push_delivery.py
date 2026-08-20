"""Deliver push via FCM to a user's registered device tokens."""
from __future__ import annotations

import logging
import re

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from integrations.fcm import send_fcm_to_tokens
from models import DeviceToken
from time_utils import utc_now

logger = logging.getLogger(__name__)


def _plain(text: str) -> str:
    t = re.sub(r"<[^>]+>", "", text or "")
    return t.replace("&nbsp;", " ").strip()


def push_to_user(
    db: Session,
    *,
    user_id: str,
    title: str,
    message: str,
    data: dict[str, str] | None = None,
) -> bool:
    tokens = list(
        db.scalars(
            select(DeviceToken.token).where(
                DeviceToken.user_id == user_id,
                DeviceToken.is_active.is_(True),
            )
        ).all()
    )
    if not tokens:
        return False
    sent, invalid = send_fcm_to_tokens(
        tokens,
        title=title,
        body=_plain(message),
        data=data,
    )
    if invalid:
        try:
            db.execute(
                update(DeviceToken)
                .where(
                    DeviceToken.user_id == user_id,
                    DeviceToken.token.in_(invalid),
                )
                .values(is_active=False, updated_at=utc_now())
            )
            db.flush()
            logger.info(
                "Deactivated %s invalid FCM token(s) for user %s",
                len(invalid),
                user_id,
            )
        except Exception:
            logger.exception("Failed to deactivate invalid FCM tokens for %s", user_id)
    return sent > 0
