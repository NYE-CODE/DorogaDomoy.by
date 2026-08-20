"""Pets CRUD API."""
import asyncio
import logging
from datetime import timedelta
from pathlib import Path
from typing import Optional
import uuid
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request
from sqlalchemy import delete, func, or_, select
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session, selectinload

from database import get_db
from models import Pet, PointsTransaction, ProfilePet, Report, Shelter, ShelterMembership, User
from schemas import (
    ARCHIVE_HAPPY_KEYWORDS,
    PaginatedPetListResponse,
    PetCreate,
    PetUpdate,
    PetResponse,
    PhotoAnalyzeRequest,
    PhotoAnalyzeResponse,
    SimilarPetItem,
    SimilarPetsResponse,
    StatisticsResponse,
    SightingCreate,
    SightingCreateNested,
    SightingResponse,
    _is_happy_archive,
    _trim_optional_str,
)
from pet_similarity import OPPOSITE_STATUS, find_similar_pets
from integrations.groq_vision import analyze_pet_photo
from integrations.photo_analyze_batch import analyze_pet_photos
from integrations.photo_embeddings import save_pet_embedding
from routers.sightings import (
    run_create_sighting,
    run_get_sighting_counts,
    run_list_sightings_for_pet,
)
from auth import get_current_user, get_current_user_required, require_admin
from platform_settings import DEFAULT_MAX_PHOTOS, get_bool_setting, get_int_setting, get_settings_with_defaults
from integrations.telegram import send_notifications_for_pet, send_pending_moderation_alert_sync
try:
    from instagram_publications import enqueue_autopublish_for_pet
except Exception:
    logging.getLogger(__name__).exception("Instagram autopublish unavailable")

    def enqueue_autopublish_for_pet(*_args, **_kwargs):
        return []
from listing_lifecycle import (
    LISTING_EXPIRED_ARCHIVE_REASON,
    compute_listing_expires_at,
)
from time_utils import utc_now
from upload_utils import delete_upload_url, save_data_image
from search_normalization import normalize_search_query, resolve_animal_type_from_search
from pet_create_trace import (
    collect_empty_pet_create_fields,
    format_pet_created_from_profile_log,
)
from rate_limit import limiter
from ttl_cache import statistics_cache_get, statistics_cache_set

LIST_PETS_DEFAULT_LIMIT = 500


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
        settings = get_settings_with_defaults(db, {"max_photos": str(DEFAULT_MAX_PHOTOS)})
        return int(settings.get("max_photos", DEFAULT_MAX_PHOTOS))
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


def _persist_photo_list(photos: list[str]) -> tuple[list[str], list[str]]:
    """Save base64 photos to disk. Returns (urls, newly_created_urls_for_cleanup)."""
    urls: list[str] = []
    new_uploads: list[str] = []
    try:
        for photo in photos:
            if photo.startswith("data:"):
                url = save_base64_photo(photo)
                urls.append(url)
                new_uploads.append(url)
            else:
                urls.append(photo)
        return urls, new_uploads
    except Exception:
        for url in new_uploads:
            delete_upload_url(url, UPLOADS_DIR)
        raise


def _cleanup_new_uploads(urls: list[str]) -> None:
    for url in urls:
        delete_upload_url(url, UPLOADS_DIR)


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


def _shelter_pet_nickname(p: Pet) -> Optional[str]:
    if (p.pet_scope or "lost_found") != "shelter_pet":
        return None
    det = getattr(p, "shelter_details", None)
    if det is None:
        return None
    nick = getattr(det, "nickname", None)
    if nick is None:
        return None
    s = str(nick).strip()
    return s if s else None


def pet_to_response(p: Pet) -> PetResponse:
    return PetResponse(
        id=p.id,
        photos=p.photos or [],
        animal_type=p.animal_type,
        breed=p.breed,
        colors=p.colors or [],
        gender=p.gender,
        approximate_age=p.approximate_age,
        approximate_age_raw=getattr(p, "approximate_age_raw", None),
        status=p.status,
        description=p.description,
        distinctive_marks=getattr(p, "distinctive_marks", None) or [],
        city=p.city,
        location={"lat": p.location_lat, "lng": p.location_lng},
        published_at=p.published_at,
        expires_at=getattr(p, "expires_at", None),
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
        pet_scope=p.pet_scope or "lost_found",
        shelter_id=getattr(p, "shelter_id", None),
        adoption_status=getattr(p, "adoption_status", None),
        is_published=bool(getattr(p, "is_published", True)),
        published_by_user_id=getattr(p, "published_by_user_id", None),
        updated_by_user_id=getattr(p, "updated_by_user_id", None),
        nickname=_shelter_pet_nickname(p),
        registration_authority=getattr(p, "registration_authority", None),
        registration_token_number=getattr(p, "registration_token_number", None),
        profile_pet_id=getattr(p, "profile_pet_id", None),
    )


