"""Pets CRUD API."""
import asyncio
import logging
from datetime import timedelta
from pathlib import Path
from typing import Optional
import uuid
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request
from sqlalchemy import delete, func, select
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session

from database import get_db
from models import Pet, PointsTransaction, Report, User
from schemas import PetCreate, PetUpdate, PetResponse, StatisticsResponse, _is_happy_archive
from auth import get_current_user, get_current_user_required, require_admin
from platform_settings import DEFAULT_MAX_PHOTOS, get_bool_setting, get_int_setting
from integrations.telegram import send_notifications_for_pet
from instagram_publications import enqueue_autopublish_for_pet
from time_utils import utc_now
from upload_utils import save_data_image
from rate_limit import limiter


def _moderation_required(db: Session) -> bool:
    try:
        return get_bool_setting(db, "require_moderation", default=True)
    except Exception as e:
        logging.getLogger(__name__).warning(
            "require_moderation read failed, default True: %s", e
        )
        return True


def _max_photos(db: Session) -> int:
    try:
        return get_int_setting(db, "max_photos", default=DEFAULT_MAX_PHOTOS)
    except Exception as e:
        logging.getLogger(__name__).warning(
            "max_photos read failed, default %s: %s", DEFAULT_MAX_PHOTOS, e
        )
        return DEFAULT_MAX_PHOTOS

router = APIRouter(prefix="/pets", tags=["pets"])

UPLOADS_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

MAX_PHOTOS = DEFAULT_MAX_PHOTOS


def _contacts_to_dict(contacts) -> dict:
    """Преобразует contacts в dict, поддерживая Pydantic model и plain dict."""
    if contacts is None:
        return {}
    if hasattr(contacts, "model_dump"):
        return contacts.model_dump()
    if isinstance(contacts, dict):
        return {k: v for k, v in contacts.items() if v is not None and v != ""}
    return {}


def save_base64_photo(data_url: str) -> str:
    """Decode a data:image/…;base64,… string, save to disk, return URL path."""
    if not data_url.startswith("data:"):
        return data_url
    return save_data_image(data_url, UPLOADS_DIR)


def _normalize_reward(
    *,
    db: Session,
    reward_mode: Optional[str],
    reward_amount_byn: Optional[int],
    reward_points: Optional[int],
) -> tuple[str, Optional[int], int]:
    reward_enabled = get_bool_setting(db, "ff_reward_enabled", default=True)
    if not reward_enabled:
        return "points", None, get_int_setting(db, "reward_default_points", default=50)

    money_enabled = get_bool_setting(db, "ff_reward_money_enabled", default=True)
    mode = (reward_mode or "points").strip().lower()
    if mode not in {"points", "money"}:
        raise HTTPException(status_code=400, detail="reward_mode должен быть points или money")
    if mode == "money" and not money_enabled:
        raise HTTPException(status_code=400, detail="Денежные награды временно отключены")

    points_default = get_int_setting(db, "reward_default_points", default=50)
    points = reward_points if reward_points is not None else points_default
    if points < 1:
        raise HTTPException(status_code=400, detail="reward_points должен быть больше 0")

    amount = reward_amount_byn
    if mode == "money":
        if amount is None or amount <= 0:
            raise HTTPException(status_code=400, detail="Укажите сумму вознаграждения в BYN")
    else:
        amount = None
    return mode, amount, points


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
        reward_mode=p.reward_mode or "points",
        reward_amount_byn=p.reward_amount_byn,
        reward_points=p.reward_points or 50,
        reward_recipient_user_id=p.reward_recipient_user_id,
        reward_points_awarded_at=p.reward_points_awarded_at,
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
    ids: Optional[str] = Query(
        None,
        description="Список id через запятую (до 80), например для страницы избранного без авторизации",
    ),
    north: Optional[float] = Query(None),
    south: Optional[float] = Query(None),
    east: Optional[float] = Query(None),
    west: Optional[float] = Query(None),
    limit: Optional[int] = Query(None, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user),
):
    stmt = select(Pet)
    if animal_type:
        stmt = stmt.where(Pet.animal_type == animal_type)
    if breed:
        stmt = stmt.where(Pet.breed.ilike(f"%{breed}%"))
    if city:
        stmt = stmt.where(Pet.city.ilike(f"%{city}%"))
    if status:
        stmt = stmt.where(Pet.status == status)
    if statuses:
        status_values = [s.strip() for s in statuses.split(",") if s.strip()]
        if status_values:
            stmt = stmt.where(Pet.status.in_(status_values))
    if days:
        stmt = stmt.where(Pet.published_at >= utc_now() - timedelta(days=days))

    is_admin = user is not None and user.role == "admin"
    viewing_own_ads = (
        user is not None
        and author_id is not None
        and author_id == user.id
    )
    if is_admin:
        if moderation_status:
            stmt = stmt.where(Pet.moderation_status == moderation_status)
    elif viewing_own_ads:
        if moderation_status:
            stmt = stmt.where(Pet.moderation_status == moderation_status)
    else:
        stmt = stmt.where(Pet.moderation_status == "approved")

    if is_archived is not None:
        stmt = stmt.where(Pet.is_archived == is_archived)
    if search:
        stmt = stmt.where(
            (Pet.description.ilike(f"%{search}%")) |
            (Pet.breed.ilike(f"%{search}%")) |
            (Pet.city.ilike(f"%{search}%"))
        )
    if author_id:
        stmt = stmt.where(Pet.author_id == author_id)
    if ids:
        id_list = [x.strip() for x in ids.split(",") if x.strip()][:80]
        if id_list:
            stmt = stmt.where(Pet.id.in_(id_list))
    if None not in (north, south, east, west):
        stmt = stmt.where(
            Pet.location_lat >= south,
            Pet.location_lat <= north,
            Pet.location_lng >= west,
            Pet.location_lng <= east,
        )
    stmt = stmt.order_by(Pet.published_at.desc())
    if limit is not None:
        stmt = stmt.offset(offset).limit(limit)
    pets = db.scalars(stmt).all()
    return [pet_to_response(p) for p in pets]


