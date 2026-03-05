"""Users API (admin + profile)."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from models import User
from schemas import UserResponse, UserUpdate
from auth import get_current_user_required, require_admin

router = APIRouter(prefix="/users", tags=["users"])


def user_to_response(u: User) -> UserResponse:
    return UserResponse(
        id=u.id,
        email=u.email,
        name=u.name,
        avatar=u.avatar,
        role=u.role,
        contacts=u.contacts or {},
        is_blocked=u.is_blocked,
        blocked_reason=u.blocked_reason,
    )


@router.get("", response_model=list[UserResponse])
def list_users(
    search: str | None = Query(None),
    role: str | None = Query(None),
    is_blocked: bool | None = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    q = db.query(User)
    if search:
        q = q.filter(
            (User.name.ilike(f"%{search}%")) | (User.email.ilike(f"%{search}%"))
        )
    if role:
        q = q.filter(User.role == role)
    if is_blocked is not None:
        q = q.filter(User.is_blocked == is_blocked)
    users = q.all()
    return [user_to_response(u) for u in users]


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user_required),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user_to_response(user)


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: str,
    data: UserUpdate,
    db: Session = Depends(get_db),
    current: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    d = data.model_dump(exclude_unset=True)
    for k, v in d.items():
        if hasattr(user, k):
            setattr(user, k, v)
    db.commit()
    db.refresh(user)
    return user_to_response(user)
