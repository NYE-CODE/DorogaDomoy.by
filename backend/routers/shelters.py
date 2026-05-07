"""Приюты и точки помощи: владелец — пользователь с ролью shelter; модерация админом."""
from __future__ import annotations

import logging
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from auth import get_current_user, get_current_user_required, require_admin, require_shelter_or_admin
from database import get_db
from models import Pet, Report, Shelter, ShelterMembership, User
from schemas import (
    ShelterCreate,
    ShelterMemberInviteBody,
    ShelterMemberResponse,
    ShelterMemberUpdateBody,
    ShelterModerateBody,
    ShelterResponse,
    ShelterUpdate,
)
from time_utils import utc_now


router = APIRouter(prefix="/shelters", tags=["shelters"])


def _contacts_dict(c) -> dict:
    if c is None:
        return {}
    if hasattr(c, "model_dump"):
        d = c.model_dump()
    elif isinstance(c, dict):
        d = c
    else:
        return {}
    return {k: v for k, v in d.items() if v is not None and str(v).strip() != ""}


def _to_response(s: Shelter) -> ShelterResponse:
    focus = getattr(s, "animal_focus", None) or "mixed"
    if focus not in ("dogs", "cats", "mixed"):
        focus = "mixed"
    return ShelterResponse(
        id=s.id,
        name=s.name,
        kind=s.kind,
        animal_focus=focus,
        description=s.description,
        city=s.city,
        address=s.address,
        location_lat=s.location_lat,
        location_lng=s.location_lng,
        contacts=dict(s.contacts or {}),
        logo_url=s.logo_url,
        cover_url=getattr(s, "cover_url", None),
        moderation_status=s.moderation_status,
        moderation_reason=s.moderation_reason,
        moderated_at=s.moderated_at,
        moderated_by=s.moderated_by,
        owner_user_id=s.owner_user_id,
        created_at=s.created_at,
        updated_at=s.updated_at,
    )


def _can_view(user: Optional[User], s: Shelter) -> bool:
    if s.moderation_status == "approved":
        return True
    if user is None:
        return False
    if user.role == "admin":
        return True
    return s.owner_user_id == user.id


def _assert_owner_or_admin(user: User, s: Shelter) -> None:
    if user.role == "admin":
        return
    if s.owner_user_id == user.id:
        return
    raise HTTPException(status_code=403, detail="Нет доступа к этой организации")


def _membership_to_response(m: ShelterMembership, u: Optional[User]) -> ShelterMemberResponse:
    return ShelterMemberResponse(
        id=m.id,
        shelter_id=m.shelter_id,
        user_id=m.user_id,
        role=m.role,
        status=m.status,
        invited_by_user_id=m.invited_by_user_id,
        joined_at=m.joined_at,
        removed_at=m.removed_at,
        created_at=m.created_at,
        updated_at=m.updated_at,
        user_name=u.name if u else None,
        user_email=u.email if u else None,
        user_avatar=u.avatar if u else None,
    )


def _active_membership(db: Session, shelter_id: str, user_id: str) -> Optional[ShelterMembership]:
    return db.scalar(
        select(ShelterMembership).where(
            ShelterMembership.shelter_id == shelter_id,
            ShelterMembership.user_id == user_id,
            ShelterMembership.status == "active",
        )
    )


def _invited_or_active_membership(
    db: Session, shelter_id: str, user_id: str
) -> Optional[ShelterMembership]:
    return db.scalar(
        select(ShelterMembership).where(
            ShelterMembership.shelter_id == shelter_id,
            ShelterMembership.user_id == user_id,
            ShelterMembership.status.in_(("invited", "active")),
        )
    )


def _assert_member_manage_access(db: Session, user: User, s: Shelter) -> None:
    if user.role == "admin" or s.owner_user_id == user.id:
        return
    m = _active_membership(db, s.id, user.id)
    if m and m.role in {"owner", "manager"}:
        return
    raise HTTPException(status_code=403, detail="Нет прав на управление командой приюта")


def _assert_member_view_access(db: Session, user: User, s: Shelter) -> None:
    if user.role == "admin" or s.owner_user_id == user.id:
        return
    if _invited_or_active_membership(db, s.id, user.id):
        return
    raise HTTPException(status_code=403, detail="Нет доступа к команде приюта")


@router.get("", response_model=list[ShelterResponse])
def list_public_shelters(
    city: Optional[str] = Query(None, description="Фильтр по городу (подстрока, без учёта регистра)"),
    db: Session = Depends(get_db),
):
    stmt = select(Shelter).where(Shelter.moderation_status == "approved")
    if city and city.strip():
        key = f"%{city.strip()}%"
        stmt = stmt.where(Shelter.city.ilike(key))
    stmt = stmt.order_by(Shelter.name.asc())
    rows = db.scalars(stmt).all()
    return [_to_response(s) for s in rows]


