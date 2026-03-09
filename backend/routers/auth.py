"""Auth routes: login, register, me."""
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import User
from schemas import UserCreate, UserLogin, UserResponse, Token
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user_required,
)
from utils import user_to_response

router = APIRouter(prefix="/auth", tags=["auth"])


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
    try:
        db.add(user)
        db.commit()
        db.refresh(user)
    except Exception as e:
        db.rollback()
        logging.exception("Ошибка при регистрации пользователя: %s", e)
        raise HTTPException(status_code=500, detail=f"Не удалось зарегистрироваться: {type(e).__name__}") from e
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
    if body.email is not None and body.email != user.email:
        existing = db.query(User).filter(User.email == body.email, User.id != user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Этот email уже используется")
        user.email = body.email
    if body.contacts is not None:
        user.contacts = {**(user.contacts or {}), **body.contacts}
    try:
        db.commit()
        db.refresh(user)
    except Exception as e:
        db.rollback()
        logging.exception("Ошибка при обновлении профиля %s: %s", user.id, e)
        raise HTTPException(status_code=500, detail=f"Не удалось обновить профиль: {type(e).__name__}") from e
    return user_to_response(user)
