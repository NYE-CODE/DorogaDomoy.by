"""Питомцы приюта: отдельные endpoints поверх общей модели Pet."""
from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Body, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from auth import get_current_user, get_current_user_required
from database import get_db
from models import Pet, ShelterMembership, ShelterPetDetails, User
from routers.pets import _max_photos, save_base64_photo
from schemas import ShelterPetCreate, ShelterPetResponse, ShelterPetUpdate
from shelter_subscription_notify import schedule_new_shelter_pet_notifications
from time_utils import utc_now

router = APIRouter(tags=["shelter_pets"])


def shelter_pet_to_response(p: Pet) -> ShelterPetResponse:
    details = getattr(p, "shelter_details", None)
    nickname = getattr(details, "nickname", None)
    health_status = getattr(details, "health_status", None)
    coat_type = getattr(details, "coat_type", None)
    adoption_status = getattr(details, "adoption_status", None)
    if adoption_status is None:
        adoption_status = getattr(p, "adoption_status", None)
    is_published = getattr(details, "is_published", None)
    if is_published is None:
        is_published = bool(getattr(p, "is_published", True))
    return ShelterPetResponse(
        id=p.id,
        photos=p.photos or [],
        nickname=nickname,
        animal_type=p.animal_type,
        breed=p.breed,
        colors=p.colors or [],
        gender=p.gender,
        approximate_age=p.approximate_age,
        description=p.description,
        city=p.city,
        location={"lat": p.location_lat, "lng": p.location_lng},
        published_at=p.published_at,
        updated_at=p.updated_at,
        author_id=p.author_id,
        author_name=p.author_name,
        contacts=p.contacts or {},
        health_status=health_status,
        coat_type=coat_type,
        is_archived=bool(p.is_archived),
        archive_reason=p.archive_reason,
        pet_scope="shelter_pet",
        shelter_id=p.shelter_id,
        adoption_status=adoption_status,
        is_published=bool(is_published),
        published_by_user_id=p.published_by_user_id,
        updated_by_user_id=p.updated_by_user_id,
    )


def _shelter_pet_visible_on_site(db: Session, pet: Pet) -> bool:
    """Тот же фильтр, что у публичного списка GET /shelters/{id}/pets."""
    if pet.pet_scope != "shelter_pet" or not pet.shelter_id:
        return False
    if pet.is_archived:
        return False
    if pet.moderation_status != "approved":
        return False
    det = db.scalar(select(ShelterPetDetails).where(ShelterPetDetails.pet_id == pet.id))
    if det is None:
        return bool(getattr(pet, "is_published", True))
    if det.is_published is None:
        return bool(getattr(pet, "is_published", True))
    return bool(det.is_published)


def _is_active_member(db: Session, shelter_id: str, user_id: str) -> bool:
    m = db.scalar(
        select(ShelterMembership).where(
            ShelterMembership.shelter_id == shelter_id,
            ShelterMembership.user_id == user_id,
            ShelterMembership.status == "active",
        )
    )
    return m is not None


def _upsert_shelter_details(
    db: Session,
    pet: Pet,
    *,
    nickname: Optional[str],
    health_status: Optional[str],
    coat_type: Optional[str],
    adoption_status: Optional[str],
    is_published: bool,
) -> None:
    details = db.scalar(select(ShelterPetDetails).where(ShelterPetDetails.pet_id == pet.id))
    now = utc_now()
    if details is None:
        details = ShelterPetDetails(
            id="spd-" + str(uuid.uuid4())[:10],
            pet_id=pet.id,
            nickname=nickname,
            health_status=health_status,
            coat_type=coat_type,
            adoption_status=adoption_status,
            is_published=is_published,
            created_at=now,
            updated_at=now,
        )
        db.add(details)
        return
    if nickname is not None:
        details.nickname = nickname
    if health_status is not None:
        details.health_status = health_status
    if coat_type is not None:
        details.coat_type = coat_type
    details.adoption_status = adoption_status
    details.is_published = is_published
    details.updated_at = now