@router.get("/me", response_model=list[ShelterResponse])
def list_my_shelters(
    user: User = Depends(require_shelter_or_admin),
    db: Session = Depends(get_db),
):
    stmt = select(Shelter).where(Shelter.owner_user_id == user.id).order_by(Shelter.updated_at.desc())
    return [_to_response(s) for s in db.scalars(stmt).all()]


@router.get("/admin/pending", response_model=list[ShelterResponse])
def admin_list_pending(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    stmt = (
        select(Shelter)
        .where(Shelter.moderation_status == "pending")
        .order_by(Shelter.updated_at.asc())
    )
    return [_to_response(s) for s in db.scalars(stmt).all()]


@router.get("/admin/all", response_model=list[ShelterResponse])
def admin_list_all_shelters(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Все карточки организаций (любой статус модерации) — для админ-вкладки «Приюты»."""
    stmt = select(Shelter).order_by(Shelter.updated_at.desc())
    return [_to_response(s) for s in db.scalars(stmt).all()]


@router.delete("/admin/{shelter_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_shelter(
    shelter_id: str,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Удаление карточки организации: сначала питомцы приюта (как при удалении объявления), затем приют.

    Иначе при ``ON DELETE SET NULL`` у ``pets.shelter_id`` остаются «приютские» объявления без приюта.
    Подписки, членство и сборы по приюту удаляются каскадом при удалении строки ``shelters``.
    """
    s = db.scalar(select(Shelter).where(Shelter.id == shelter_id))
    if not s:
        raise HTTPException(status_code=404, detail="Не найдено")
    try:
        pets = db.scalars(select(Pet).where(Pet.shelter_id == shelter_id)).all()
        for pet in pets:
            db.execute(delete(Report).where(Report.pet_id == pet.id))
            db.delete(pet)
        db.delete(s)
        db.commit()
    except Exception as e:
        db.rollback()
        logging.exception("Ошибка при удалении приюта %s: %s", shelter_id, e)
        raise HTTPException(
            status_code=500,
            detail="Не удалось удалить организацию. Попробуйте позже.",
        ) from e
    return None


@router.get("/{shelter_id}", response_model=ShelterResponse)
def get_shelter(
    shelter_id: str,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user),
):
    s = db.scalar(select(Shelter).where(Shelter.id == shelter_id))
    if not s:
        raise HTTPException(status_code=404, detail="Не найдено")
    if _can_view(user, s):
        return _to_response(s)
    if user is not None and _invited_or_active_membership(db, s.id, user.id):
        return _to_response(s)
    raise HTTPException(status_code=404, detail="Не найдено")


@router.post("", response_model=ShelterResponse, status_code=status.HTTP_201_CREATED)
def create_shelter(
    data: ShelterCreate,
    user: User = Depends(require_shelter_or_admin),
    db: Session = Depends(get_db),
):
    owner_id = user.id
    if data.owner_user_id is not None:
        if user.role != "admin":
            raise HTTPException(status_code=403, detail="Только админ может указать owner_user_id")
        target = db.scalar(select(User).where(User.id == data.owner_user_id))
        if not target:
            raise HTTPException(status_code=400, detail="Пользователь не найден")
        if target.role != "shelter":
            raise HTTPException(status_code=400, detail="Владелец карточки должен иметь роль shelter")
        owner_id = target.id

    sid = str(uuid.uuid4())
    now = utc_now()
    row = Shelter(
        id=sid,
        name=data.name.strip(),
        kind=data.kind,
        animal_focus=data.animal_focus,
        description=data.description,
        city=data.city.strip(),
        address=data.address.strip() if data.address else None,
        location_lat=data.location_lat,
        location_lng=data.location_lng,
        contacts=_contacts_dict(data.contacts),
        logo_url=data.logo_url,
        cover_url=data.cover_url,
        moderation_status="draft",
        owner_user_id=owner_id,
        created_at=now,
        updated_at=now,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    owner_membership = ShelterMembership(
        id=f"shm-{uuid.uuid4().hex[:10]}",
        shelter_id=row.id,
        user_id=owner_id,
        role="owner",
        status="active",
        invited_by_user_id=user.id,
        joined_at=now,
        created_at=now,
        updated_at=now,
    )
    db.add(owner_membership)
    db.commit()
    return _to_response(row)


@router.patch("/{shelter_id}", response_model=ShelterResponse)
def update_shelter(
    shelter_id: str,
    data: ShelterUpdate,
    user: User = Depends(require_shelter_or_admin),
    db: Session = Depends(get_db),
):
    s = db.scalar(select(Shelter).where(Shelter.id == shelter_id))
    if not s:
        raise HTTPException(status_code=404, detail="Не найдено")
    _assert_owner_or_admin(user, s)

    d = data.model_dump(exclude_unset=True)
    if "contacts" in d and d["contacts"] is not None:
        s.contacts = _contacts_dict(d.pop("contacts"))

    if "cover_url" in d:
        cv = d.pop("cover_url")
        s.cover_url = str(cv).strip() if cv and str(cv).strip() else None

    for key in ("kind", "animal_focus", "description", "location_lat", "location_lng", "logo_url"):
        if key in d and d[key] is not None:
            setattr(s, key, d[key])
    if "name" in d and d["name"] is not None:
        s.name = str(d["name"]).strip()
    if "city" in d and d["city"] is not None:
        s.city = str(d["city"]).strip()
    if "address" in d:
        s.address = str(d["address"]).strip() if d["address"] else None

    # После правок владельца вне approved — остаёмся в draft/rejected; в approved мелкие правки без сброса
    if s.moderation_status == "approved" and user.role != "admin":
        allowed = {
            "description",
            "address",
            "contacts",
            "logo_url",
            "cover_url",
            "location_lat",
            "location_lng",
            "animal_focus",
        }
        sent = set(data.model_dump(exclude_unset=True).keys())
        if sent - allowed:
            raise HTTPException(
                status_code=400,
                detail="В опубликованной карточке можно менять только описание, адрес, контакты, логотип, шапку страницы, координаты и «для кого помощь»",
            )

    if s.moderation_status in ("draft", "rejected") and user.role != "admin":
        # любое редактирование черновика владельцем — остаётся draft/rejected до submit
        pass

    s.updated_at = utc_now()
    db.commit()
    db.refresh(s)
    return _to_response(s)


@router.post("/{shelter_id}/submit", response_model=ShelterResponse)
def submit_shelter(
    shelter_id: str,
    user: User = Depends(require_shelter_or_admin),
    db: Session = Depends(get_db),
):
    s = db.scalar(select(Shelter).where(Shelter.id == shelter_id))
    if not s:
        raise HTTPException(status_code=404, detail="Не найдено")
    _assert_owner_or_admin(user, s)
    if s.moderation_status == "approved":
        raise HTTPException(status_code=400, detail="Уже опубликовано")
    if s.moderation_status == "hidden":
        raise HTTPException(status_code=400, detail="Карточка скрыта администратором")
    if s.moderation_status == "pending":
        raise HTTPException(status_code=400, detail="Уже на модерации")

    s.moderation_status = "pending"
    s.moderation_reason = None
    s.updated_at = utc_now()
    db.commit()
    db.refresh(s)
    return _to_response(s)


@router.post("/{shelter_id}/moderate", response_model=ShelterResponse)
def moderate_shelter(
    shelter_id: str,
    body: ShelterModerateBody,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    s = db.scalar(select(Shelter).where(Shelter.id == shelter_id))
    if not s:
        raise HTTPException(status_code=404, detail="Не найдено")

    now = utc_now()
    if body.action == "approve":
        s.moderation_status = "approved"
        s.moderation_reason = None
        s.moderated_at = now
        s.moderated_by = admin.id
    elif body.action == "reject":
        s.moderation_status = "rejected"
        s.moderation_reason = (body.reason or "").strip() or None
        s.moderated_at = now
        s.moderated_by = admin.id
    else:  # hide
        s.moderation_status = "hidden"
        s.moderation_reason = (body.reason or "").strip() or None
        s.moderated_at = now
        s.moderated_by = admin.id

    s.updated_at = now
    db.commit()
    db.refresh(s)
    return _to_response(s)


@router.get("/{shelter_id}/members", response_model=list[ShelterMemberResponse])
def list_shelter_members(
    shelter_id: str,
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    s = db.scalar(select(Shelter).where(Shelter.id == shelter_id))
    if not s:
        raise HTTPException(status_code=404, detail="Не найдено")
    _assert_member_view_access(db, user, s)

    members = db.scalars(
        select(ShelterMembership)
        .where(ShelterMembership.shelter_id == shelter_id)
        .order_by(ShelterMembership.created_at.asc())
    ).all()
    users = db.scalars(select(User).where(User.id.in_([m.user_id for m in members]))).all() if members else []
    by_id = {u.id: u for u in users}
    return [_membership_to_response(m, by_id.get(m.user_id)) for m in members]


@router.post("/{shelter_id}/members/invite", response_model=ShelterMemberResponse, status_code=status.HTTP_201_CREATED)
def invite_shelter_member(
    shelter_id: str,
    body: ShelterMemberInviteBody,
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    s = db.scalar(select(Shelter).where(Shelter.id == shelter_id))
    if not s:
        raise HTTPException(status_code=404, detail="Не найдено")
    _assert_member_manage_access(db, user, s)

    target: Optional[User] = None
    if body.user_id:
        target = db.scalar(select(User).where(User.id == body.user_id.strip()))
    elif body.email:
        target = db.scalar(select(User).where(User.email == body.email.strip().lower()))
    else:
        raise HTTPException(status_code=400, detail="Нужно указать user_id или email")
    if not target:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    if target.id == s.owner_user_id:
        raise HTTPException(status_code=400, detail="Владелец уже состоит в команде")

    now = utc_now()
    m = db.scalar(
        select(ShelterMembership).where(
            ShelterMembership.shelter_id == shelter_id,
            ShelterMembership.user_id == target.id,
        )
    )
    if m:
        if m.status in {"invited", "active"}:
            raise HTTPException(status_code=400, detail="Пользователь уже приглашён в команду")
        m.role = body.role
        m.status = "invited"
        m.invited_by_user_id = user.id
        m.removed_at = None
        m.updated_at = now
    else:
        m = ShelterMembership(
            id=f"shm-{uuid.uuid4().hex[:10]}",
            shelter_id=shelter_id,
            user_id=target.id,
            role=body.role,
            status="invited",
            invited_by_user_id=user.id,
            created_at=now,
            updated_at=now,
        )
        db.add(m)
    db.commit()
    db.refresh(m)
    return _membership_to_response(m, target)


@router.post("/{shelter_id}/members/{membership_id}/accept", response_model=ShelterMemberResponse)
def accept_shelter_member_invite(
    shelter_id: str,
    membership_id: str,
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    m = db.scalar(
        select(ShelterMembership).where(
            ShelterMembership.id == membership_id,
            ShelterMembership.shelter_id == shelter_id,
        )
    )
    if not m:
        raise HTTPException(status_code=404, detail="Приглашение не найдено")
    if m.user_id != user.id:
        raise HTTPException(status_code=403, detail="Это приглашение не принадлежит вам")
    if m.status != "invited":
        raise HTTPException(status_code=400, detail="Приглашение уже неактуально")
    now = utc_now()
    m.status = "active"
    m.joined_at = now
    m.updated_at = now
    db.commit()
    db.refresh(m)
    return _membership_to_response(m, user)


@router.patch("/{shelter_id}/members/{membership_id}", response_model=ShelterMemberResponse)
def update_shelter_member(
    shelter_id: str,
    membership_id: str,
    body: ShelterMemberUpdateBody,
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    s = db.scalar(select(Shelter).where(Shelter.id == shelter_id))
    if not s:
        raise HTTPException(status_code=404, detail="Не найдено")
    _assert_member_manage_access(db, user, s)
    m = db.scalar(
        select(ShelterMembership).where(
            ShelterMembership.id == membership_id,
            ShelterMembership.shelter_id == shelter_id,
        )
    )
    if not m:
        raise HTTPException(status_code=404, detail="Участник не найден")
    d = body.model_dump(exclude_unset=True)
    if not d:
        raise HTTPException(status_code=400, detail="Нет изменений")
    if m.role == "owner" and ("role" in d or d.get("status") == "removed"):
        raise HTTPException(status_code=400, detail="Нельзя изменить или удалить владельца")
    if "role" in d:
        m.role = d["role"]
    if "status" in d:
        m.status = d["status"]
        if d["status"] == "removed":
            m.removed_at = utc_now()
    m.updated_at = utc_now()
    db.commit()
    db.refresh(m)
    target = db.scalar(select(User).where(User.id == m.user_id))
    return _membership_to_response(m, target)


@router.delete("/{shelter_id}/members/{membership_id}", response_model=ShelterMemberResponse)
def remove_shelter_member(
    shelter_id: str,
    membership_id: str,
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    s = db.scalar(select(Shelter).where(Shelter.id == shelter_id))
    if not s:
        raise HTTPException(status_code=404, detail="Не найдено")
    _assert_member_manage_access(db, user, s)
    m = db.scalar(
        select(ShelterMembership).where(
            ShelterMembership.id == membership_id,
            ShelterMembership.shelter_id == shelter_id,
        )
    )
    if not m:
        raise HTTPException(status_code=404, detail="Участник не найден")
    if m.role == "owner":
        raise HTTPException(status_code=400, detail="Нельзя удалить владельца")
    m.status = "removed"
    now = utc_now()
    m.removed_at = now
    m.updated_at = now
    db.commit()
    db.refresh(m)
    target = db.scalar(select(User).where(User.id == m.user_id))
    return _membership_to_response(m, target)
