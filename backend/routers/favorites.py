"""Избранные объявления пользователя."""
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import delete, func, or_, select
from sqlalchemy.orm import Session, selectinload

from auth import get_current_user_required
from database import get_db
from models import Pet, PetFavorite, User
from schemas import FavoriteIdsResponse, FavoriteImportBody, PaginatedPetListResponse, PetResponse
from routers.pets import pet_favoritable, pet_to_response

router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.get("/ids", response_model=FavoriteIdsResponse)
def list_favorite_ids(
    limit: int = Query(500, ge=1, le=500),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_required),
):
    rows = db.scalars(
        select(PetFavorite.pet_id)
        .where(PetFavorite.user_id == user.id)
        .order_by(PetFavorite.created_at.desc())
        .limit(limit)
    ).all()
    return FavoriteIdsResponse(ids=list(rows))


@router.get("", response_model=PaginatedPetListResponse)
def list_favorites(
    limit: int = Query(200, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_required),
):
    is_admin = user.role == "admin"
    base = (
        select(Pet)
        .join(PetFavorite, PetFavorite.pet_id == Pet.id)
        .where(PetFavorite.user_id == user.id)
    )
    if not is_admin:
        base = base.where(
            or_(
                Pet.moderation_status == "approved",
                Pet.author_id == user.id,
            )
        )
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    pets = db.scalars(
        base.options(selectinload(Pet.shelter_details))
        .order_by(PetFavorite.created_at.desc())
        .offset(offset)
        .limit(limit)
    ).all()
    return PaginatedPetListResponse(
        items=[pet_to_response(p) for p in pets],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post("/import", response_model=FavoriteIdsResponse)
def import_favorites(
    body: FavoriteImportBody,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_required),
):
    seen: set[str] = set()
    ordered: list[str] = []
    for pid in body.pet_ids:
        s = (pid or "").strip()
        if not s or s in seen:
            continue
        seen.add(s)
        ordered.append(s)
        if len(ordered) >= 150:
            break

    if not ordered:
        rows = db.scalars(
            select(PetFavorite.pet_id)
            .where(PetFavorite.user_id == user.id)
            .order_by(PetFavorite.created_at.desc())
        ).all()
        return FavoriteIdsResponse(ids=list(rows))

    existing_pet_ids = set(
        db.scalars(select(Pet.id).where(Pet.id.in_(ordered))).all()
    )
    candidate_ids = [pid for pid in ordered if pid in existing_pet_ids]
    if not candidate_ids:
        rows = db.scalars(
            select(PetFavorite.pet_id)
            .where(PetFavorite.user_id == user.id)
            .order_by(PetFavorite.created_at.desc())
        ).all()
        return FavoriteIdsResponse(ids=list(rows))

    already_fav = set(
        db.scalars(
            select(PetFavorite.pet_id).where(
                PetFavorite.user_id == user.id,
                PetFavorite.pet_id.in_(candidate_ids),
            )
        ).all()
    )
    for pet_id in candidate_ids:
        if pet_id in already_fav:
            continue
        db.add(
            PetFavorite(
                id=str(uuid.uuid4()),
                user_id=user.id,
                pet_id=pet_id,
            )
        )
    db.commit()

    rows = db.scalars(
        select(PetFavorite.pet_id)
        .where(PetFavorite.user_id == user.id)
        .order_by(PetFavorite.created_at.desc())
    ).all()
    return FavoriteIdsResponse(ids=list(rows))


def _upsert_favorite(pet_id: str, db: Session, user: User) -> dict:
    pet = db.scalar(select(Pet).where(Pet.id == pet_id))
    if not pet:
        raise HTTPException(status_code=404, detail="Объявление не найдено")
    if not pet_favoritable(pet, user):
        raise HTTPException(status_code=404, detail="Объявление не найдено")
    existing = db.scalar(
        select(PetFavorite).where(
            PetFavorite.user_id == user.id,
            PetFavorite.pet_id == pet_id,
        )
    )
    if existing:
        return {"ok": True, "already": True}
    db.add(
        PetFavorite(
            id=str(uuid.uuid4()),
            user_id=user.id,
            pet_id=pet_id,
        )
    )
    db.commit()
    return {"ok": True, "already": False}


@router.post("/{pet_id}", status_code=201)
def add_favorite(
    pet_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_required),
):
    return _upsert_favorite(pet_id, db, user)


@router.put("/{pet_id}")
def put_favorite(
    pet_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_required),
):
    return _upsert_favorite(pet_id, db, user)


@router.delete("/{pet_id}", status_code=204)
def remove_favorite(
    pet_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user_required),
):
    db.execute(
        delete(PetFavorite).where(
            PetFavorite.user_id == user.id,
            PetFavorite.pet_id == pet_id,
        )
    )
    db.commit()
    return None