def _is_active_shelter_member(db: Session, shelter_id: Optional[str], user_id: str) -> bool:
    if not shelter_id:
        return False
    m = db.scalar(
        select(ShelterMembership).where(
            ShelterMembership.shelter_id == shelter_id,
            ShelterMembership.user_id == user_id,
            ShelterMembership.status == "active",
        )
    )
    return m is not None


def pet_favoritable(pet: Pet, user: User) -> bool:
    """Можно ли добавить объявление в избранное (не черновик / не архив для чужих)."""
    if user.role == "admin" or pet.author_id == user.id:
        return True
    if pet.is_archived:
        return False
    if pet.moderation_status != "approved":
        return False
    if (pet.pet_scope or "lost_found") == "shelter_pet" and not bool(getattr(pet, "is_published", True)):
        return False
    return True


def _public_shelter_pet_filters_needed(
    *,
    is_admin: bool,
    viewing_own_ads: bool,
    shelter_id: Optional[str],
    pet_scope: Optional[str],
) -> bool:
    if is_admin or viewing_own_ads:
        return False
    return bool(shelter_id or pet_scope == "shelter_pet")


def _apply_pet_list_filters(
    stmt,
    *,
    animal_type: Optional[str],
    breed: Optional[str],
    city: Optional[str],
    status: Optional[str],
    statuses: Optional[str],
    days: Optional[int],
    moderation_status: Optional[str],
    is_archived: Optional[bool],
    search: Optional[str],
    author_id: Optional[str],
    pet_scope: Optional[str],
    shelter_id: Optional[str],
    adoption_status: Optional[str],
    ids: Optional[str],
    north: Optional[float],
    south: Optional[float],
    east: Optional[float],
    west: Optional[float],
    user: Optional[User],
):
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
    # Публичная выдача: только approved. pending/rejected не утекают без admin / своих объявлений.
    if is_admin:
        if moderation_status:
            stmt = stmt.where(Pet.moderation_status == moderation_status)
    elif viewing_own_ads:
        if moderation_status:
            stmt = stmt.where(Pet.moderation_status == moderation_status)
    else:
        stmt = stmt.where(Pet.moderation_status == "approved")
        stmt = stmt.where(or_(Pet.pet_scope != "shelter_pet", Pet.is_published.is_(True)))
        stmt = stmt.where(Pet.is_archived.is_(False))

    if is_admin or viewing_own_ads:
        if is_archived is not None:
            stmt = stmt.where(Pet.is_archived == is_archived)

    if _public_shelter_pet_filters_needed(
        is_admin=is_admin,
        viewing_own_ads=viewing_own_ads,
        shelter_id=shelter_id,
        pet_scope=pet_scope,
    ):
        stmt = stmt.join(Shelter, Shelter.id == Pet.shelter_id).where(
            Shelter.moderation_status == "approved",
        )
    if search:
        q = normalize_search_query(search) or search.strip()
        text_match = (
            (Pet.description.ilike(f"%{q}%"))
            | (Pet.breed.ilike(f"%{q}%"))
            | (Pet.city.ilike(f"%{q}%"))
            | (Pet.distinctive_marks.ilike(f"%{q}%"))
        )
        # Исходная строка (до lower) — на случай точного регистра в ILIKE-совместимых БД
        raw = search.strip()
        if raw and raw != q:
            text_match = text_match | (
                (Pet.description.ilike(f"%{raw}%"))
                | (Pet.breed.ilike(f"%{raw}%"))
                | (Pet.city.ilike(f"%{raw}%"))
                | (Pet.distinctive_marks.ilike(f"%{raw}%"))
            )
        animal_from_search = resolve_animal_type_from_search(search)
        if animal_from_search:
            stmt = stmt.where(text_match | (Pet.animal_type == animal_from_search))
        else:
            stmt = stmt.where(text_match)
    if author_id:
        stmt = stmt.where(Pet.author_id == author_id)
    if not pet_scope and not shelter_id and not ids:
        stmt = stmt.where(or_(Pet.pet_scope.is_(None), Pet.pet_scope != "shelter_pet"))
    if pet_scope:
        stmt = stmt.where(Pet.pet_scope == pet_scope)
    if shelter_id:
        stmt = stmt.where(Pet.shelter_id == shelter_id)
    if adoption_status:
        stmt = stmt.where(Pet.adoption_status == adoption_status)
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
    return stmt


