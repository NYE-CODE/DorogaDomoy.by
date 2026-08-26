"""Интеграция Susedzi: read-only профили питомцев по telegram_id."""
from __future__ import annotations

import os
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import ProfilePet, User
from profile_pet_photo_slots import pad_profile_pet_photos

router = APIRouter(prefix="/integrations/susedzi", tags=["integrations-susedzi"])

SUSEDZI_SECRET = os.getenv("SUSEDZI_INTEGRATION_SECRET", "").strip()
SITE_URL = (os.getenv("SITE_URL") or "https://doragadomoy.by").rstrip("/")

SPECIES_LABELS = {
    "dog": "собака",
    "cat": "кошка",
    "other": "питомец",
}


class SusedziPetCard(BaseModel):
    id: str
    name: str
    species: str
    species_label: str
    breed: Optional[str] = None
    photo_url: Optional[str] = None
    profile_url: str
    my_pets_url: str = Field(description="Кабинет «Мои питомцы»")


class SusedziPetsResponse(BaseModel):
    linked: bool
    pets: list[SusedziPetCard]


def _verify_susedzi_secret(
    x_susedzi_secret: str | None = Header(None, alias="X-Susedzi-Secret"),
) -> None:
    if not SUSEDZI_SECRET or not x_susedzi_secret or x_susedzi_secret != SUSEDZI_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")


def _abs_photo(path: str | None) -> str | None:
    if not path:
        return None
    p = str(path).strip()
    if not p:
        return None
    if p.startswith("http://") or p.startswith("https://"):
        return p
    if p.startswith("/api/uploads/"):
        p = p.replace("/api/uploads/", "/uploads/", 1)
    if not p.startswith("/"):
        p = "/" + p
    return f"{SITE_URL}{p}"


def _first_photo(photos) -> str | None:
    padded = pad_profile_pet_photos(photos or [])
    for item in padded:
        if item:
            return _abs_photo(item)
    return None


@router.get(
    "/pets-by-telegram/{telegram_id}",
    response_model=SusedziPetsResponse,
    summary="Питомцы владельца с привязанным Telegram (для Susedzi)",
)
def pets_by_telegram(
    telegram_id: int,
    _: None = Depends(_verify_susedzi_secret),
    db: Session = Depends(get_db),
):
    """
    Доверенный server-to-server вызов.
    Без контактов владельца — только карточки для двора / Mini App.
    """
    if telegram_id <= 0:
        raise HTTPException(status_code=400, detail="Invalid telegram_id")

    user = db.scalar(select(User).where(User.telegram_id == telegram_id))
    if not user:
        return SusedziPetsResponse(linked=False, pets=[])

    pets = list(
        db.scalars(
            select(ProfilePet)
            .where(ProfilePet.owner_id == user.id)
            .order_by(ProfilePet.created_at.desc())
        ).all()
    )
    cards: list[SusedziPetCard] = []
    for pet in pets:
        species = (pet.species or "other").lower()
        cards.append(
            SusedziPetCard(
                id=pet.id,
                name=pet.name,
                species=species,
                species_label=SPECIES_LABELS.get(species, SPECIES_LABELS["other"]),
                breed=(pet.breed or None),
                photo_url=_first_photo(pet.photos),
                profile_url=f"{SITE_URL}/pet-profile/{pet.id}",
                my_pets_url=f"{SITE_URL}/my-pets",
            )
        )
    return SusedziPetsResponse(linked=True, pets=cards)
