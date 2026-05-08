"""Background worker for processing Instagram publication queue."""
from __future__ import annotations

import logging
import os
from datetime import timedelta

import httpx
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from database import SessionLocal
from integrations.instagram import (
    InstagramPublishError,
    publish_image,
)
from instagram_publications import normalize_region_key, resolve_account_for_region
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


def _validate_card_url(image_url: str) -> str | None:
    """Проверяет, что ссылка карточки публично отдает изображение (200 + image/*)."""
    try:
        with httpx.Client(timeout=20, follow_redirects=True) as client:
            resp = client.get(image_url)
        content_type = (resp.headers.get("content-type") or "").lower()
        if resp.status_code != 200:
            return (
                f"Social card URL returned HTTP {resp.status_code}. "
                f"Check API_PUBLIC_BASE/SITE_URL and public access: {image_url}"
            )
        if not content_type.startswith("image/"):
            return (
                f"Social card URL returned non-image content-type: {content_type or 'unknown'}. "
                f"URL: {image_url}"
            )
        return None
    except Exception as e:
        return f"Cannot fetch social card URL: {e}"


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
        .options(joinedload(InstagramPublication.account))
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


def _finalize_failure(publication_id: str, msg: str) -> None:
    """Обновление статуса в новой короткой сессии после сетевых ошибок."""
    db = SessionLocal()
    try:
        row = db.get(InstagramPublication, publication_id)
        if not row:
            return
        _fail_row(row, msg)
        db.commit()
    finally:
        db.close()


def _finalize_success(publication_id: str, media_id: str) -> None:
    db = SessionLocal()
    try:
        row = db.get(InstagramPublication, publication_id)
        if not row:
            return
        row.status = "published"
        row.external_media_id = media_id
        row.last_error = None
        row.published_at = utc_now()
        row.updated_at = utc_now()
        db.commit()
    finally:
        db.close()


def _process_row(db, row: InstagramPublication) -> bool:
    pet = db.scalar(select(Pet).where(Pet.id == row.pet_id))
    if not pet:
        row.status = "failed"
        _fail_row(row, "Pet not found")
        db.commit()
        return True

    if not row.account_id or not row.account or not row.account.is_active:
        # Queue items can be created before routes/accounts are configured.
        # Re-resolve account on each processing attempt to make retries recoverable.
        region_key = (row.region_key or "").strip() or normalize_region_key(pet.city)
        resolved = resolve_account_for_region(db, region_key)
        if resolved:
            row.account_id = resolved.id
            row.region_key = region_key
            row.updated_at = utc_now()
            db.commit()
            db.refresh(row)

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
    publication_id = row.id

    # Долгие HTTP (карточка + Graph API) без удержания SQLite-сессии и блокировок записи.
    db.commit()
    db.close()

    url_error = _validate_card_url(image_url)
    if url_error:
        _finalize_failure(publication_id, url_error)
        return True

    try:
        result = publish_image(
            instagram_business_id=instagram_business_id,
            access_token=access_token,
            image_url=image_url,
            caption=caption,
            is_story=is_story,
        )
    except InstagramPublishError as e:
        _finalize_failure(publication_id, str(e))
        logger.warning("Instagram publish failed for %s: %s", publication_id, e)
        return True
    except Exception as e:
        _finalize_failure(publication_id, f"Unexpected error: {e}")
        logger.exception("Unexpected Instagram publish error for %s", publication_id)
        return True

    _finalize_success(publication_id, result.media_id)
    logger.info("Instagram publication %s published as %s", publication_id, result.media_id)
    return True


def process_publication_by_id(publication_id: str) -> bool:
    db = SessionLocal()
    try:
        row = db.scalar(
            select(InstagramPublication)
            .options(joinedload(InstagramPublication.account))
            .where(InstagramPublication.id == publication_id)
        )
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