@router.get("", response_model=PaginatedPetListResponse)
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
    pet_scope: Optional[str] = Query(None),
    shelter_id: Optional[str] = Query(None),
    adoption_status: Optional[str] = Query(None),
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
    filter_kwargs = dict(
        animal_type=animal_type,
        breed=breed,
        city=city,
        status=status,
        statuses=statuses,
        days=days,
        moderation_status=moderation_status,
        is_archived=is_archived,
        search=search,
        author_id=author_id,
        pet_scope=pet_scope,
        shelter_id=shelter_id,
        adoption_status=adoption_status,
        ids=ids,
        north=north,
        south=south,
        east=east,
        west=west,
        user=user,
    )
    filtered = _apply_pet_list_filters(select(Pet), **filter_kwargs)
    total = db.scalar(select(func.count()).select_from(filtered.subquery())) or 0
    effective_limit = limit if limit is not None else LIST_PETS_DEFAULT_LIMIT
    pets = db.scalars(
        _apply_pet_list_filters(select(Pet), **filter_kwargs)
        .options(selectinload(Pet.shelter_details))
        .order_by(Pet.published_at.desc())
        .offset(offset)
        .limit(effective_limit)
    ).all()
    return PaginatedPetListResponse(
        items=[pet_to_response(p) for p in pets],
        total=total,
        limit=effective_limit,
        offset=offset,
    )


def _happy_archive_sql_condition():
    return or_(*[Pet.archive_reason.ilike(f"%{kw}%") for kw in ARCHIVE_HAPPY_KEYWORDS])


def _compute_statistics(db: Session) -> StatisticsResponse:
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

    happy_cond = _happy_archive_sql_condition()
    found_pets = db.scalar(
        select(func.count()).select_from(Pet).where(Pet.is_archived.is_(True), happy_cond)
    ) or 0
    not_found = db.scalar(
        select(func.count())
        .select_from(Pet)
        .where(
            Pet.is_archived.is_(True),
            Pet.archive_reason.isnot(None),
            Pet.archive_reason != "",
            ~happy_cond,
        )
    ) or 0
    total_with_outcome = found_pets + not_found
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


@router.get("/statistics", response_model=StatisticsResponse)
def get_statistics(db: Session = Depends(get_db)):
    cached = statistics_cache_get()
    if cached is not None:
        return StatisticsResponse(**cached)

    result = _compute_statistics(db)
    statistics_cache_set(result.model_dump())
    return result


@router.get("/sightings/counts")
def pet_sightings_counts(
    pet_ids: str = Query(..., description="Comma-separated pet IDs"),
    db: Session = Depends(get_db),
):
    return run_get_sighting_counts(pet_ids, db)


@router.get("/{pet_id}/sightings", response_model=list[SightingResponse])
def get_pet_sightings(
    pet_id: str,
    days: Optional[int] = Query(7, ge=1, le=90),
    db: Session = Depends(get_db),
):
    return run_list_sightings_for_pet(pet_id, days, db)


@router.post("/{pet_id}/sightings", response_model=SightingResponse, status_code=201)
@limiter.limit("30/minute")
def create_pet_sighting(
    request: Request,
    pet_id: str,
    data: SightingCreateNested,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user),
):
    full = SightingCreate(pet_id=pet_id, **data.model_dump())
    return run_create_sighting(request, full, background_tasks, db, user)


