"""Sightings API: видения «видел похожее животное» на карте объявления."""
import hashlib
import logging
import os
import uuid
from datetime import timedelta
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from database import get_db
from models import Pet, Sighting, User
from schemas import SightingCreate, SightingResponse
from auth import get_current_user
from integrations.telegram import send_sighting_notification_sync
from rate_limit import limiter
from time_utils import utc_now

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/sightings", tags=["sightings"])
TRUST_PROXY_HEADERS = os.getenv("TRUST_PROXY_HEADERS", "false").lower() in {"1", "true", "yes", "on"}


def _get_ip_hash(request: Request) -> Optional[str]:
    """Returns a short hash of client IP for rate limiting (privacy-friendly)."""
    ip = request.client.host if request.client else None
    if TRUST_PROXY_HEADERS:
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            ip = forwarded.split(",")[0].strip()
    if not ip:
        return None
    return hashlib.sha256(ip.encode()).hexdigest()[:16]


def sighting_to_response(s: Sighting) -> SightingResponse:
    return SightingResponse(
        id=s.id,
        pet_id=s.pet_id,
        location_lat=s.location_lat,
        location_lng=s.location_lng,
        seen_at=s.seen_at,
        comment=s.comment,
        has_contact=s.contact is not None and s.contact.strip() != "",
        created_at=s.created_at,
    )


def run_create_sighting(
    request: Request,
    data: SightingCreate,
    background_tasks: BackgroundTasks,
    db: Session,
    user: Optional[User],
) -> SightingResponse:
    """Общая логика создания видения (legacy POST /sightings и POST /pets/{id}/sightings)."""
    pet_id = data.pet_id
    pet = db.scalar(select(Pet).where(Pet.id == pet_id))
    if not pet:
        raise HTTPException(status_code=404, detail="Объявление не найдено")

    if pet.is_archived:
        raise HTTPException(status_code=400, detail="Нельзя добавлять видения к архивному объявлению")

    if pet.status != "searching":
        raise HTTPException(
            status_code=400,
            detail="Видения можно добавлять только к объявлениям со статусом «Ищут»",
        )

    if user and user.id == pet.author_id:
        raise HTTPException(
            status_code=400,
            detail="Автор объявления не может добавлять видения — только другие люди",
        )

    now = utc_now()
    day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    anon_ip_hash: Optional[str] = None
    if user:
        recent = db.scalar(
            select(Sighting).where(
                Sighting.pet_id == pet_id,
                Sighting.reporter_id == user.id,
                Sighting.created_at >= day_start,
            )
        )
        if recent:
            raise HTTPException(
                status_code=429,
                detail="Вы уже добавляли видение сегодня. Повторите завтра.",
            )
    else:
        anon_ip_hash = _get_ip_hash(request)
        if not anon_ip_hash:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Не удалось определить соединение для анонимного видения. "
                    "Войдите в аккаунт или попробуйте позже."
                ),
            )
        recent = db.scalar(
            select(Sighting).where(
                Sighting.pet_id == pet_id,
                Sighting.ip_hash == anon_ip_hash,
                Sighting.created_at >= day_start,
            )
        )
        if recent:
            raise HTTPException(
                status_code=429,
                detail="Вы уже добавляли видение сегодня. Повторите завтра.",
            )

    sighting = Sighting(
        id=f"sight-{uuid.uuid4().hex[:12]}",
        pet_id=pet_id,
        location_lat=data.location_lat,
        location_lng=data.location_lng,
        seen_at=data.seen_at,
        comment=data.comment if data.comment and data.comment.strip() else None,
        contact=data.contact if data.contact and data.contact.strip() else None,
        reporter_id=user.id if user else None,
        ip_hash=anon_ip_hash,
    )
    db.add(sighting)
    db.commit()
    db.refresh(sighting)

    background_tasks.add_task(send_sighting_notification_sync, sighting.id, pet.id)

    return sighting_to_response(sighting)


def run_list_sightings_for_pet(
    pet_id: str,
    days: Optional[int],
    db: Session,
) -> list[SightingResponse]:
    pet = db.scalar(select(Pet).where(Pet.id == pet_id))
    if not pet:
        raise HTTPException(status_code=404, detail="Объявление не найдено")

    cutoff = utc_now() - timedelta(days=min(days or 7, 90))
    sightings = db.scalars(
        select(Sighting)
        .where(Sighting.pet_id == pet_id, Sighting.seen_at >= cutoff)
        .order_by(Sighting.seen_at.desc())
    ).all()
    return [sighting_to_response(s) for s in sightings]


def run_get_sighting_counts(pet_ids: str, db: Session) -> dict[str, int]:
    ids = [x.strip() for x in pet_ids.split(",") if x.strip()]
    if not ids:
        return {}

    cutoff = utc_now() - timedelta(days=7)
    rows = db.execute(
        select(Sighting.pet_id, func.count(Sighting.id).label("cnt"))
        .where(Sighting.pet_id.in_(ids), Sighting.seen_at >= cutoff)
        .group_by(Sighting.pet_id)
    ).all()
    return {str(r.pet_id): r.cnt for r in rows}


@router.post("", response_model=SightingResponse, status_code=201)
@limiter.limit("30/minute")
def create_sighting(
    request: Request,
    data: SightingCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user),
):
    return run_create_sighting(request, data, background_tasks, db, user)


@router.get("/pet/{pet_id}", response_model=list[SightingResponse])
def list_sightings(
    pet_id: str,
    days: Optional[int] = Query(7, ge=1, le=90),
    db: Session = Depends(get_db),
):
    return run_list_sightings_for_pet(pet_id, days, db)


@router.get("/counts")
def get_sighting_counts(
    pet_ids: str = Query(..., description="Comma-separated pet IDs"),
    db: Session = Depends(get_db),
):
    return run_get_sighting_counts(pet_ids, db)
