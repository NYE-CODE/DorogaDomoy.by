"""Shared helpers for timezone-aware UTC timestamps."""
from datetime import datetime, timezone


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def as_utc_aware(dt: datetime) -> datetime:
    """SQLite возвращает naive datetime — приводим к UTC для сравнения с utc_now()."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def is_past(expires_at: datetime) -> bool:
    return as_utc_aware(expires_at) < utc_now()