@router.post("/analyze-photo", response_model=PhotoAnalyzeResponse)
@limiter.limit("6/minute;30/hour")
def analyze_photo(
    request: Request,
    data: PhotoAnalyzeRequest,
    user: User = Depends(get_current_user_required),
):
    """AI-подсказка по фото (Groq). До 3 кадров за запрос. Лимит: 6/мин и 30/час на IP."""
    del user  # auth required; лимит по IP (см. rate_limit.get_client_ip)
    ordered: list[str] = []
    seen: set[str] = set()
    for img in (data.images or []) + ([data.image] if data.image else []):
        key = (img or "").strip()
        if not key or key in seen:
            continue
        seen.add(key)
        ordered.append(key)
        if len(ordered) >= 3:
            break
    if not ordered:
        raise HTTPException(status_code=400, detail="Нужно хотя бы одно фото")
    result = analyze_pet_photos(ordered) if len(ordered) > 1 else analyze_pet_photo(ordered[0])
    return PhotoAnalyzeResponse(**result)


@router.get("/{pet_id}/similar", response_model=SimilarPetsResponse)
@limiter.limit("60/minute")
def get_similar_pets(
    request: Request,
    pet_id: str,
    limit: int = Query(10, ge=1, le=30),
    radius_km: float = Query(15.0, ge=1.0, le=50.0),
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user),
):
    """Похожие объявления с противоположным статусом (lost ↔ found)."""
    del request, user
    source = db.scalar(select(Pet).where(Pet.id == pet_id))
    if not source:
        raise HTTPException(status_code=404, detail="Объявление не найдено")
    if (source.pet_scope or "lost_found") != "lost_found":
        raise HTTPException(status_code=400, detail="Похожие доступны только для объявлений lost/found")

    matching_status = OPPOSITE_STATUS.get(source.status or "")
    if not matching_status:
        raise HTTPException(status_code=400, detail="Неподдерживаемый статус объявления")

    ranked = find_similar_pets(db, source, limit=limit, radius_km=radius_km)
    return SimilarPetsResponse(
        source_pet_id=source.id,
        matching_status=matching_status,
        items=[
            SimilarPetItem(
                pet=pet_to_response(item["pet"]),
                score=item["score"],
                match_percent=item["match_percent"],
                distance_km=item["distance_km"],
                reasons=item["reasons"],
            )
            for item in ranked
        ],
    )


