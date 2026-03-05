"""Auth routes: login, register, me."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import User
from schemas import UserCreate, UserLogin, UserResponse, Token, UserContacts
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user_required,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def user_to_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        avatar=user.avatar,
        role=user.role,
        contacts=user.contacts or {},
        is_blocked=user.is_blocked,
        blocked_reason=user.blocked_reason,
    )


@router.post("/register", response_model=Token)
def register(data: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email уже зарегистрирован")
    user_id = "user-" + str(int(__import__("time").time() * 1000))
    is_admin = data.email == "admin@dorogadomoy.by"
    user = User(
        id=user_id,
        email=data.email,
        name=data.name,
        password_hash=get_password_hash(data.password),
        avatar=f"https://api.dicebear.com/7.x/avataaars/svg?seed={data.name}",
        role="admin" if is_admin else data.role,
        contacts=data.contacts.model_dump() if hasattr(data, 'contacts') and data.contacts else {},
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(data={"sub": user.id})
    return Token(access_token=token, user=user_to_response(user))


@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")
    if user.is_blocked:
        raise HTTPException(status_code=403, detail="Аккаунт заблокирован")
    token = create_access_token(data={"sub": user.id})
    return Token(access_token=token, user=user_to_response(user))


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user_required)):
    return user_to_response(user)


class UpdateProfileBody(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    contacts: Optional[dict] = None


@router.patch("/me", response_model=UserResponse)
def update_me(
    body: UpdateProfileBody = Body(default=UpdateProfileBody()),
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    if body.name is not None:
        user.name = body.name
        user.avatar = f"https://api.dicebear.com/7.x/avataaars/svg?seed={body.name}"
    if body.email is not None:
        user.email = body.email
    if body.contacts is not None:
        user.contacts = {**(user.contacts or {}), **body.contacts}
    db.commit()
    db.refresh(user)
    return user_to_response(user)
