"""Users API (admin + profile)."""
import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from database import get_db
from models import User, Pet, Notification, NotificationSettings
from schemas import UserResponse, UserUpdate
from auth import get_current_user, require_admin
from mappers.user import user_to_response

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserResponse])
def list_users(
    search: str | None = Query(None),
    role: str | None = Query(None),
    is_blocked: bool | None = Query(None),
    limit: int | None = Query(None, ge=1, le=2000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    stmt = select(User)
    if search:
        stmt = stmt.where(
            (User.name.ilike(f"%{search}%")) | (User.email.ilike(f"%{search}%"))
        )
    if role:
        stmt = stmt.where(User.role == role)
    if is_blocked is not None:
        stmt = stmt.where(User.is_blocked == is_blocked)
    if limit is not None:
        stmt = stmt.offset(offset).limit(limit)
    users = db.scalars(stmt).all()
    return [user_to_response(u) for u in users]


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current: User | None = Depends(get_current_user),
):
    user = db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    include_private = current is not None and (current.id == user_id or current.role == "admin")
    return user_to_response(
        user,
        include_block_status=include_private,
        include_telegram=include_private,
    )


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: str,
    data: UserUpdate,
    db: Session = Depends(get_db),
    current: User = Depends(require_admin),
):
    user = db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    # Admin cannot demote themselves — prevents losing access to admin panel
    if current.id == user_id and current.role == "admin" and "role" in data.model_dump(exclude_unset=True):
        new_role = data.role
        if new_role and new_role != "admin":
            raise HTTPException(status_code=400, detail="Администратор не может изменить свою роль")
    ALLOWED_FIELDS = {"name", "email", "role", "is_blocked", "blocked_reason", "contacts"}
    d = data.model_dump(exclude_unset=True)
    d = {k: v for k, v in d.items() if k in ALLOWED_FIELDS}
    if "contacts" in d and d["contacts"] is not None:
        if hasattr(d["contacts"], "model_dump"):
            d["contacts"] = d["contacts"].model_dump()
        elif not isinstance(d["contacts"], dict):
            d["contacts"] = dict(d["contacts"])
    for k, v in d.items():
        setattr(user, k, v)
    try:
        db.commit()
        db.refresh(user)
    except Exception as e:
        db.rollback()
        logging.exception("Ошибка при обновлении пользователя %s: %s", user_id, e)
        raise HTTPException(
            status_code=500,
            detail="Не удалось обновить пользователя. Попробуйте позже.",
        ) from e
    return user_to_response(user)


@router.delete("/{user_id}", status_code=204)
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current: User = Depends(require_admin),
):
    if current.id == user_id:
        raise HTTPException(status_code=400, detail="Нельзя удалить самого себя")
    user = db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    try:
        db.execute(delete(Notification).where(Notification.user_id == user_id))
        db.execute(delete(NotificationSettings).where(NotificationSettings.user_id == user_id))
        from models import TelegramLinkCode, Report
        db.execute(delete(Report).where(Report.reporter_id == user_id))
        db.execute(delete(TelegramLinkCode).where(TelegramLinkCode.user_id == user_id))
        db.execute(delete(Pet).where(Pet.author_id == user_id))
        db.delete(user)
        db.commit()
    except Exception as e:
        db.rollback()
        logging.exception("Ошибка при удалении пользователя %s: %s", user_id, e)
        raise HTTPException(
            status_code=500,
            detail="Не удалось удалить пользователя. Попробуйте позже.",
        ) from e
