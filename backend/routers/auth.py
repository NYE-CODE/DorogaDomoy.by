"""Auth routes: login, register, me, change-password, avatar."""
import io
import logging
import uuid
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, File, HTTPException, Body, Response, UploadFile
from PIL import Image
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import User
from schemas import UserCreate, UserLogin, UserResponse, Token
from auth import (
    clear_auth_cookie,
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user_required,
    set_auth_cookie,
)
from utils import user_to_response

router = APIRouter(prefix="/auth", tags=["auth"])

UPLOADS_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)
MIME_TO_EXT = {"image/jpeg": ".jpg", "image/png": ".png", "image/gif": ".gif", "image/webp": ".webp"}
MAX_AVATAR_BYTES = 5 * 1024 * 1024  # 5 MB
AVATAR_SIZE = 256


@router.post("/register", response_model=Token)
def register(
    data: UserCreate,
    response: Response,
    db: Session = Depends(get_db),
):
    existing = db.scalar(select(User).where(User.email == data.email))
    if existing:
        raise HTTPException(status_code=400, detail="Email уже зарегистрирован")
    user_id = "user-" + str(int(__import__("time").time() * 1000))
    user = User(
        id=user_id,
        email=data.email,
        name=data.name,
        password_hash=get_password_hash(data.password),
        avatar=f"https://api.dicebear.com/7.x/avataaars/svg?seed={data.name}",
        role="user",
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
    set_auth_cookie(response, token)
    return Token(access_token=token, user=user_to_response(user))


@router.post("/login", response_model=Token)
def login(
    data: UserLogin,
    response: Response,
    db: Session = Depends(get_db),
):
    user = db.scalar(select(User).where(User.email == data.email))
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")
    if user.is_blocked:
        raise HTTPException(status_code=403, detail="Аккаунт заблокирован")
    token = create_access_token(data={"sub": user.id})
    set_auth_cookie(response, token)
    return Token(access_token=token, user=user_to_response(user))


@router.post("/logout", status_code=204)
def logout(response: Response):
    clear_auth_cookie(response)
    return response


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user_required)):
    return user_to_response(user)


class UpdateProfileBody(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    contacts: Optional[dict] = None
    avatar: Optional[str] = None


class ChangePasswordBody(BaseModel):
    current_password: str
    new_password: str


@router.post("/change-password")
def change_password(
    body: ChangePasswordBody,
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    """Смена пароля. Требует текущий пароль."""
    if not verify_password(body.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Неверный текущий пароль")
    if len(body.new_password) < 6:
        raise HTTPException(status_code=400, detail="Новый пароль должен быть не менее 6 символов")
    user.password_hash = get_password_hash(body.new_password)
    try:
        db.commit()
        db.refresh(user)
    except Exception as e:
        db.rollback()
        logging.exception("Ошибка смены пароля %s: %s", user.id, e)
        raise HTTPException(status_code=500, detail="Не удалось сменить пароль") from e
    return {"detail": "Пароль успешно изменён"}


@router.post("/avatar-upload", response_model=dict)
def upload_avatar(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    """Загрузка аватара пользователя. Принимает image/jpeg, image/png, image/webp. Ресайз до 256×256."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Поддерживаются только изображения: JPEG, PNG, WebP")
    raw = file.file.read()
    if len(raw) > MAX_AVATAR_BYTES:
        raise HTTPException(status_code=400, detail="Файл слишком большой (макс. 5 МБ)")
    try:
        img = Image.open(io.BytesIO(raw))
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGBA")
            background = Image.new("RGB", img.size, (255, 255, 255))
            background.paste(img, mask=img.split()[3] if img.mode == "RGBA" else None)
            img = background
        else:
            img = img.convert("RGB")
        w, h = img.size
        size = min(w, h)
        left = (w - size) // 2
        top = (h - size) // 2
        img = img.crop((left, top, left + size, top + size))
        img = img.resize((AVATAR_SIZE, AVATAR_SIZE), Image.Resampling.LANCZOS)
        filename = f"avatar-{user.id}-{uuid.uuid4().hex[:8]}.jpg"
        filepath = UPLOADS_DIR / filename
        img.save(filepath, "JPEG", quality=85, optimize=True)
    except Exception as e:
        logging.exception("Ошибка обработки изображения: %s", e)
        raise HTTPException(status_code=400, detail="Некорректное изображение") from e
    avatar_url = f"/uploads/{filename}"
    user.avatar = avatar_url
    try:
        db.commit()
        db.refresh(user)
    except Exception as e:
        db.rollback()
        if filepath.exists():
            filepath.unlink()
        logging.exception("Ошибка сохранения аватара %s: %s", user.id, e)
        raise HTTPException(status_code=500, detail="Не удалось сохранить аватар") from e
    return {"avatar": avatar_url}


@router.patch("/me", response_model=UserResponse)
def update_me(
    body: UpdateProfileBody = Body(default=UpdateProfileBody()),
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    if body.name is not None:
        user.name = body.name
        # Обновляем dicebear только если нет своего аватара
        if body.avatar is None and (not user.avatar or "dicebear" in (user.avatar or "")):
            user.avatar = f"https://api.dicebear.com/7.x/avataaars/svg?seed={body.name}"
    if body.avatar is not None:
        user.avatar = body.avatar
    if body.email is not None and body.email != user.email:
        existing = db.scalar(select(User).where(User.email == body.email, User.id != user.id))
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
