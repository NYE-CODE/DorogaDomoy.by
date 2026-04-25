"""Admin API for Instagram accounts, routing and publication queue."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from auth import get_current_user_required, require_admin
from database import get_db
from instagram_publications import (
    enqueue_manual_publications,
    enqueue_publication,
    is_autopublish_enabled,
    normalize_region_key,
    resolve_account_for_region,
)
from instagram_worker import process_publication_by_id
from models import InstagramAccount, InstagramPublication, InstagramRegionRoute, Pet, User
from platform_settings import get_bool_setting
from schemas import (
    InstagramAccountCreate,
    InstagramAccountResponse,
    InstagramAccountUpdate,
    InstagramBoostCreate,
    InstagramBoostEligibilityResponse,
    InstagramPublicationCreateManual,
    InstagramPublicationResponse,
    InstagramRegionRouteCreate,
    InstagramRegionRouteResponse,
    InstagramRegionRouteUpdate,
)
from token_crypto import encrypt_token
from time_utils import utc_now

router = APIRouter(prefix="/instagram", tags=["instagram"])

MANUAL_WHEN_AUTO_OFF_KEY = "instagram_manual_when_auto_off"
BOOST_FEATURE_FLAG_KEY = "ff_instagram_boost_stories"
BOOST_MIN_AGE_DAYS = 7
BOOST_LIMIT_DAYS = 7


def _as_utc_naive(dt: datetime | None) -> datetime:
    if dt is None:
        return datetime.utcnow()
    if dt.tzinfo is None:
        return dt
    return dt.astimezone(timezone.utc).replace(tzinfo=None)


def _account_to_response(row: InstagramAccount) -> InstagramAccountResponse:
    return InstagramAccountResponse(
        id=row.id,
        name=row.name,
        instagram_business_id=row.instagram_business_id,
        facebook_page_id=row.facebook_page_id,
        has_access_token=bool((row.access_token or "").strip()),
        is_active=bool(row.is_active),
        created_at=row.created_at or utc_now(),
        updated_at=row.updated_at or utc_now(),
    )


def _route_to_response(db: Session, row: InstagramRegionRoute) -> InstagramRegionRouteResponse:
    account = db.scalar(select(InstagramAccount).where(InstagramAccount.id == row.account_id))
    return InstagramRegionRouteResponse(
        id=row.id,
        region_key=row.region_key,
        account_id=row.account_id,
        account_name=account.name if account else row.account_id,
        is_fallback=bool(row.is_fallback),
        created_at=row.created_at or utc_now(),
        updated_at=row.updated_at or utc_now(),
    )


def _publication_to_response(db: Session, row: InstagramPublication) -> InstagramPublicationResponse:
    account_name: Optional[str] = None
    if row.account_id:
        account = db.scalar(select(InstagramAccount).where(InstagramAccount.id == row.account_id))
        account_name = account.name if account else None
    return InstagramPublicationResponse(
        id=row.id,
        pet_id=row.pet_id,
        account_id=row.account_id,
        account_name=account_name,
        initiated_by=row.initiated_by,
        region_key=row.region_key,
        mode=row.mode,
        source=row.source or "auto",
        requested_by_user_id=row.requested_by_user_id,
        requested_at=row.requested_at,
        format=row.format,
        status=row.status,
        attempts=row.attempts or 0,
        last_error=row.last_error,
        external_media_id=row.external_media_id,
        idempotency_key=row.idempotency_key,
        payload=row.payload or {},
        created_at=row.created_at or utc_now(),
        updated_at=row.updated_at or utc_now(),
        published_at=row.published_at,
    )


def _boost_last_item(db: Session, user_id: str) -> InstagramPublication | None:
    cutoff = _as_utc_naive(utc_now()) - timedelta(days=BOOST_LIMIT_DAYS)
    return db.scalar(
        select(InstagramPublication)
        .where(
            InstagramPublication.source == "boost_user",
            InstagramPublication.requested_by_user_id == user_id,
            InstagramPublication.created_at >= cutoff,
            InstagramPublication.status.in_(("pending", "processing", "published")),
        )
        .order_by(InstagramPublication.created_at.desc())
        .limit(1)
    )


def _compute_boost_eligibility(
    *,
    db: Session,
    pet: Pet | None,
    user: User,
) -> tuple[bool, str, Optional[datetime], Optional[int]]:
    if not pet:
        return False, "pet_not_found", None, None
    if pet.author_id != user.id:
        return False, "not_owner", None, None
    if pet.moderation_status != "approved":
        return False, "not_approved", None, None
    if pet.is_archived or pet.status == "found":
        return False, "archived_or_found", None, None

    published_at = _as_utc_naive(pet.published_at)
    age_days = max(0, (_as_utc_naive(utc_now()) - published_at).days)
    if age_days < BOOST_MIN_AGE_DAYS:
        return False, "too_early", None, age_days

    region_key = normalize_region_key(pet.city)
    account = resolve_account_for_region(db, region_key)
    if not account or not (account.access_token or "").strip():
        return False, "route_missing", None, age_days

    last = _boost_last_item(db, user.id)
    if last and last.created_at:
        next_available = _as_utc_naive(last.created_at) + timedelta(days=BOOST_LIMIT_DAYS)
        return False, "limit_reached", next_available, age_days
    return True, "ok", None, age_days


@router.get("/accounts", response_model=list[InstagramAccountResponse])
def list_accounts(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    rows = db.scalars(select(InstagramAccount).order_by(InstagramAccount.created_at.desc())).all()
    return [_account_to_response(r) for r in rows]


@router.post("/accounts", response_model=InstagramAccountResponse, status_code=201)
def create_account(
    data: InstagramAccountCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    exists = db.scalar(
        select(InstagramAccount).where(
            InstagramAccount.instagram_business_id == data.instagram_business_id.strip()
        )
    )
    if exists:
        raise HTTPException(status_code=400, detail="Instagram account already exists")
    row = InstagramAccount(
        id=f"igacc-{uuid.uuid4().hex[:12]}",
        name=data.name.strip(),
        instagram_business_id=data.instagram_business_id.strip(),
        facebook_page_id=(data.facebook_page_id or "").strip() or None,
        access_token=encrypt_token(data.access_token),
        is_active=bool(data.is_active),
        created_at=utc_now(),
        updated_at=utc_now(),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _account_to_response(row)


@router.patch("/accounts/{account_id}", response_model=InstagramAccountResponse)
def update_account(
    account_id: str,
    data: InstagramAccountUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    row = db.scalar(select(InstagramAccount).where(InstagramAccount.id == account_id))
    if not row:
        raise HTTPException(status_code=404, detail="Instagram account not found")
    d = data.model_dump(exclude_unset=True)
    if "name" in d and d["name"] is not None:
        row.name = str(d["name"]).strip()
    if "instagram_business_id" in d and d["instagram_business_id"] is not None:
        row.instagram_business_id = str(d["instagram_business_id"]).strip()
    if "facebook_page_id" in d:
        row.facebook_page_id = (str(d["facebook_page_id"]).strip() if d["facebook_page_id"] else None)
    if "access_token" in d:
        row.access_token = encrypt_token(str(d["access_token"]) if d["access_token"] else None)
    if "is_active" in d and d["is_active"] is not None:
        row.is_active = bool(d["is_active"])
    row.updated_at = utc_now()
    db.commit()
    db.refresh(row)
    return _account_to_response(row)


@router.get("/routes", response_model=list[InstagramRegionRouteResponse])
def list_routes(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    rows = db.scalars(select(InstagramRegionRoute).order_by(InstagramRegionRoute.region_key.asc())).all()
    return [_route_to_response(db, r) for r in rows]


@router.post("/routes", response_model=InstagramRegionRouteResponse, status_code=201)
def create_route(
    data: InstagramRegionRouteCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    account = db.scalar(select(InstagramAccount).where(InstagramAccount.id == data.account_id))
    if not account:
        raise HTTPException(status_code=400, detail="Instagram account not found")
    region_key = normalize_region_key(data.region_key)
    exists = db.scalar(select(InstagramRegionRoute).where(InstagramRegionRoute.region_key == region_key))
    if exists:
        raise HTTPException(status_code=400, detail="Route for region already exists")

    row = InstagramRegionRoute(
        id=f"igroute-{uuid.uuid4().hex[:12]}",
        region_key=region_key,
        account_id=data.account_id,
        is_fallback=bool(data.is_fallback),
        created_at=utc_now(),
        updated_at=utc_now(),
    )
    db.add(row)
    if row.is_fallback:
        for other in db.scalars(
            select(InstagramRegionRoute).where(
                InstagramRegionRoute.id != row.id,
                InstagramRegionRoute.is_fallback.is_(True),
            )
        ).all():
            other.is_fallback = False
            other.updated_at = utc_now()
    db.commit()
    db.refresh(row)
    return _route_to_response(db, row)


@router.patch("/routes/{route_id}", response_model=InstagramRegionRouteResponse)
def update_route(
    route_id: str,
    data: InstagramRegionRouteUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    row = db.scalar(select(InstagramRegionRoute).where(InstagramRegionRoute.id == route_id))
    if not row:
        raise HTTPException(status_code=404, detail="Route not found")
    d = data.model_dump(exclude_unset=True)
    if "account_id" in d and d["account_id"] is not None:
        account = db.scalar(select(InstagramAccount).where(InstagramAccount.id == d["account_id"]))
        if not account:
            raise HTTPException(status_code=400, detail="Instagram account not found")
        row.account_id = d["account_id"]
    if "is_fallback" in d and d["is_fallback"] is not None:
        row.is_fallback = bool(d["is_fallback"])
        if row.is_fallback:
            for other in db.scalars(
                select(InstagramRegionRoute).where(
                    InstagramRegionRoute.id != row.id,
                    InstagramRegionRoute.is_fallback.is_(True),
                )
            ).all():
                other.is_fallback = False
                other.updated_at = utc_now()
    row.updated_at = utc_now()
    db.commit()
    db.refresh(row)
    return _route_to_response(db, row)


@router.delete("/routes/{route_id}", status_code=204)
def delete_route(
    route_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    row = db.scalar(select(InstagramRegionRoute).where(InstagramRegionRoute.id == route_id))
    if not row:
        raise HTTPException(status_code=404, detail="Route not found")
    db.delete(row)
    db.commit()
    return None


@router.get("/publications", response_model=list[InstagramPublicationResponse])
def list_publications(
    status: Optional[str] = Query(None),
    pet_id: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    stmt = select(InstagramPublication).order_by(InstagramPublication.created_at.desc())
    if status:
        stmt = stmt.where(InstagramPublication.status == status)
    if pet_id:
        stmt = stmt.where(InstagramPublication.pet_id == pet_id)
    stmt = stmt.offset(offset).limit(limit)
    rows = db.scalars(stmt).all()
    return [_publication_to_response(db, r) for r in rows]


@router.post("/publications/manual", response_model=list[InstagramPublicationResponse], status_code=201)
def create_manual_publication(
    data: InstagramPublicationCreateManual,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    if not is_autopublish_enabled(db):
        allow_manual = get_bool_setting(db, MANUAL_WHEN_AUTO_OFF_KEY, default=True)
        if not allow_manual:
            raise HTTPException(status_code=400, detail="Manual publish is disabled by settings")

    pet = db.scalar(select(Pet).where(Pet.id == data.pet_id))
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    if pet.moderation_status != "approved":
        raise HTTPException(status_code=400, detail="Only approved pet can be published")

    items = enqueue_manual_publications(
        db,
        pet=pet,
        formats=[data.format],
        initiated_by=admin.id,
    )
    return [_publication_to_response(db, r) for r in items]


@router.post("/publications/{publication_id}/retry", response_model=InstagramPublicationResponse)
def retry_publication(
    publication_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    row = db.scalar(select(InstagramPublication).where(InstagramPublication.id == publication_id))
    if not row:
        raise HTTPException(status_code=404, detail="Publication not found")
    if row.status == "published":
        return _publication_to_response(db, row)
    row.status = "pending"
    row.last_error = None
    row.updated_at = utc_now()
    db.commit()
    db.refresh(row)
    return _publication_to_response(db, row)


@router.post("/publications/{publication_id}/cancel", response_model=InstagramPublicationResponse)
def cancel_publication(
    publication_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    row = db.scalar(select(InstagramPublication).where(InstagramPublication.id == publication_id))
    if not row:
        raise HTTPException(status_code=404, detail="Publication not found")
    if row.status == "published":
        raise HTTPException(status_code=400, detail="Published item cannot be cancelled")
    row.status = "cancelled"
    row.updated_at = utc_now()
    db.commit()
    db.refresh(row)
    return _publication_to_response(db, row)


@router.post("/publications/{publication_id}/publish-now", response_model=InstagramPublicationResponse)
def publish_now(
    publication_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    row = db.scalar(select(InstagramPublication).where(InstagramPublication.id == publication_id))
    if not row:
        raise HTTPException(status_code=404, detail="Publication not found")
    if row.status == "cancelled":
        raise HTTPException(status_code=400, detail="Cancelled item cannot be published")
    if row.status != "published":
        process_publication_by_id(publication_id)
        db.expire_all()
        row = db.scalar(select(InstagramPublication).where(InstagramPublication.id == publication_id))
        if not row:
            raise HTTPException(status_code=404, detail="Publication not found")
    return _publication_to_response(db, row)


@router.get("/boosts/eligibility", response_model=InstagramBoostEligibilityResponse)
def boost_eligibility(
    pet_id: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_required),
):
    if not get_bool_setting(db, BOOST_FEATURE_FLAG_KEY, True):
        return InstagramBoostEligibilityResponse(
            eligible=False,
            reason="feature_disabled",
            next_available_at=None,
            pet_age_days=None,
        )
    pet = db.scalar(select(Pet).where(Pet.id == pet_id))
    eligible, reason, next_available, age_days = _compute_boost_eligibility(db=db, pet=pet, user=user)
    return InstagramBoostEligibilityResponse(
        eligible=eligible,
        reason=reason,
        next_available_at=next_available,
        pet_age_days=age_days,
    )


@router.post("/publications/boost", response_model=InstagramPublicationResponse, status_code=201)
def create_boost_publication(
    data: InstagramBoostCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_required),
):
    if not get_bool_setting(db, BOOST_FEATURE_FLAG_KEY, True):
        raise HTTPException(status_code=403, detail="Instagram Stories boost is disabled")
    pet = db.scalar(select(Pet).where(Pet.id == data.pet_id))
    eligible, reason, next_available, _ = _compute_boost_eligibility(db=db, pet=pet, user=user)
    if not eligible:
        if reason == "pet_not_found":
            raise HTTPException(status_code=404, detail="Pet not found")
        if reason == "not_owner":
            raise HTTPException(status_code=403, detail="Only pet owner can request boost")
        if reason == "limit_reached":
            raise HTTPException(status_code=429, detail=f"Boost limit reached until {next_available}")
        raise HTTPException(status_code=400, detail=reason)

    existing_for_pet = db.scalar(
        select(InstagramPublication).where(
            InstagramPublication.source == "boost_user",
            InstagramPublication.requested_by_user_id == user.id,
            InstagramPublication.pet_id == data.pet_id,
            InstagramPublication.status.in_(("pending", "processing")),
        )
    )
    if existing_for_pet:
        raise HTTPException(status_code=409, detail="Boost for this pet is already queued")

    item = enqueue_publication(
        db,
        pet=pet,
        mode="boost",
        fmt="story",
        initiated_by=None,
        force_new=True,
        source="boost_user",
        requested_by_user_id=user.id,
    )
    return _publication_to_response(db, item)
