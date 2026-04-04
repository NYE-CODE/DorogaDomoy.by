"""Profile Pets CRUD API — профили питомцев (адресник / QR)."""
import uuid
import logging
from pathlib import Path
from typing import Optional
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import ProfilePet, User
from schemas import ProfilePetCreate, ProfilePetUpdate, ProfilePetResponse
from auth import get_current_user, get_current_user_required
from time_utils import utc_now
from upload_utils import save_data_image

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/profile-pets", tags=["profile-pets"])

UPLOADS_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

MAX_PHOTOS = 5


def _save_base64(data_url: str) -> str:
    if data_url.startswith("/uploads/"):
        return data_url
    if data_url.startswith("http://") or data_url.startswith("https://"):
        parsed = urlparse(data_url)
        if parsed.path.startswith("/uploads/"):
            return parsed.path
        raise HTTPException(status_code=400, detail="Допустимы только ранее загруженные фото из /uploads")
    return save_data_image(data_url, UPLOADS_DIR)


def _to_response(p: ProfilePet, *, include_owner_contacts: bool = True) -> ProfilePetResponse:
    owner: User | None = p.owner
    contacts = (owner.contacts or {}) if owner else {}
    city = None
    if contacts:
        pass
    return ProfilePetResponse(
        id=p.id,
        owner_id=p.owner_id,
        name=p.name,
        species=p.species,
        breed=p.breed,
        gender=p.gender,
        age=p.age,
        colors=p.colors or [],
        special_marks=p.special_marks,
        is_chipped=bool(p.is_chipped),
        chip_number=p.chip_number,
        medical_info=p.medical_info,
        temperament=p.temperament,
        responds_to_name=bool(p.responds_to_name),
        favorite_treats=p.favorite_treats,
        favorite_walks=p.favorite_walks,
        photos=p.photos or [],
        created_at=p.created_at or utc_now(),
        updated_at=p.updated_at or utc_now(),
        owner_name=owner.name if owner and include_owner_contacts else None,
        owner_phone=contacts.get("phone") if include_owner_contacts else None,
        owner_email=owner.email if owner and include_owner_contacts else None,
        owner_city=None,
        owner_viber=contacts.get("viber") if include_owner_contacts else None,
    )


@router.get("", response_model=list[ProfilePetResponse])
def list_profile_pets(
    owner_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    if owner_id is None and (current_user is None or current_user.role != "admin"):
        raise HTTPException(status_code=400, detail="owner_id обязателен для публичного запроса")
    include_owner_contacts = current_user is not None and (
        current_user.role == "admin" or current_user.id == owner_id
    )
    stmt = select(ProfilePet)
    if owner_id:
        stmt = stmt.where(ProfilePet.owner_id == owner_id)
    stmt = stmt.order_by(ProfilePet.created_at.desc())
    return [
        _to_response(p, include_owner_contacts=include_owner_contacts)
        for p in db.scalars(stmt).all()
    ]


@router.get("/my", response_model=list[ProfilePetResponse])
def list_my_profile_pets(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_required),
):
    pets = db.scalars(
        select(ProfilePet)
        .where(ProfilePet.owner_id == user.id)
        .order_by(ProfilePet.created_at.desc())
    ).all()
    return [_to_response(p) for p in pets]


@router.get("/{pet_id}", response_model=ProfilePetResponse)
def get_profile_pet(
    pet_id: str,
    db: Session = Depends(get_db),
):
    p = db.scalar(select(ProfilePet).where(ProfilePet.id == pet_id))
    if not p:
        raise HTTPException(status_code=404, detail="Профиль питомца не найден")
    return _to_response(p)


@router.post("", response_model=ProfilePetResponse, status_code=201)
def create_profile_pet(
    data: ProfilePetCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_required),
):
    photos = [_save_base64(ph) for ph in (data.photos or [])[:MAX_PHOTOS]]
    pet = ProfilePet(
        id=uuid.uuid4().hex,
        owner_id=user.id,
        name=data.name,
        species=data.species,
        breed=data.breed,
        gender=data.gender,
        age=data.age,
        colors=data.colors or [],
        special_marks=data.special_marks,
        is_chipped=data.is_chipped,
        chip_number=data.chip_number if data.is_chipped else None,
        medical_info=data.medical_info,
        temperament=data.temperament,
        responds_to_name=data.responds_to_name,
        favorite_treats=data.favorite_treats,
        favorite_walks=data.favorite_walks,
        photos=photos,
        created_at=utc_now(),
        updated_at=utc_now(),
    )
    db.add(pet)
    db.commit()
    db.refresh(pet)
    return _to_response(pet)


@router.patch("/{pet_id}", response_model=ProfilePetResponse)
def update_profile_pet(
    pet_id: str,
    data: ProfilePetUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_required),
):
    pet = db.scalar(select(ProfilePet).where(ProfilePet.id == pet_id))
    if not pet:
        raise HTTPException(status_code=404, detail="Профиль питомца не найден")
    if pet.owner_id != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещён")

    update_data = data.model_dump(exclude_unset=True)
    if "photos" in update_data and update_data["photos"] is not None:
        update_data["photos"] = [_save_base64(ph) for ph in update_data["photos"][:MAX_PHOTOS]]
    if "is_chipped" in update_data and not update_data["is_chipped"]:
        update_data["chip_number"] = None

    for k, v in update_data.items():
        setattr(pet, k, v)
    pet.updated_at = utc_now()
    db.commit()
    db.refresh(pet)
    return _to_response(pet)


@router.delete("/{pet_id}", status_code=204)
def delete_profile_pet(
    pet_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_required),
):
    pet = db.scalar(select(ProfilePet).where(ProfilePet.id == pet_id))
    if not pet:
        raise HTTPException(status_code=404, detail="Профиль питомца не найден")
    if pet.owner_id != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещён")
    db.delete(pet)
    db.commit()
