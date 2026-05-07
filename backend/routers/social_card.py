"""Endpoint for generating social-media share cards."""
import os
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from database import get_db
from models import Pet, Shelter
from rate_limit import limiter
from social_card import generate_social_card, CardFormat

router = APIRouter(prefix="/pets", tags=["pets"])

SITE_URL = os.getenv("SITE_URL", "https://dorogadomoy.by")


@router.get("/{pet_id}/social-card")
@limiter.limit("30/minute")
def get_social_card(
    request: Request,
    pet_id: str,
    fmt: Optional[str] = Query("feed", alias="format", pattern="^(feed|story)$"),
    lang: str = Query("ru", pattern="^(ru|be)$"),
    contacts: int = Query(1, ge=0, le=1),
    db: Session = Depends(get_db),
):
    pet = db.scalar(
        select(Pet)
        .where(Pet.id == pet_id)
        .options(selectinload(Pet.shelter_details))
    )
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    if pet.moderation_status != "approved":
        raise HTTPException(status_code=404, detail="Pet not found")

    pet_contacts = (pet.contacts or {}) if contacts else {}

    shelter_name = None
    shelter_city = None
    pet_nickname = None
    if getattr(pet, "pet_scope", None) == "shelter_pet" and getattr(pet, "shelter_id", None):
        org = db.scalar(select(Shelter).where(Shelter.id == pet.shelter_id))
        if org:
            shelter_name = org.name
            shelter_city = org.city
    if getattr(pet, "pet_scope", None) == "shelter_pet":
        det = getattr(pet, "shelter_details", None)
        if det and (det.nickname or "").strip():
            pet_nickname = det.nickname.strip()

    card_format: CardFormat = "story" if fmt == "story" else "feed"
    card_bytes, media_type = generate_social_card(
        pet_id=pet.id,
        photo_url=(pet.photos or [None])[0],
        status=pet.status,
        animal_type=pet.animal_type,
        breed=pet.breed,
        city=pet.city,
        colors=pet.colors or [],
        gender=pet.gender,
        approximate_age=pet.approximate_age,
        contacts=pet_contacts,
        author_name=pet.author_name,
        pet_scope=getattr(pet, "pet_scope", None),
        adoption_status=getattr(pet, "adoption_status", None),
        site_url=SITE_URL,
        shelter_name=shelter_name,
        shelter_city=shelter_city,
        pet_nickname=pet_nickname,
        lang=lang,
        card_format=card_format,
    )

    extension = "jpg" if media_type == "image/jpeg" else "png"
    filename = f"dorogadomoy-{pet.id}-{card_format}.{extension}"
    return Response(
        content=card_bytes,
        media_type=media_type,
        headers={
            "Content-Disposition": f'inline; filename="{filename}"',
            # Карточка генерируется на лету — не кэшируем агрессивно, иначе после деплоя видна старая версия
            "Cache-Control": "private, max-age=0, must-revalidate",
        },
    )
