"""Platform settings API."""
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import PlatformSettings, User
from auth import require_admin, get_current_user
from platform_settings import PLATFORM_SETTINGS_DEFAULTS, get_settings_with_defaults
from schemas import PlatformSettingsUpdate
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
    data: PlatformSettingsUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    patch = data.model_dump(exclude_unset=True, exclude_none=True)
    allowed = set(DEFAULTS.keys())
    for k, v in patch.items():
        if k not in allowed:
            continue
        if isinstance(v, bool):
            str_val = "true" if v else "false"
        elif isinstance(v, int):
            str_val = str(v)
        else:
            str_val = str(v) if v is not None else ""
        row = db.scalar(select(PlatformSettings).where(PlatformSettings.key == k))
        if row:
            row.value = str_val
        else:
            db.add(PlatformSettings(key=k, value=str_val))
    db.commit()
    invalidate_settings_cache()
    return _get_all(db)
