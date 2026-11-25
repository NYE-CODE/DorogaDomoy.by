"""HTML shell с OG/Schema для публичных карточек.

Nginx проксирует эти пути на бэкенд; люди получают тот же SPA + мету в <head>,
боты (Telegram, поисковики) видят title, описание, фото и crawl-текст без JS.

Покрывает: /pet/:id, /shelter-pet/:id, /city/:slug, /blog/:slug, /shelters/:id.
"""
from __future__ import annotations

import logging
from typing import Any, Optional
from urllib.parse import quote

from fastapi import APIRouter, Depends, Request
from fastapi.responses import HTMLResponse
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from database import get_db
from models import BlogPost, Pet, Shelter
from rate_limit import limiter
from seo_meta import (
    CITY_SLUG_BY_NAME,
    blog_list_seo,
    blog_page_seo,
    city_name_from_slug,
    city_page_seo,
    city_slug,
    inject_seo_into_html,
    not_found_seo,
    pet_page_seo,
    search_list_seo,
    shelter_page_seo,
    shelters_list_seo,
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


def _dt_iso(value: Any) -> Optional[str]:
    if not value:
        return None
    try:
        if getattr(value, "tzinfo", None) is None:
            return value.isoformat() + "Z"
        return value.isoformat()
    except Exception:
        return None


def _shelter_phone(contacts: Any) -> Optional[str]:
    if not isinstance(contacts, dict):
        return None
    for key in ("phone", "tel", "mobile"):
        raw = contacts.get(key)
        if isinstance(raw, str) and raw.strip():
            return raw.strip()
    return None


@router.get("/search")
@limiter.limit("60/minute")
def spa_search_page(request: Request):
    return _html(search_list_seo(), cache_seconds=600)


@router.get("/blog")
@limiter.limit("60/minute")
def spa_blog_list_page(request: Request, db: Session = Depends(get_db)):
    rows = db.scalars(
        select(BlogPost)
        .where(BlogPost.status == "published")
        .order_by(BlogPost.published_at.desc())
        .limit(20)
    ).all()
    summaries = [
        {"url": f"/blog/{quote(p.slug, safe='')}", "label": (p.title or p.slug)}
        for p in rows
        if p.slug
    ]
    return _html(blog_list_seo(post_summaries=summaries), cache_seconds=600)


@router.get("/shelters")
@limiter.limit("60/minute")
def spa_shelters_list_page(request: Request, db: Session = Depends(get_db)):
    rows = db.scalars(
        select(Shelter)
        .where(Shelter.moderation_status == "approved")
        .order_by(Shelter.updated_at.desc())
        .limit(20)
    ).all()
    summaries = [
        {
            "url": f"/shelters/{quote(s.id, safe='')}",
            "label": f"{s.name} — {s.city}" if s.city else (s.name or s.id),
        }
        for s in rows
        if s.id
    ]
    return _html(shelters_list_seo(shelter_summaries=summaries), cache_seconds=600)


@router.get("/blog/{slug}")
@limiter.limit("60/minute")
def spa_blog_page(request: Request, slug: str, db: Session = Depends(get_db)):
    key = (slug or "").strip()
    post = db.scalar(select(BlogPost).where(BlogPost.slug == key))
    if not post or (post.status or "") != "published":
        return _html(not_found_seo(path=f"/blog/{quote(key, safe='')}", kind="Статья"))
    return _html(
        blog_page_seo(
            slug=post.slug,
            title=post.title or "Статья",
            excerpt=post.excerpt,
            body_md=post.body_md or "",
            meta_description=post.meta_description,
            cover_image_url=post.cover_image_url,
            published_iso=_dt_iso(post.published_at or post.created_at),
            updated_iso=_dt_iso(post.updated_at or post.published_at),
        ),
        cache_seconds=600,
    )


@router.get("/shelters/{shelter_id}")
@limiter.limit("60/minute")
def spa_shelter_page(request: Request, shelter_id: str, db: Session = Depends(get_db)):
    sid = (shelter_id or "").strip()
    shelter = db.scalar(select(Shelter).where(Shelter.id == sid))
    if not shelter or (shelter.moderation_status or "") != "approved":
        return _html(not_found_seo(path=f"/shelters/{quote(sid, safe='')}", kind="Организация"))
    return _html(
        shelter_page_seo(
            shelter_id=shelter.id,
            name=shelter.name or "Организация",
            kind=shelter.kind or "other",
            city=shelter.city or "",
            address=shelter.address,
            description=shelter.description,
            logo_url=shelter.logo_url,
            cover_url=shelter.cover_url,
            phone=_shelter_phone(shelter.contacts),
            lat=shelter.location_lat,
            lng=shelter.location_lng,
        ),
        cache_seconds=600,
    )
