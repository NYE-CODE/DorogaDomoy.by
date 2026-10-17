"""HTML shell с OG/Schema для /pet/:id, /shelter-pet/:id и /city/:slug.

Nginx проксирует эти пути на бэкенд; люди получают тот же SPA + мету в <head>,
боты (Telegram, поисковики) видят title, описание, фото и crawl-текст без JS.
"""
from __future__ import annotations

import logging
from typing import Optional
from urllib.parse import quote

from fastapi import APIRouter, Depends, Request
from fastapi.responses import HTMLResponse
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from database import get_db
from models import Pet, Shelter
from rate_limit import limiter
from seo_meta import (
    CITY_SLUG_BY_NAME,
    city_name_from_slug,
    city_page_seo,
    city_slug,
    inject_seo_into_html,
    not_found_seo,
    pet_page_seo,
)
from spa_html import get_spa_shell

logger = logging.getLogger(__name__)

router = APIRouter(tags=["spa-seo"])


def _html(seo, *, cache_seconds: int = 300) -> HTMLResponse:
    body = inject_seo_into_html(get_spa_shell(), seo)
    headers = {
        "Cache-Control": (
            f"public, max-age={cache_seconds}"
            if seo.status_code == 200
            else "no-store"
        ),
        "Content-Type": "text/html; charset=utf-8",
    }
    return HTMLResponse(content=body, status_code=seo.status_code, headers=headers)


def _published_iso(pet: Pet) -> Optional[str]:
    dt = pet.published_at or pet.updated_at
    if not dt:
        return None
    try:
        if dt.tzinfo is None:
            return dt.isoformat() + "Z"
        return dt.isoformat()
    except Exception:
        return None


def _public_pet_or_none(db: Session, pet_id: str, *, expect_shelter: bool) -> Optional[Pet]:
    pet = db.scalar(
        select(Pet)
        .where(Pet.id == pet_id)
        .options(selectinload(Pet.shelter_details))
    )
    if not pet:
        return None
    scope = pet.pet_scope or "lost_found"
    is_shelter = scope == "shelter_pet"
    if expect_shelter != is_shelter:
        return None
    if pet.moderation_status != "approved":
        return None
    if pet.is_archived:
        return None
    if is_shelter:
        if not pet.is_published:
            return None
        if pet.shelter_id:
            shelter = db.scalar(select(Shelter).where(Shelter.id == pet.shelter_id))
            if not shelter or shelter.moderation_status != "approved":
                return None
    return pet


def _seo_for_pet(pet: Pet, *, path_prefix: str):
    nickname = None
    det = getattr(pet, "shelter_details", None)
    if det and (det.nickname or "").strip():
        nickname = det.nickname.strip()
    return pet_page_seo(
        pet_id=pet.id,
        status=pet.status or "searching",
        animal_type=pet.animal_type or "other",
        breed=pet.breed,
        city=pet.city or "",
        description=pet.description or "",
        photos=pet.photos or [],
        pet_scope=pet.pet_scope or "lost_found",
        nickname=nickname,
        published_iso=_published_iso(pet),
        path_prefix=path_prefix,
    )


@router.get("/pet/{pet_id}")
@limiter.limit("120/minute")
def spa_pet_page(request: Request, pet_id: str, db: Session = Depends(get_db)):
    pet = _public_pet_or_none(db, pet_id, expect_shelter=False)
    if not pet:
        return _html(not_found_seo(path=f"/pet/{quote(pet_id, safe='')}", kind="Объявление"))
    return _html(_seo_for_pet(pet, path_prefix="pet"))


@router.get("/shelter-pet/{pet_id}")
@limiter.limit("120/minute")
def spa_shelter_pet_page(request: Request, pet_id: str, db: Session = Depends(get_db)):
    pet = _public_pet_or_none(db, pet_id, expect_shelter=True)
    if not pet:
        return _html(
            not_found_seo(path=f"/shelter-pet/{quote(pet_id, safe='')}", kind="Объявление")
        )
    return _html(_seo_for_pet(pet, path_prefix="shelter-pet"))


@router.get("/city/{slug}")
@limiter.limit("60/minute")
def spa_city_page(request: Request, slug: str, db: Session = Depends(get_db)):
    key = (slug or "").strip().lower()
    city_name = city_name_from_slug(key)
    if not city_name:
        # допускаем любой slug, если совпадает с известным городом через обратный маппинг
        for name, known_slug in CITY_SLUG_BY_NAME.items():
            if known_slug == key:
                city_name = name
                break
    if not city_name:
        return _html(not_found_seo(path=f"/city/{quote(key, safe='')}", kind="Город"))

    rows = db.scalars(
        select(Pet)
        .where(
            Pet.pet_scope == "lost_found",
            Pet.moderation_status == "approved",
            Pet.is_archived.is_(False),
            Pet.city == city_name,
        )
        .order_by(Pet.published_at.desc())
        .limit(12)
    ).all()

    summaries: list[dict[str, str]] = []
    for pet in rows:
        seo = _seo_for_pet(pet, path_prefix="pet")
        label = seo.title.replace(" | DorogaDomoy.by", "")
        summaries.append({"url": f"/pet/{quote(pet.id, safe='')}", "label": label})

    return _html(
        city_page_seo(
            city_name=city_name,
            slug=city_slug(city_name) or key,
            pet_summaries=summaries,
        ),
        cache_seconds=600,
    )
