"""Profile Pets CRUD API — профили питомцев (адресник / QR)."""
import hashlib
import uuid
import logging
from datetime import timedelta
from pathlib import Path
from typing import Optional
from urllib.parse import urlparse

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, Query, Request, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import ProfilePet, ProfilePetScanSignal, NotificationSettings, User
from schemas import (
    ProfilePetCreate,
    ProfilePetUpdate,
    ProfilePetResponse,
    ProfilePetFoundSignalResponse,
)
from auth import get_current_user, get_current_user_required
from integrations.telegram import send_profile_pet_signal_sync
from time_utils import utc_now
from upload_utils import save_data_image
from rate_limit import limiter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/profile-pets", tags=["profile-pets"])

UPLOADS_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

MAX_PHOTOS = 5
SIGNAL_COOLDOWN_MINUTES = 30
MIME_TO_EXT = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
}
MAX_UPLOAD_PHOTO_BYTES = 10 * 1024 * 1024


def _get_ip_hash(request: Request) -> Optional[str]:
    ip = request.client.host if request.client else None
    if not ip:
        return None
    return hashlib.sha256(ip.encode()).hexdigest()[:16]


def _save_base64(data_url: str) -> str:
    if data_url.startswith("/uploads/"):
        return data_url
    if data_url.startswith("http://") or data_url.startswith("https://"):
        parsed = urlparse(data_url)
        if parsed.path.startswith("/uploads/"):
            return parsed.path
        raise HTTPException(status_code=400, detail="Допустимы только ранее загруженные фото из /uploads")
    return save_data_image(data_url, UPLOADS_DIR)


@router.post("/upload-photo", response_model=dict)
def upload_profile_pet_photo(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user_required),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Поддерживаются только изображения")

    raw = file.file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Файл пустой")
    if len(raw) > MAX_UPLOAD_PHOTO_BYTES:
        raise HTTPException(status_code=400, detail="Фото слишком большое (макс. 10 МБ)")

    ext = MIME_TO_EXT.get(file.content_type, ".jpg")
    filename = f"profile-pet-{user.id}-{uuid.uuid4().hex[:12]}{ext}"
    (UPLOADS_DIR / filename).write_bytes(raw)
    return {"photo": f"/uploads/{filename}"}


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
        owner_telegram_linked=bool(owner and owner.telegram_id),
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
    stmt = (
        select(ProfilePet)
        .options(joinedload(ProfilePet.owner))
        .order_by(ProfilePet.created_at.desc())
    )
    if owner_id:
        stmt = stmt.where(ProfilePet.owner_id == owner_id)
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
        .options(joinedload(ProfilePet.owner))
        .where(ProfilePet.owner_id == user.id)
        .order_by(ProfilePet.created_at.desc())
    ).all()
    return [_to_response(p) for p in pets]


@router.get("/{pet_id}", response_model=ProfilePetResponse)
def get_profile_pet(
    pet_id: str,
    db: Session = Depends(get_db),
):
    p = db.scalar(
        select(ProfilePet)
        .options(joinedload(ProfilePet.owner))
        .where(ProfilePet.id == pet_id)
    )
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


@router.post("/{pet_id}/found-signal", response_model=ProfilePetFoundSignalResponse)
@limiter.limit("60/minute")
def send_found_signal(
    pet_id: str,
    request: Request,
    background_tasks: BackgroundTasks,
    source: Optional[str] = Query("unknown"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    pet = db.scalar(select(ProfilePet).where(ProfilePet.id == pet_id))
    if not pet:
        raise HTTPException(status_code=404, detail="Профиль питомца не найден")

    owner = db.scalar(select(User).where(User.id == pet.owner_id))
    if not owner or not owner.telegram_id:
        raise HTTPException(
            status_code=400,
            detail="У владельца не подключён Telegram — уведомление о находке недоступно. Свяжитесь по контактам на странице.",
        )

    if current_user and current_user.id == pet.owner_id:
        raise HTTPException(status_code=400, detail="Нельзя отправить сигнал по своему питомцу")

    src = (source or "unknown").strip().lower()
    if src not in {"qr", "nfc", "unknown"}:
        src = "unknown"

    ip_hash = _get_ip_hash(request)
    reporter_id = current_user.id if current_user else None

    cooldown_after = utc_now() - timedelta(minutes=SIGNAL_COOLDOWN_MINUTES)
    if reporter_id:
        recent = db.scalar(
            select(ProfilePetScanSignal).where(
                ProfilePetScanSignal.profile_pet_id == pet.id,
                ProfilePetScanSignal.reporter_id == reporter_id,
                ProfilePetScanSignal.created_at >= cooldown_after,
            )
        )
    elif ip_hash:
        recent = db.scalar(
            select(ProfilePetScanSignal).where(
                ProfilePetScanSignal.profile_pet_id == pet.id,
                ProfilePetScanSignal.ip_hash == ip_hash,
                ProfilePetScanSignal.created_at >= cooldown_after,
            )
        )
    else:
        recent = None

    if recent:
        return ProfilePetFoundSignalResponse(
            accepted=True,
            throttled=True,
            telegram_sent=False,
            detail="cooldown",
        )

    signal = ProfilePetScanSignal(
        id=f"pps-{uuid.uuid4().hex[:12]}",
        profile_pet_id=pet.id,
        owner_id=pet.owner_id,
        reporter_id=reporter_id,
        ip_hash=ip_hash if not reporter_id else None,
        source=src,
        telegram_sent=False,
        created_at=utc_now(),
    )
    db.add(signal)
    db.commit()
    db.refresh(signal)

    should_send = True
    settings = db.scalar(
        select(NotificationSettings).where(NotificationSettings.user_id == pet.owner_id)
    )
    if settings and not settings.notifications_enabled:
        should_send = False

    if should_send:
        background_tasks.add_task(send_profile_pet_signal_sync, signal.id, pet.id)

    return ProfilePetFoundSignalResponse(
        accepted=True,
        throttled=False,
        telegram_sent=bool(should_send),
        detail="ok",
    )


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
