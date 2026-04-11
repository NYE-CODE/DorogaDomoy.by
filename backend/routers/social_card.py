"""Endpoint for generating social-media share cards (PNG)."""
import os
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import Pet
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
    pet = db.scalar(select(Pet).where(Pet.id == pet_id))
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    if pet.moderation_status != "approved":
        raise HTTPException(status_code=404, detail="Pet not found")

    pet_contacts = (pet.contacts or {}) if contacts else {}

    card_format: CardFormat = "story" if fmt == "story" else "feed"
    png_bytes = generate_social_card(
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
        site_url=SITE_URL,
        lang=lang,
        card_format=card_format,
    )

    filename = f"dorogadomoy-{pet.id}-{card_format}.png"
    return Response(
        content=png_bytes,
        media_type="image/png",
        headers={
            "Content-Disposition": f'inline; filename="{filename}"',
            # PNG генерируется на лету — не кэшируем агрессивно, иначе после деплоя видна старая карточка
            "Cache-Control": "private, max-age=0, must-revalidate",
        },
    )