@router.get("/{pet_id}", response_model=PetResponse)
def get_pet(
    pet_id: str,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user),
):
    pet = db.scalar(
        select(Pet).options(selectinload(Pet.shelter_details)).where(Pet.id == pet_id)
    )
    if not pet:
        raise HTTPException(status_code=404, detail="Объявление не найдено")
    is_admin = user is not None and user.role == "admin"
    is_author = user is not None and user.id == pet.author_id
    is_member = False
    if user is not None and (pet.pet_scope or "lost_found") == "shelter_pet" and pet.shelter_id:
        is_member = _is_active_shelter_member(db, pet.shelter_id, user.id)
    can_manage = is_admin or is_author or is_member
    if pet.is_archived and not can_manage:
        raise HTTPException(status_code=404, detail="Объявление не найдено")
    if (pet.pet_scope or "lost_found") == "shelter_pet" and pet.shelter_id and not can_manage:
        shelter = db.scalar(select(Shelter).where(Shelter.id == pet.shelter_id))
        if not shelter or shelter.moderation_status != "approved":
            raise HTTPException(status_code=404, detail="Объявление не найдено")
    if pet.moderation_status != "approved" and not is_admin and not is_author:
        raise HTTPException(status_code=404, detail="Объявление не найдено")
    if (pet.pet_scope or "lost_found") == "shelter_pet" and not pet.is_published and not (is_admin or is_author or is_member):
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
    # Длина description уже проверена в PetCreate (PET_DESCRIPTION_MIN/MAX_LENGTH).

    reward_mode, reward_amount_byn, reward_points = _normalize_reward(
        db=db,
        reward_mode=data.reward_mode,
        reward_amount_byn=data.reward_amount_byn,
        reward_points=data.reward_points if user.role == "admin" else None,
    )

    pet_scope = (data.pet_scope or "lost_found").strip().lower()
    shelter_id = data.shelter_id.strip() if data.shelter_id else None
    if pet_scope not in {"lost_found", "shelter_pet"}:
        raise HTTPException(status_code=400, detail="pet_scope: lost_found или shelter_pet")
    if pet_scope == "shelter_pet":
        if not shelter_id:
            raise HTTPException(status_code=400, detail="Для питомца приюта обязателен shelter_id")
        if user.role != "admin" and not _is_active_shelter_member(db, shelter_id, user.id):
            raise HTTPException(status_code=403, detail="Нет прав добавлять питомцев этого приюта")

    skip_moderation = user.role == "admin" or not _moderation_required(db)
    if pet_scope == "shelter_pet":
        skip_moderation = True
    initial_status = "approved" if skip_moderation else "pending"

    profile_pet_id = (data.profile_pet_id or "").strip() or None
    if profile_pet_id:
        profile = db.scalar(select(ProfilePet).where(ProfilePet.id == profile_pet_id))
        if not profile:
            raise HTTPException(status_code=404, detail="Карточка питомца не найдена")
        if profile.owner_id != user.id and user.role != "admin":
            raise HTTPException(status_code=403, detail="Нельзя привязать чужую карточку питомца")

    pet_id = "pet-" + str(uuid.uuid4())[:8]
    author_name = (data.author_name and data.author_name.strip()) or user.name or "Пользователь"
    now = utc_now()

    new_uploads: list[str] = []
    committed = False
    try:
        photo_urls, new_uploads = _persist_photo_list(data.photos)
        pet = Pet(
            id=pet_id,
            photos=photo_urls,
            animal_type=data.animal_type,
            breed=data.breed,
            colors=data.colors,
            gender=data.gender,
            approximate_age=data.approximate_age,
            approximate_age_raw=_trim_optional_str(getattr(data, "approximate_age_raw", None)),
            status=data.status,
            description=data.description,
            distinctive_marks=data.distinctive_marks or [],
            city=data.city,
            location_lat=data.location.lat,
            location_lng=data.location.lng,
            author_id=user.id,
            author_name=author_name,
            contacts=_contacts_to_dict(data.contacts),
            moderation_status=initial_status,
            published_at=now,
            expires_at=compute_listing_expires_at(db, now) if initial_status == "approved" else None,
            reward_mode=reward_mode,
            reward_amount_byn=reward_amount_byn,
            reward_points=reward_points,
            pet_scope=pet_scope,
            shelter_id=shelter_id,
            adoption_status=data.adoption_status,
            is_published=bool(data.is_published),
            published_by_user_id=user.id,
            updated_by_user_id=user.id,
            registration_authority=data.registration_authority,
            registration_token_number=data.registration_token_number,
            profile_pet_id=profile_pet_id,
        )
        db.add(pet)
        db.commit()
        db.refresh(pet)
        committed = True
        if profile_pet_id:
            logging.info(
                format_pet_created_from_profile_log(
                    profile_pet_id=profile_pet_id,
                    pet_id=pet.id,
                    empty_fields=collect_empty_pet_create_fields(data),
                )
            )
    except OperationalError as e:
        db.rollback()
        logging.exception("Ошибка при создании объявления: %s", e)
        raise HTTPException(
            status_code=500,
            detail="Не удалось создать объявление. Попробуйте позже.",
        ) from e
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logging.exception("Ошибка при создании объявления: %s", e)
        raise HTTPException(
            status_code=500,
            detail="Не удалось создать объявление. Попробуйте позже.",
        ) from e
    finally:
        if not committed:
            _cleanup_new_uploads(new_uploads)

    if initial_status == "approved":
        background_tasks.add_task(_send_notifications_bg, pet.id)
        _enqueue_photo_embedding(background_tasks, pet.id)
        try:
            enqueue_autopublish_for_pet(db, pet=pet, initiated_by=user.id)
        except Exception as e:
            logging.exception("Instagram autopublish enqueue failed for pet %s: %s", pet.id, e)
    elif initial_status == "pending":
        background_tasks.add_task(send_pending_moderation_alert_sync, pet.id)

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


