"""Platform settings API."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import PlatformSettings, User
from auth import require_admin

router = APIRouter(prefix="/settings", tags=["settings"])

DEFAULTS = {
    "require_moderation": "true",
    "auto_archive_days": "90",
    "max_photos": "5",
}


def _get_all(db: Session) -> dict:
    rows = db.query(PlatformSettings).all()
    current = {r.key: r.value for r in rows}
    return {k: current.get(k, v) for k, v in DEFAULTS.items()}


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
        row = db.query(PlatformSettings).filter(PlatformSettings.key == k).first()
        if row:
            row.value = str(v)
        else:
            db.add(PlatformSettings(key=k, value=str(v)))
    db.commit()
    return _get_all(db)
