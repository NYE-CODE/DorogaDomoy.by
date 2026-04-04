"""Shared platform settings defaults and access helpers."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from models import PlatformSettings

PLATFORM_SETTINGS_DEFAULTS = {
    "require_moderation": "true",
    "auto_archive_days": "90",
    "max_photos": "10",
}

FEATURE_FLAG_DEFAULTS = {
    "ff_landing_show_stats": "true",
    "ff_landing_show_help": "true",
    "ff_landing_show_pets_feature": "true",
}

ALL_PLATFORM_SETTINGS_DEFAULTS = {
    **PLATFORM_SETTINGS_DEFAULTS,
    **FEATURE_FLAG_DEFAULTS,
}

DEFAULT_MAX_PHOTOS = int(PLATFORM_SETTINGS_DEFAULTS["max_photos"])


def get_settings_with_defaults(db: Session, defaults: dict[str, str]) -> dict[str, str]:
    rows = db.scalars(select(PlatformSettings)).all()
    current = {row.key: row.value for row in rows}
    return {key: current.get(key, default) for key, default in defaults.items()}


def get_setting_value(db: Session, key: str, default: str) -> str:
    row = db.scalar(select(PlatformSettings).where(PlatformSettings.key == key))
    return row.value if row and row.value is not None else default


def get_bool_setting(db: Session, key: str, default: bool) -> bool:
    raw = get_setting_value(db, key, "true" if default else "false")
    return raw == "true"


def get_int_setting(db: Session, key: str, default: int) -> int:
    raw = get_setting_value(db, key, str(default))
    try:
        return int(raw)
    except (TypeError, ValueError):
        return default
