"""Platform settings API."""
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import PlatformSettings, User
from auth import require_admin
from platform_settings import PLATFORM_SETTINGS_DEFAULTS, get_settings_with_defaults

router = APIRouter(prefix="/settings", tags=["settings"])

DEFAULTS = PLATFORM_SETTINGS_DEFAULTS


def _get_all(db: Session) -> dict:
    return get_settings_with_defaults(db, DEFAULTS)


@router.get("")
def get_settings(db: Session = Depends(get_db)):
    return _get_all(db)


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
    return _get_all(db)
