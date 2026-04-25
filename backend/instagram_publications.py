"""Helpers for Instagram publication routing and queue records."""
from __future__ import annotations

import re
import uuid
from typing import Iterable

from sqlalchemy import select
from sqlalchemy.orm import Session

from models import (
    InstagramAccount,
    InstagramPublication,
    InstagramRegionRoute,
    Pet,
)
from platform_settings import get_bool_setting
from time_utils import utc_now

AUTO_ENABLED_KEY = "instagram_autopublish_enabled"
STORY_ENABLED_KEY = "instagram_story_enabled"


def normalize_region_key(city: str | None) -> str:
    raw = (city or "").strip().lower()
    if not raw:
        return "unknown"
    raw = raw.replace("ё", "е")
    raw = re.sub(r"\s+", " ", raw)
    return raw


def _enabled_formats(db: Session) -> list[str]:
    if get_bool_setting(db, STORY_ENABLED_KEY, default=True):
        return ["story"]
    return []


def is_autopublish_enabled(db: Session) -> bool:
    return get_bool_setting(db, AUTO_ENABLED_KEY, default=False)


def _resolve_route(db: Session, region_key: str) -> InstagramRegionRoute | None:
    exact = db.scalar(
        select(InstagramRegionRoute).where(InstagramRegionRoute.region_key == region_key)
    )
    if exact:
        return exact
    return db.scalar(
        select(InstagramRegionRoute).where(InstagramRegionRoute.is_fallback.is_(True))
    )


def resolve_account_for_region(db: Session, region_key: str) -> InstagramAccount | None:
    route = _resolve_route(db, region_key)
    if not route:
        return None
    account = db.scalar(
        select(InstagramAccount).where(
            InstagramAccount.id == route.account_id,
            InstagramAccount.is_active.is_(True),
        )
    )
    return account


def _build_idempotency_key(
    pet_id: str,
    account_id: str | None,
    mode: str,
    fmt: str,
) -> str:
    return f"{pet_id}:{account_id or 'no-account'}:{mode}:{fmt}"


def enqueue_publication(
    db: Session,
    *,
    pet: Pet,
    mode: str,
    fmt: str,
    initiated_by: str | None = None,
    force_new: bool = False,
    source: str = "auto",
    requested_by_user_id: str | None = None,
) -> InstagramPublication:
    if fmt != "story":
        raise ValueError("Only story format is supported")
    region_key = normalize_region_key(pet.city)
    account = resolve_account_for_region(db, region_key)
    idempotency_key = _build_idempotency_key(pet.id, account.id if account else None, mode, fmt)

    if not force_new:
        existing = db.scalar(
            select(InstagramPublication).where(
                InstagramPublication.idempotency_key == idempotency_key,
                InstagramPublication.status.in_(("pending", "processing", "published")),
            )
        )
        if existing:
            return existing
    else:
        idempotency_key = f"{idempotency_key}:{uuid.uuid4().hex[:8]}"

    item = InstagramPublication(
        id=f"igpub-{uuid.uuid4().hex[:16]}",
        pet_id=pet.id,
        account_id=account.id if account else None,
        initiated_by=initiated_by,
        region_key=region_key,
        mode=mode,
        source=source,
        requested_by_user_id=requested_by_user_id,
        requested_at=utc_now() if requested_by_user_id else None,
        format=fmt,
        status="pending",
        attempts=0,
        idempotency_key=idempotency_key,
        payload={
            "city": pet.city,
            "pet_status": pet.status,
            "card_path": f"/api/v1/pets/{pet.id}/social-card?format={fmt}",
        },
        created_at=utc_now(),
        updated_at=utc_now(),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def enqueue_autopublish_for_pet(
    db: Session,
    *,
    pet: Pet,
    initiated_by: str | None = None,
) -> list[InstagramPublication]:
    if not is_autopublish_enabled(db):
        return []
    items: list[InstagramPublication] = []
    for fmt in _enabled_formats(db):
        item = enqueue_publication(
            db,
            pet=pet,
            mode="auto",
            fmt=fmt,
            initiated_by=initiated_by,
            force_new=False,
            source="auto",
        )
        items.append(item)
    return items


def enqueue_manual_publications(
    db: Session,
    *,
    pet: Pet,
    formats: Iterable[str],
    initiated_by: str,
) -> list[InstagramPublication]:
    items: list[InstagramPublication] = []
    for fmt in formats:
        if fmt != "story":
            continue
        items.append(
            enqueue_publication(
                db,
                pet=pet,
                mode="manual",
                fmt=fmt,
                initiated_by=initiated_by,
                force_new=True,
                source="manual_admin",
            )
        )
    return items
