"""Background worker for processing Instagram publication queue."""
from __future__ import annotations

import logging
import os
from datetime import timedelta

from sqlalchemy import select

from database import SessionLocal
from integrations.instagram import (
    InstagramPublishError,
    publish_image,
)
from models import InstagramPublication, Pet
from token_crypto import decrypt_token
from time_utils import utc_now

logger = logging.getLogger(__name__)

SITE_URL = os.getenv("SITE_URL", "https://dorogadomoy.by").rstrip("/")
# Публичный префикс REST API (по умолчанию версия v1).
API_PUBLIC_BASE = os.getenv("API_PUBLIC_BASE", f"{SITE_URL}/api/v1").rstrip("/")
PUBLISH_MAX_ATTEMPTS = int(os.getenv("INSTAGRAM_PUBLISH_MAX_ATTEMPTS", "3"))
PROCESSING_STALE_MINUTES = int(os.getenv("INSTAGRAM_PROCESSING_STALE_MINUTES", "15"))


def _build_card_url(pet_id: str, fmt: str) -> str:
    # Instagram publisher now supports story-only output.
    _ = fmt
    return f"{API_PUBLIC_BASE}/pets/{pet_id}/social-card?format=story"


def _pick_next_publication(db) -> InstagramPublication | None:
    stale_before = utc_now() - timedelta(minutes=PROCESSING_STALE_MINUTES)
    stale_processing = db.scalars(
        select(InstagramPublication).where(
            InstagramPublication.status == "processing",
            InstagramPublication.updated_at < stale_before,
        )
    ).all()
    for row in stale_processing:
        row.status = "pending"
        row.last_error = "Reset stale processing state"
        row.updated_at = utc_now()
    if stale_processing:
        db.commit()

    return db.scalar(
        select(InstagramPublication)
        .where(InstagramPublication.status == "pending")
        .order_by(InstagramPublication.created_at.asc())
        .limit(1)
    )


def _fail_row(row: InstagramPublication, msg: str) -> None:
    row.last_error = msg[:2000]
    row.updated_at = utc_now()
    if (row.attempts or 0) >= PUBLISH_MAX_ATTEMPTS:
        row.status = "failed"
    else:
        row.status = "pending"


def _process_row(db, row: InstagramPublication) -> bool:
    pet = db.scalar(select(Pet).where(Pet.id == row.pet_id))
    if not pet:
        row.status = "failed"
        _fail_row(row, "Pet not found")
        db.commit()
        return True

    if not row.account_id or not row.account or not row.account.is_active:
        _fail_row(row, "Instagram account is not configured or inactive")
        db.commit()
        return True

    instagram_business_id = (row.account.instagram_business_id or "").strip()
    if not instagram_business_id:
        _fail_row(row, "Instagram account business id is missing")
        db.commit()
        return True

    try:
        access_token = decrypt_token(row.account.access_token)
    except ValueError:
        _fail_row(row, "Cannot decrypt Instagram access token")
        db.commit()
        return True
    if not access_token:
        _fail_row(row, "Instagram account token is missing")
        db.commit()
        return True

    if row.format != "story":
        row.status = "cancelled"
        row.last_error = "Feed format is no longer supported"
        row.updated_at = utc_now()
        db.commit()
        return True

    is_story = True
    image_url = _build_card_url(pet.id, row.format)
    caption = None

    try:
        result = publish_image(
            instagram_business_id=instagram_business_id,
            access_token=access_token,
            image_url=image_url,
            caption=caption,
            is_story=is_story,
        )
    except InstagramPublishError as e:
        _fail_row(row, str(e))
        db.commit()
        logger.warning("Instagram publish failed for %s: %s", row.id, e)
        return True
    except Exception as e:
        _fail_row(row, f"Unexpected error: {e}")
        db.commit()
        logger.exception("Unexpected Instagram publish error for %s", row.id)
        return True

    row.status = "published"
    row.external_media_id = result.media_id
    row.last_error = None
    row.published_at = utc_now()
    row.updated_at = utc_now()
    db.commit()
    logger.info("Instagram publication %s published as %s", row.id, result.media_id)
    return True


def process_publication_by_id(publication_id: str) -> bool:
    db = SessionLocal()
    try:
        row = db.scalar(select(InstagramPublication).where(InstagramPublication.id == publication_id))
        if not row:
            return False
        if row.status == "published":
            return True
        if row.status == "cancelled":
            return True
        row.status = "processing"
        row.attempts = (row.attempts or 0) + 1
        row.updated_at = utc_now()
        db.commit()
        db.refresh(row)
        return _process_row(db, row)
    finally:
        db.close()


def process_single_publication() -> bool:
    """Process one queue item. Returns True when work item was handled."""
    db = SessionLocal()
    try:
        row = _pick_next_publication(db)
        if not row:
            return False
        row.status = "processing"
        row.attempts = (row.attempts or 0) + 1
        row.updated_at = utc_now()
        db.commit()
        db.refresh(row)
        return _process_row(db, row)
    finally:
        db.close()
