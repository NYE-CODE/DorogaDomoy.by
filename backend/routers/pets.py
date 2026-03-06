"""Pets CRUD API."""
import base64
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from models import Pet, User
from schemas import PetCreate, PetUpdate, PetResponse, StatisticsResponse
from auth import get_current_user, get_current_user_required, require_admin

router = APIRouter(prefix="/pets", tags=["pets"])

UPLOADS_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

MIME_TO_EXT = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
}

MAX_PHOTO_BYTES = 10 * 1024 * 1024  # 10 MB per photo after decoding
MAX_PHOTOS = 10


def save_base64_photo(data_url: str) -> str:
    """Decode a data:image/…;base64,… string, save to disk, return URL path."""
    if not data_url.startswith("data:"):
        return data_url

    try:
        header, encoded = data_url.split(",", 1)
    except ValueError:
        raise HTTPException(status_code=400, detail="Некорректный формат фото")

    mime = header.split(";")[0].replace("data:", "")
    ext = MIME_TO_EXT.get(mime, ".jpg")

    raw = base64.b64decode(encoded)
    if len(raw) > MAX_PHOTO_BYTES:
        raise HTTPException(status_code=400, detail="Фото слишком большое (макс. 10 МБ)")

    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = UPLOADS_DIR / filename
    filepath.write_bytes(raw)

    return f"/uploads/{filename}"


def pet_to_response(p: Pet) -> PetResponse:
    return PetResponse(
        id=p.id,
        photos=p.photos or [],
        animal_type=p.animal_type,
        breed=p.breed,
        colors=p.colors or [],
        gender=p.gender,
        approximate_age=p.approximate_age,
        status=p.status,
        description=p.description,
        city=p.city,
        location={"lat": p.location_lat, "lng": p.location_lng},
        published_at=p.published_at,
        updated_at=p.updated_at,
        author_id=p.author_id,
        author_name=p.author_name,
        contacts=p.contacts or {},
        is_archived=p.is_archived,
        archive_reason=p.archive_reason,
        moderation_status=p.moderation_status,
        moderation_reason=p.moderation_reason,
        moderated_at=p.moderated_at,
        moderated_by=p.moderated_by,
    )


@router.get("", response_model=list[PetResponse])
def list_pets(
    animal_type: Optional[str] = Query(None),
    breed: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    statuses: Optional[str] = Query(None),  # comma-separated list: searching,found
    days: Optional[int] = Query(None, ge=1),
    moderation_status: Optional[str] = Query(None),
    is_archived: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    author_id: Optional[str] = Query(None),
    north: Optional[float] = Query(None),
    south: Optional[float] = Query(None),
    east: Optional[float] = Query(None),
    west: Optional[float] = Query(None),
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user),
):
    q = db.query(Pet)
    if animal_type:
        q = q.filter(Pet.animal_type == animal_type)
    if breed:
        q = q.filter(Pet.breed.ilike(f"%{breed}%"))
    if city:
        q = q.filter(Pet.city.ilike(f"%{city}%"))
    if status:
        q = q.filter(Pet.status == status)
    if statuses:
        status_values = [s.strip() for s in statuses.split(",") if s.strip()]
        if status_values:
            q = q.filter(Pet.status.in_(status_values))
    if days:
        q = q.filter(Pet.published_at >= datetime.utcnow() - timedelta(days=days))
    if moderation_status:
        q = q.filter(Pet.moderation_status == moderation_status)
    if is_archived is not None:
        q = q.filter(Pet.is_archived == is_archived)
    if search:
        q = q.filter(
            (Pet.description.ilike(f"%{search}%")) |
            (Pet.breed.ilike(f"%{search}%")) |
            (Pet.city.ilike(f"%{search}%"))
        )
    if author_id:
        q = q.filter(Pet.author_id == author_id)
    if None not in (north, south, east, west):
        q = q.filter(
            Pet.location_lat >= south,
            Pet.location_lat <= north,
            Pet.location_lng >= west,
            Pet.location_lng <= east,
        )
    pets = q.order_by(Pet.published_at.desc()).all()
    return [pet_to_response(p) for p in pets]


@router.get("/statistics", response_model=StatisticsResponse)
def get_statistics(db: Session = Depends(get_db)):
    from sqlalchemy import func
    pets = db.query(Pet).filter(Pet.is_archived == False).all()
    searching = sum(1 for p in pets if p.status == "searching")
    found = sum(1 for p in pets if p.status == "found")
    return StatisticsResponse(searching=searching, found=found, fostering=0)