def _assert_can_manage(db: Session, user: User, shelter_id: str) -> None:
    if user.role == "admin":
        return
    if _is_active_member(db, shelter_id, user.id):
        return
    raise HTTPException(status_code=403, detail="Нет прав управлять питомцами этого приюта")


@router.get("/shelters/{shelter_id}/pets", response_model=list[ShelterPetResponse])
def list_shelter_pets(
    shelter_id: str,
    is_archived: Optional[bool] = Query(None),
    adoption_status: Optional[str] = Query(None),
    limit: Optional[int] = Query(None, ge=1, le=300),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user),
):
    stmt = (
        select(Pet)
        .outerjoin(ShelterPetDetails, ShelterPetDetails.pet_id == Pet.id)
        .where(Pet.pet_scope == "shelter_pet", Pet.shelter_id == shelter_id)
    )
    can_see_unpublished = user is not None and (
        user.role == "admin" or _is_active_member(db, shelter_id, user.id)
    )
    if not can_see_unpublished:
        stmt = stmt.where(
            Pet.moderation_status == "approved",
            func.coalesce(ShelterPetDetails.is_published, Pet.is_published, True).is_(True),
        )
    if is_archived is not None:
        stmt = stmt.where(Pet.is_archived == is_archived)
    if adoption_status:
        stmt = stmt.where(
            func.coalesce(ShelterPetDetails.adoption_status, Pet.adoption_status) == adoption_status
        )
    stmt = stmt.order_by(Pet.published_at.desc()).offset(offset)
    if limit is not None:
        stmt = stmt.limit(limit)
    return [shelter_pet_to_response(p) for p in db.scalars(stmt).all()]


