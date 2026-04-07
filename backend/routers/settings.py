"""Platform settings API."""
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import PlatformSettings, User
from auth import require_admin, get_current_user
from platform_settings import PLATFORM_SETTINGS_DEFAULTS, get_settings_with_defaults
from ttl_cache import invalidate_settings_cache

router = APIRouter(prefix="/settings", tags=["settings"])

DEFAULTS = PLATFORM_SETTINGS_DEFAULTS

# Публично: без Telegram chat id / username и других внутренних полей
SETTINGS_PUBLIC_KEYS = frozenset({"require_moderation", "auto_archive_days", "max_photos"})


def _get_all(db: Session) -> dict:
    return get_settings_with_defaults(db, DEFAULTS)


@router.get("")
def get_settings(
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user),
):
    all_s = _get_all(db)
    if user is not None and user.role == "admin":
        return all_s
    return {k: all_s.get(k, DEFAULTS[k]) for k in SETTINGS_PUBLIC_KEYS}


@router.patch("")
def update_settings(
    data: dict,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    allowed = set(DEFAULTS.keys())
    for k, v in data.items():
        if k not in allowed:
            continue
        row = db.scalar(select(PlatformSettings).where(PlatformSettings.key == k))
        if row:
            row.value = str(v)
        else:
            db.add(PlatformSettings(key=k, value=str(v)))
    db.commit()
    invalidate_settings_cache()
    return _get_all(db)