@router.get("/{pet_id}", response_model=PetResponse)
def get_pet(pet_id: str, db: Session = Depends(get_db)):
    pet = db.query(Pet).filter(Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Объявление не найдено")
    return pet_to_response(pet)


@router.post("", response_model=PetResponse, status_code=201)
def create_pet(
    data: PetCreate,
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    if not data.photos:
        raise HTTPException(status_code=400, detail="Необходимо загрузить хотя бы одно фото")
    if len(data.photos) > MAX_PHOTOS:
        raise HTTPException(status_code=400, detail=f"Максимум {MAX_PHOTOS} фото")

    photo_urls = [save_base64_photo(p) for p in data.photos]

    pet_id = "pet-" + str(uuid.uuid4())[:8]
    pet = Pet(
        id=pet_id,
        photos=photo_urls,
        animal_type=data.animal_type,
        breed=data.breed,
        colors=data.colors,
        gender=data.gender,
        approximate_age=data.approximate_age,
        status=data.status,
        description=data.description,
        city=data.city,
        location_lat=data.location.lat,
        location_lng=data.location.lng,
        author_id=user.id,
        author_name=user.name,
        contacts=data.contacts.model_dump() if data.contacts else {},
        moderation_status="pending",
    )
    try:
        db.add(pet)
        db.commit()
        db.refresh(pet)
    except Exception as e:
        db.rollback()
        logging.exception("Ошибка при создании объявления")
        raise HTTPException(status_code=500, detail="Не удалось создать объявление") from e
    return pet_to_response(pet)


@router.patch("/{pet_id}", response_model=PetResponse)
def update_pet(
    pet_id: str,
    data: PetUpdate,
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    pet = db.query(Pet).filter(Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Объявление не найдено")
    if pet.author_id != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Нет прав на редактирование")
    ALLOWED_FIELDS = {
        "photos", "animal_type", "breed", "colors", "gender",
        "approximate_age", "status", "description", "city",
        "location", "contacts", "is_archived", "archive_reason",
        "moderation_status", "moderation_reason",
    }
    d = data.model_dump(exclude_unset=True)
    d = {k: v for k, v in d.items() if k in ALLOWED_FIELDS}
    if "photos" in d and d["photos"] is not None:
        if len(d["photos"]) > MAX_PHOTOS:
            raise HTTPException(status_code=400, detail=f"Максимум {MAX_PHOTOS} фото")
        d["photos"] = [save_base64_photo(p) for p in d["photos"]]
    if "location" in d and d["location"]:
        d["location_lat"] = d["location"]["lat"]
        d["location_lng"] = d["location"]["lng"]
        del d["location"]
    if "contacts" in d and d["contacts"] is not None:
        if hasattr(d["contacts"], "model_dump"):
            d["contacts"] = d["contacts"].model_dump()
        elif not isinstance(d["contacts"], dict):
            d["contacts"] = dict(d["contacts"])
    for k, v in d.items():
        setattr(pet, k, v)
    pet.updated_at = datetime.utcnow()
    if "moderation_status" in d or "moderation_reason" in d:
        pet.moderated_at = datetime.utcnow()
        pet.moderated_by = user.id
    elif pet.author_id == user.id:
        pet.moderation_status = "pending"
        pet.moderation_reason = None
        pet.moderated_at = None
        pet.moderated_by = None
    try:
        db.commit()
        db.refresh(pet)
    except Exception as e:
        db.rollback()
        logging.exception("Ошибка при обновлении объявления %s", pet_id)
        raise HTTPException(status_code=500, detail="Не удалось обновить объявление") from e
    return pet_to_response(pet)


@router.delete("/{pet_id}", status_code=204)
def delete_pet(
    pet_id: str,
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    from models import Report
    pet = db.query(Pet).filter(Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Объявление не найдено")
    if pet.author_id != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Нет прав на удаление")
    try:
        db.query(Report).filter(Report.pet_id == pet_id).delete(synchronize_session=False)
        db.delete(pet)
        db.commit()
    except Exception as e:
        db.rollback()
        logging.exception("Ошибка при удалении объявления %s", pet_id)
        raise HTTPException(
            status_code=500,
            detail="Не удалось удалить объявление. Попробуйте позже.",
        ) from e
    return None
