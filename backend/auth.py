"""JWT and password hashing."""
from datetime import timedelta
from typing import Optional
import os

import bcrypt
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, Request, Response, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import User
from time_utils import utc_now

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError(
        "SECRET_KEY must be set. Copy backend/.env.example to backend/.env "
        "and set SECRET_KEY to a long random string."
    )

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days
AUTH_COOKIE_NAME = os.getenv("AUTH_COOKIE_NAME", "dorogadomoy_session")
AUTH_COOKIE_DOMAIN = os.getenv("AUTH_COOKIE_DOMAIN") or None
AUTH_COOKIE_SAMESITE = os.getenv("AUTH_COOKIE_SAMESITE", "lax").lower()
if AUTH_COOKIE_SAMESITE not in {"lax", "strict", "none"}:
    raise RuntimeError("AUTH_COOKIE_SAMESITE must be one of: lax, strict, none")
AUTH_COOKIE_SECURE = (
    os.getenv("AUTH_COOKIE_SECURE", "false").lower() in {"1", "true", "yes", "on"}
    or AUTH_COOKIE_SAMESITE == "none"
)

security = HTTPBearer(auto_error=False)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8") if isinstance(hashed_password, str) else hashed_password,
    )


def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = utc_now() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


def set_auth_cookie(response: Response, token: str) -> None:
    max_age = ACCESS_TOKEN_EXPIRE_MINUTES * 60
    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=token,
        max_age=max_age,
        expires=max_age,
        httponly=True,
        secure=AUTH_COOKIE_SECURE,
        samesite=AUTH_COOKIE_SAMESITE,
        path="/",
        domain=AUTH_COOKIE_DOMAIN,
    )


def clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(
        key=AUTH_COOKIE_NAME,
        path="/",
        domain=AUTH_COOKIE_DOMAIN,
        secure=AUTH_COOKIE_SECURE,
        samesite=AUTH_COOKIE_SAMESITE,
        httponly=True,
    )


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> Optional[User]:
    token = None
    if credentials and credentials.credentials:
        token = credentials.credentials
    elif request.cookies:
        token = request.cookies.get(AUTH_COOKIE_NAME)

    if not token:
        return None
    payload = decode_token(token)
    if not payload or "sub" not in payload:
        return None
    user_id = payload["sub"]
    user = db.scalar(select(User).where(User.id == user_id))
    if not user or user.is_blocked:
        return None
    return user


async def get_current_user_required(
    user: Optional[User] = Depends(get_current_user),
) -> User:
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Необходима авторизация",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_admin(user: User = Depends(get_current_user_required)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещён")
    return user