@router.get("/statistics", response_model=StatisticsResponse)
def get_statistics(db: Session = Depends(get_db)):
    active_base = (
        Pet.is_archived.is_(False),
        Pet.moderation_status == "approved",
    )
    searching = db.scalar(
        select(func.count()).select_from(Pet).where(*active_base, Pet.status == "searching")
    ) or 0
    found = db.scalar(
        select(func.count()).select_from(Pet).where(*active_base, Pet.status == "found")
    ) or 0
    cities_count = db.scalar(
        select(func.count(func.distinct(Pet.city)))
        .select_from(Pet)
        .where(
            *active_base,
            Pet.city.is_not(None),
            Pet.city != "",
        )
    ) or 0

    archived_reasons = db.scalars(
        select(Pet.archive_reason).where(Pet.is_archived.is_(True))
    ).all()
    found_pets = 0
    not_found = 0
    for r in archived_reasons:
        if _is_happy_archive(r):
            found_pets += 1
        elif r:
            not_found += 1
    total_with_outcome = found_pets + not_found
    # Процент только при выборке >= 5, иначе вводит в заблуждение
    success_rate = (
        round(100.0 * found_pets / total_with_outcome, 1)
        if total_with_outcome >= 5
        else None
    )

    users_count = db.scalar(
        select(func.count()).select_from(User).where(User.is_blocked.is_(False))
    ) or 0

    return StatisticsResponse(
        searching=searching,
        found=found,
        fostering=0,
        cities_count=cities_count,
        found_pets=found_pets,
        success_rate=success_rate,
        users_count=users_count,
    )


@router.get("/{pet_id}", response_model=PetResponse)
def get_pet(
    pet_id: str,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user),
):
    pet = db.scalar(select(Pet).where(Pet.id == pet_id))
    if not pet:
        raise HTTPException(status_code=404, detail="Объявление не найдено")
    is_admin = user is not None and user.role == "admin"
    is_author = user is not None and user.id == pet.author_id
    if pet.moderation_status != "approved" and not is_admin and not is_author:
        raise HTTPException(status_code=404, detail="Объявление не найдено")
    return pet_to_response(pet)


