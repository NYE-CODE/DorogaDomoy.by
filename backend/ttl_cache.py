"""Процессный TTL-кэш для редко меняющихся справочников (настройки, категории блога)."""
from __future__ import annotations

import time
from threading import RLock

_lock = RLock()
_settings_by_keyset: dict[tuple[str, ...], tuple[float, dict[str, str]]] = {}
SETTINGS_TTL_SEC = 30.0

_blog_category_titles: tuple[float, dict[str, str]] | None = None
BLOG_CATEGORY_TITLES_TTL_SEC = 45.0


def settings_cache_get(cache_key: tuple[str, ...]) -> dict[str, str] | None:
    now = time.monotonic()
    with _lock:
        row = _settings_by_keyset.get(cache_key)
        if row and row[0] > now:
            return dict(row[1])
    return None


def settings_cache_set(cache_key: tuple[str, ...], value: dict[str, str]) -> None:
    with _lock:
        _settings_by_keyset[cache_key] = (time.monotonic() + SETTINGS_TTL_SEC, value.copy())


def invalidate_settings_cache() -> None:
    with _lock:
        _settings_by_keyset.clear()


def blog_category_titles_get() -> dict[str, str] | None:
    global _blog_category_titles
    now = time.monotonic()
    with _lock:
        if _blog_category_titles and _blog_category_titles[0] > now:
            return dict(_blog_category_titles[1])
    return None


def blog_category_titles_set(m: dict[str, str]) -> None:
    global _blog_category_titles
    with _lock:
        _blog_category_titles = (time.monotonic() + BLOG_CATEGORY_TITLES_TTL_SEC, m.copy())


def invalidate_blog_category_titles_cache() -> None:
    global _blog_category_titles
    with _lock:
        _blog_category_titles = None
