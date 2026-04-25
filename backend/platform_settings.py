"""Shared platform settings defaults and access helpers."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from models import PlatformSettings
from ttl_cache import settings_cache_get, settings_cache_set

PLATFORM_SETTINGS_DEFAULTS = {
    "require_moderation": "true",
    "auto_archive_days": "90",
    "max_photos": "10",
    "reward_default_points": "50",
    # Блог: куда слать анонсы (можно задать в админке; .env — запасной вариант)
    "telegram_blog_chat_id": "",
    "telegram_blog_public_username": "",
    # Instagram автопубликация объявлений (region routing)
    "instagram_autopublish_enabled": "false",
    "instagram_story_enabled": "true",
    "instagram_manual_when_auto_off": "true",
}

FEATURE_FLAG_DEFAULTS = {
    "ff_landing_show_stats": "true",
    "ff_landing_show_help": "true",
    "ff_landing_show_pets_feature": "true",
    "ff_landing_show_faq": "true",
    # Продвижение объявлений пользователем в Instagram Stories (очередь буста)
    "ff_instagram_boost_stories": "true",
    # Награды за помощь в поиске
    "ff_reward_enabled": "true",
    "ff_reward_money_enabled": "true",
}

ALL_PLATFORM_SETTINGS_DEFAULTS = {
    **PLATFORM_SETTINGS_DEFAULTS,
    **FEATURE_FLAG_DEFAULTS,
}

DEFAULT_MAX_PHOTOS = int(PLATFORM_SETTINGS_DEFAULTS["max_photos"])


def get_settings_with_defaults(db: Session, defaults: dict[str, str]) -> dict[str, str]:
    if not defaults:
        return {}
    cache_key = tuple(sorted(defaults.keys()))
    hit = settings_cache_get(cache_key)
    if hit is not None:
        return hit
    keys = list(defaults.keys())
    rows = db.scalars(select(PlatformSettings).where(PlatformSettings.key.in_(keys))).all()
    current = {row.key: row.value for row in rows}
    merged = {key: current.get(key, default) for key, default in defaults.items()}
    settings_cache_set(cache_key, merged)
    return merged


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
