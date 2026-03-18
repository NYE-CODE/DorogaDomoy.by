"""Feature flags API. GET — публичный (лендинг). PATCH — только админ."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import PlatformSettings, User
from auth import require_admin

router = APIRouter(prefix="/feature-flags", tags=["feature-flags"])

DEFAULTS = {
    "ff_landing_show_stats": "true",
    "ff_landing_show_help": "true",
}


def _get_all(db: Session) -> dict:
    rows = db.query(PlatformSettings).all()
    current = {r.key: r.value for r in rows}
    return {k: current.get(k, v) for k, v in DEFAULTS.items()}


@router.get("")
def get_feature_flags(db: Session = Depends(get_db)):
    """Публичный endpoint для чтения фича-флагов (лендинг, поиск)."""
    return _get_all(db)


class FeatureFlagsUpdate(BaseModel):
    ff_landing_show_stats: bool | None = None
    ff_landing_show_help: bool | None = None


@router.patch("")
def update_feature_flags(
    data: FeatureFlagsUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Обновление фича-флагов (только для админа)."""
    updates = data.model_dump(exclude_none=True)
    for k, v in updates.items():
        if k not in DEFAULTS:
            continue
        val_str = "true" if v else "false"
        row = db.query(PlatformSettings).filter(PlatformSettings.key == k).first()
        if row:
            row.value = val_str
        else:
            db.add(PlatformSettings(key=k, value=val_str))
    db.commit()
    return _get_all(db)