def _enqueue_photo_embedding(background_tasks: BackgroundTasks, pet_id: str) -> None:
    background_tasks.add_task(save_pet_embedding, pet_id)


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
    can_edit = user.role == "admin" or pet.author_id == user.id
    if not can_edit and (pet.pet_scope or "lost_found") == "shelter_pet":
        can_edit = _is_active_shelter_member(db, pet.shelter_id, user.id)
    if not can_edit:
        raise HTTPException(status_code=403, detail="Нет прав на редактирование")

    old_moderation_status = pet.moderation_status

    COMMON_FIELDS = {
        "photos", "animal_type", "breed", "colors", "gender",
        "approximate_age", "approximate_age_raw", "status", "description", "distinctive_marks", "city",
        "location", "contacts", "is_archived", "archive_reason",
        "reward_mode", "reward_amount_byn", "reward_points", "reward_helper_code",
        "registration_authority", "registration_token_number",
    }
    ADMIN_ONLY_FIELDS = {
        "moderation_status",
        "moderation_reason",
        "pet_scope",
        "shelter_id",
        "adoption_status",
        "is_published",
    }
    d = data.model_dump(exclude_unset=True)
    photos_changed = "photos" in d and d["photos"] is not None
    if "reward_points" in d and user.role != "admin":
        raise HTTPException(status_code=403, detail="Только администратор может изменять количество очков")
    allowed_fields = set(COMMON_FIELDS)
    if user.role == "admin":
        allowed_fields.update(ADMIN_ONLY_FIELDS)
    d = {k: v for k, v in d.items() if k in allowed_fields}
    new_uploads: list[str] = []
    committed = False
    try:
        if "photos" in d and d["photos"] is not None:
            limit = _max_photos(db)
            if len(d["photos"]) > limit:
                raise HTTPException(status_code=400, detail=f"Максимум {limit} фото")
            d["photos"], new_uploads = _persist_photo_list(d["photos"])
        if "description" in d and d["description"] is not None:
            # Длина уже проверена в PetUpdate (PET_DESCRIPTION_MIN/MAX_LENGTH).
            pass
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
        pet.updated_by_user_id = user.id
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
            if _moderation_required(db) and user.role != "admin" and (pet.pet_scope or "lost_found") != "shelter_pet":
                pet.moderation_status = "pending"
                pet.moderation_reason = None
                pet.moderated_at = None
                pet.moderated_by = None
        if old_moderation_status != "approved" and pet.moderation_status == "approved" and not pet.expires_at:
            pet.expires_at = compute_listing_expires_at(db)
        db.commit()
        committed = True
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logging.exception("Ошибка при обновлении объявления %s: %s", pet_id, e)
        raise HTTPException(
            status_code=500,
            detail="Не удалось обновить объявление. Попробуйте позже.",
        ) from e
    finally:
        if not committed:
            _cleanup_new_uploads(new_uploads)

    pet = db.scalar(
        select(Pet).options(selectinload(Pet.shelter_details)).where(Pet.id == pet_id)
    )
    if not pet:
        raise HTTPException(status_code=404, detail="Объявление не найдено")

    if old_moderation_status != "approved" and pet.moderation_status == "approved":
        background_tasks.add_task(_send_notifications_bg, pet.id)
        _enqueue_photo_embedding(background_tasks, pet.id)
        try:
            enqueue_autopublish_for_pet(db, pet=pet, initiated_by=user.id)
        except Exception as e:
            logging.exception("Instagram autopublish enqueue failed for pet %s: %s", pet.id, e)
    elif photos_changed and pet.moderation_status == "approved":
        _enqueue_photo_embedding(background_tasks, pet.id)

    return pet_to_response(pet)


@router.post("/{pet_id}/renew", response_model=PetResponse)
@limiter.limit("30/minute")
def renew_pet_listing(
    request: Request,
    pet_id: str,
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    pet = db.scalar(select(Pet).where(Pet.id == pet_id))
    if not pet:
        raise HTTPException(status_code=404, detail="Объявление не найдено")
    if pet.author_id != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Нет прав на продление")
    if (pet.pet_scope or "lost_found") != "lost_found":
        raise HTTPException(status_code=400, detail="Продление доступно только для объявлений")

    expired_archive = pet.is_archived and pet.archive_reason == LISTING_EXPIRED_ARCHIVE_REASON
    active_listing = not pet.is_archived and pet.moderation_status == "approved"
    if not active_listing and not expired_archive:
        raise HTTPException(status_code=400, detail="Нельзя продлить это объявление")

    pet.expires_at = compute_listing_expires_at(db)
    pet.is_archived = False
    pet.archive_reason = None
    pet.updated_at = utc_now()
    pet.updated_by_user_id = user.id
    db.commit()
    db.refresh(pet)
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