@router.post("", response_model=PetResponse, status_code=201)
@limiter.limit("45/minute")
async def create_pet(
    request: Request,
    data: PetCreate,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    if not data.photos:
        raise HTTPException(status_code=400, detail="Необходимо загрузить хотя бы одно фото")
    limit = _max_photos(db)
    if len(data.photos) > limit:
        raise HTTPException(status_code=400, detail=f"Максимум {limit} фото")
    if data.description and len(data.description) > 500:
        raise HTTPException(status_code=400, detail="Описание не может быть длиннее 500 символов")

    photo_urls = [save_base64_photo(p) for p in data.photos]
    reward_mode, reward_amount_byn, reward_points = _normalize_reward(
        db=db,
        reward_mode=data.reward_mode,
        reward_amount_byn=data.reward_amount_byn,
        reward_points=data.reward_points if user.role == "admin" else None,
    )

    skip_moderation = user.role == "admin" or not _moderation_required(db)
    initial_status = "approved" if skip_moderation else "pending"

    pet_id = "pet-" + str(uuid.uuid4())[:8]
    author_name = (data.author_name and data.author_name.strip()) or user.name or "Пользователь"
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
        author_name=author_name,
        contacts=_contacts_to_dict(data.contacts),
        moderation_status=initial_status,
        reward_mode=reward_mode,
        reward_amount_byn=reward_amount_byn,
        reward_points=reward_points,
    )
    try:
        db.add(pet)
        db.commit()
        db.refresh(pet)
    except OperationalError as e:
        db.rollback()
        logging.exception("Ошибка при создании объявления: %s", e)
        raise HTTPException(
            status_code=500,
            detail="Не удалось создать объявление. Попробуйте позже.",
        ) from e
    except Exception as e:
        db.rollback()
        logging.exception("Ошибка при создании объявления: %s", e)
        raise HTTPException(
            status_code=500,
            detail="Не удалось создать объявление. Попробуйте позже.",
        ) from e

    if initial_status == "approved":
        background_tasks.add_task(_send_notifications_bg, pet.id)
        try:
            enqueue_autopublish_for_pet(db, pet=pet, initiated_by=user.id)
        except Exception as e:
            logging.exception("Instagram autopublish enqueue failed for pet %s: %s", pet.id, e)

    return pet_to_response(pet)


async def _send_notifications_bg(pet_id: str):
    """Background task: load pet from a fresh DB session and send notifications."""
    from database import SessionLocal
    db = SessionLocal()
    try:
        pet = db.scalar(select(Pet).where(Pet.id == pet_id))
        if pet:
            await send_notifications_for_pet(pet, db)
    except Exception as e:
        logging.exception("Background notification error for pet %s: %s", pet_id, e)
    finally:
        db.close()