@router.post("/shelters/{shelter_id}/pets", response_model=ShelterPetResponse, status_code=201)
def create_shelter_pet(
    shelter_id: str,
    data: ShelterPetCreate,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    _assert_can_manage(db, user, shelter_id)
    if not data.photos:
        raise HTTPException(status_code=400, detail="Необходимо загрузить хотя бы одно фото")
    limit = _max_photos(db)
    if len(data.photos) > limit:
        raise HTTPException(status_code=400, detail=f"Максимум {limit} фото")
    if data.description and len(data.description) > 500:
        raise HTTPException(status_code=400, detail="Описание не может быть длиннее 500 символов")

    photo_urls = [save_base64_photo(p) for p in data.photos]
    pet_id = "pet-" + str(uuid.uuid4())[:8]
    author_name = (data.author_name and data.author_name.strip()) or user.name or "Пользователь"
    now = utc_now()
    pet = Pet(
        id=pet_id,
        photos=photo_urls,
        animal_type=data.animal_type,
        breed=data.breed,
        colors=data.colors,
        gender=data.gender,
        approximate_age=data.approximate_age,
        status="searching",
        description=data.description,
        city=data.city,
        location_lat=data.location.lat,
        location_lng=data.location.lng,
        author_id=user.id,
        author_name=author_name,
        contacts=data.contacts.model_dump() if hasattr(data.contacts, "model_dump") else dict(data.contacts or {}),
        moderation_status="approved",
        reward_mode="points",
        reward_amount_byn=None,
        reward_points=50,
        pet_scope="shelter_pet",
        shelter_id=shelter_id,
        adoption_status=data.adoption_status,
        is_published=bool(data.is_published),
        published_by_user_id=user.id,
        updated_by_user_id=user.id,
        updated_at=now,
    )
    db.add(pet)
    _upsert_shelter_details(
        db,
        pet,
        nickname=data.nickname,
        health_status=data.health_status,
        coat_type=data.coat_type,
        adoption_status=data.adoption_status,
        is_published=bool(data.is_published),
    )
    db.commit()
    db.refresh(pet)
    if _shelter_pet_visible_on_site(db, pet):
        background_tasks.add_task(schedule_new_shelter_pet_notifications, pet.id)
    return shelter_pet_to_response(pet)


@router.patch("/shelter-pets/{pet_id}", response_model=ShelterPetResponse)
def update_shelter_pet(
    pet_id: str,
    data: ShelterPetUpdate,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    pet = db.scalar(select(Pet).where(Pet.id == pet_id, Pet.pet_scope == "shelter_pet"))
    if not pet:
        raise HTTPException(status_code=404, detail="Питомец приюта не найден")
    _assert_can_manage(db, user, pet.shelter_id)

    old_visible = _shelter_pet_visible_on_site(db, pet)

    d = data.model_dump(exclude_unset=True)
    nickname = d.pop("nickname", None) if "nickname" in d else None
    health_status = d.pop("health_status", None) if "health_status" in d else None
    coat_type = d.pop("coat_type", None) if "coat_type" in d else None
    if "photos" in d and d["photos"] is not None:
        limit = _max_photos(db)
        if len(d["photos"]) > limit:
            raise HTTPException(status_code=400, detail=f"Максимум {limit} фото")
        d["photos"] = [save_base64_photo(p) for p in d["photos"]]
    if "location" in d and d["location"]:
        d["location_lat"] = d["location"]["lat"]
        d["location_lng"] = d["location"]["lng"]
        del d["location"]
    if "contacts" in d and d["contacts"] is not None and hasattr(d["contacts"], "model_dump"):
        d["contacts"] = d["contacts"].model_dump()
    for key in {"moderation_status", "moderation_reason", "pet_scope", "shelter_id", "reward_helper_code"}:
        d.pop(key, None)
    for k, v in d.items():
        setattr(pet, k, v)
    pet.moderation_status = "approved"
    pet.updated_by_user_id = user.id
    pet.updated_at = utc_now()
    _upsert_shelter_details(
        db,
        pet,
        nickname=nickname,
        health_status=health_status,
        coat_type=coat_type,
        adoption_status=pet.adoption_status,
        is_published=bool(pet.is_published),
    )
    db.commit()
    db.refresh(pet)
    if _shelter_pet_visible_on_site(db, pet) and not old_visible:
        background_tasks.add_task(schedule_new_shelter_pet_notifications, pet.id)
    return shelter_pet_to_response(pet)


@router.post("/shelter-pets/{pet_id}/archive", response_model=ShelterPetResponse)
def archive_shelter_pet(
    pet_id: str,
    body: Optional[dict] = Body(default=None),
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    pet = db.scalar(select(Pet).where(Pet.id == pet_id, Pet.pet_scope == "shelter_pet"))
    if not pet:
        raise HTTPException(status_code=404, detail="Питомец приюта не найден")
    _assert_can_manage(db, user, pet.shelter_id)
    reason = str((body or {}).get("reason", "")).strip() or None
    pet.is_archived = True
    pet.archive_reason = reason
    pet.updated_by_user_id = user.id
    pet.updated_at = utc_now()
    _upsert_shelter_details(
        db,
        pet,
        nickname=None,
        health_status=None,
        coat_type=None,
        adoption_status=pet.adoption_status,
        is_published=bool(pet.is_published),
    )
    db.commit()
    db.refresh(pet)
    return shelter_pet_to_response(pet)


@router.post("/shelter-pets/{pet_id}/publish", response_model=ShelterPetResponse)
def publish_shelter_pet(
    pet_id: str,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    pet = db.scalar(select(Pet).where(Pet.id == pet_id, Pet.pet_scope == "shelter_pet"))
    if not pet:
        raise HTTPException(status_code=404, detail="Питомец приюта не найден")
    _assert_can_manage(db, user, pet.shelter_id)
    old_visible = _shelter_pet_visible_on_site(db, pet)
    pet.is_published = True
    pet.moderation_status = "approved"
    pet.moderation_reason = None
    pet.moderated_at = None
    pet.moderated_by = None
    pet.updated_by_user_id = user.id
    pet.updated_at = utc_now()
    _upsert_shelter_details(
        db,
        pet,
        nickname=None,
        health_status=None,
        coat_type=None,
        adoption_status=pet.adoption_status,
        is_published=bool(pet.is_published),
    )
    db.commit()
    db.refresh(pet)
    if _shelter_pet_visible_on_site(db, pet) and not old_visible:
        background_tasks.add_task(schedule_new_shelter_pet_notifications, pet.id)
    return shelter_pet_to_response(pet)