@router.patch("/{pet_id}", response_model=PetResponse)
async def update_pet(
    pet_id: str,
    data: PetUpdate,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    pet = db.scalar(select(Pet).where(Pet.id == pet_id))
    if not pet:
        raise HTTPException(status_code=404, detail="Объявление не найдено")
    if pet.author_id != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Нет прав на редактирование")

    old_moderation_status = pet.moderation_status

    COMMON_FIELDS = {
        "photos", "animal_type", "breed", "colors", "gender",
        "approximate_age", "status", "description", "city",
        "location", "contacts", "is_archived", "archive_reason",
        "reward_mode", "reward_amount_byn", "reward_points", "reward_helper_code",
    }
    ADMIN_ONLY_FIELDS = {"moderation_status", "moderation_reason"}
    d = data.model_dump(exclude_unset=True)
    if "reward_points" in d and user.role != "admin":
        raise HTTPException(status_code=403, detail="Только администратор может изменять количество очков")
    allowed_fields = set(COMMON_FIELDS)
    if user.role == "admin":
        allowed_fields.update(ADMIN_ONLY_FIELDS)
    d = {k: v for k, v in d.items() if k in allowed_fields}
    if "photos" in d and d["photos"] is not None:
        limit = _max_photos(db)
        if len(d["photos"]) > limit:
            raise HTTPException(status_code=400, detail=f"Максимум {limit} фото")
        d["photos"] = [save_base64_photo(p) for p in d["photos"]]
    if "description" in d and d["description"] and len(d["description"]) > 500:
        raise HTTPException(status_code=400, detail="Описание не может быть длиннее 500 символов")
    if "location" in d and d["location"]:
        d["location_lat"] = d["location"]["lat"]
        d["location_lng"] = d["location"]["lng"]
        del d["location"]
    if "contacts" in d and d["contacts"] is not None:
        if hasattr(d["contacts"], "model_dump"):
            d["contacts"] = d["contacts"].model_dump()
        elif not isinstance(d["contacts"], dict):
            d["contacts"] = dict(d["contacts"])
    helper_code = d.pop("reward_helper_code", None)
    if (
        "reward_mode" in d
        or "reward_amount_byn" in d
        or "reward_points" in d
    ):
        reward_mode_input = d.get("reward_mode", pet.reward_mode)
        reward_amount_input = d.get("reward_amount_byn", pet.reward_amount_byn)
        reward_points_input = d.get("reward_points", pet.reward_points)
        reward_mode, reward_amount_byn, reward_points = _normalize_reward(
            db=db,
            reward_mode=reward_mode_input,
            reward_amount_byn=reward_amount_input,
            reward_points=reward_points_input,
        )
        d["reward_mode"] = reward_mode
        d["reward_amount_byn"] = reward_amount_byn
        d["reward_points"] = reward_points
    helper_user = None
    award_points_now = False
    if helper_code:
        if pet.reward_points_awarded_at:
            raise HTTPException(status_code=400, detail="Очки за это объявление уже начислены")
        normalized_code = helper_code.strip().upper()
        helper_user = db.scalar(select(User).where(User.helper_code == normalized_code))
        if not helper_user:
            raise HTTPException(status_code=404, detail="Пользователь с таким ID помощника не найден")
        if helper_user.id == pet.author_id:
            raise HTTPException(status_code=400, detail="Нельзя начислить очки самому себе")
        new_archive_reason = d.get("archive_reason", pet.archive_reason)
        new_archived = d.get("is_archived", pet.is_archived)
        new_reward_mode = d.get("reward_mode", pet.reward_mode) or "points"
        if not new_archived or not _is_happy_archive(new_archive_reason):
            raise HTTPException(
                status_code=400,
                detail="Очки можно начислить только при архивировании с успешной причиной",
            )
        if new_reward_mode != "points":
            raise HTTPException(status_code=400, detail="Очки доступны только в режиме награды «очки»")
        award_points_now = True
    for k, v in d.items():
        setattr(pet, k, v)
    if award_points_now and helper_user is not None:
        points = pet.reward_points or 50
        pet.reward_recipient_user_id = helper_user.id
        pet.reward_points_awarded_at = utc_now()
        helper_user.helper_confirmed_count = (helper_user.helper_confirmed_count or 0) + 1
        helper_user.points_balance = (helper_user.points_balance or 0) + points
        helper_user.points_earned_total = (helper_user.points_earned_total or 0) + points
        db.add(
            PointsTransaction(
                id=f"ptx-{uuid.uuid4().hex[:16]}",
                user_id=helper_user.id,
                pet_id=pet.id,
                amount=points,
                kind="helper_reward",
                note=f"Помощь с объявлением {pet.id}",
                created_at=utc_now(),
            )
        )
    pet.updated_at = utc_now()
    moderation_updated = any(field in d for field in ADMIN_ONLY_FIELDS)
    if moderation_updated:
        pet.moderated_at = utc_now()
        pet.moderated_by = user.id
    elif pet.author_id == user.id:
        if _moderation_required(db) and user.role != "admin":
            pet.moderation_status = "pending"
            pet.moderation_reason = None
            pet.moderated_at = None
            pet.moderated_by = None
    try:
        db.commit()
        db.refresh(pet)
    except Exception as e:
        db.rollback()
        logging.exception("Ошибка при обновлении объявления %s: %s", pet_id, e)
        raise HTTPException(
            status_code=500,
            detail="Не удалось обновить объявление. Попробуйте позже.",
        ) from e

    if old_moderation_status != "approved" and pet.moderation_status == "approved":
        background_tasks.add_task(_send_notifications_bg, pet.id)
        try:
            enqueue_autopublish_for_pet(db, pet=pet, initiated_by=user.id)
        except Exception as e:
            logging.exception("Instagram autopublish enqueue failed for pet %s: %s", pet.id, e)

    return pet_to_response(pet)


@router.delete("/{pet_id}", status_code=204)
def delete_pet(
    pet_id: str,
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    pet = db.scalar(select(Pet).where(Pet.id == pet_id))
    if not pet:
        raise HTTPException(status_code=404, detail="Объявление не найдено")
    if pet.author_id != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Нет прав на удаление")
    try:
        db.execute(delete(Report).where(Report.pet_id == pet_id))
        db.delete(pet)
        db.commit()
    except Exception as e:
        db.rollback()
        logging.exception("Ошибка при удалении объявления %s: %s", pet_id, e)
        raise HTTPException(
            status_code=500,
            detail="Не удалось удалить объявление. Попробуйте позже.",
        ) from e
    return None
