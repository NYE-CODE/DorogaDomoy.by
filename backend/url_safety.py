"""Проверка внешних ссылок (волонтёрство, оплата) — в т.ч. при чтении из БД."""
from __future__ import annotations

import os
import re
from urllib.parse import urlparse

_ALLOWED_SCHEMES = frozenset({"http", "https"})
# localhost для dev без allowlist
_DEV_HOSTS = frozenset({"localhost", "127.0.0.1"})


def help_external_url_hosts() -> frozenset[str] | None:
    """
    Белый список хостов из HELP_EXTERNAL_URL_HOSTS (через запятую).
    Пусто — только базовая проверка схемы/хоста, без ограничения домена.
    """
    raw = os.getenv("HELP_EXTERNAL_URL_HOSTS", "").strip()
    if not raw:
        return None
    out: set[str] = set()
    for part in raw.split(","):
        h = part.strip().lower()
        if not h:
            continue
        h = h.removeprefix("https://").removeprefix("http://")
        h = h.split("/")[0].split(":")[0]
        out.add(h.lstrip("."))
    return frozenset(out) if out else None


def _host_allowed(hostname: str, allowed: frozenset[str] | None) -> bool:
    if allowed is None:
        return True
    host = hostname.lower().rstrip(".")
    if host in _DEV_HOSTS:
        return True
    for entry in allowed:
        if host == entry or host.endswith(f".{entry}"):
            return True
    return False


def validate_external_url(url: str, *, allow_empty: bool = False) -> str:
    """
    Строгая проверка для записи через API.
    Возвращает нормализованный URL или ValueError.
    """
    s = (url or "").strip()
    if not s:
        if allow_empty:
            return ""
        raise ValueError("Укажите ссылку")

    parsed = urlparse(s)
    scheme = (parsed.scheme or "").lower()
    if scheme not in _ALLOWED_SCHEMES:
        raise ValueError("Ссылка должна начинаться с http:// или https://")
    if parsed.username or parsed.password:
        raise ValueError("Ссылка не должна содержать логин или пароль")
    if not parsed.hostname:
        raise ValueError("Некорректный адрес ссылки")
    if re.search(r"[\s\x00-\x1f]", s):
        raise ValueError("Недопустимые символы в ссылке")

    allowed = help_external_url_hosts()
    if not _host_allowed(parsed.hostname, allowed):
        raise ValueError(
            "Домен ссылки не входит в разрешённый список (HELP_EXTERNAL_URL_HOSTS)"
        )

    return s


def sanitize_external_url_for_public(url: str, *, allow_empty: bool = False) -> str:
    """
    Мягкая проверка при выдаче на лендинг: при компрометации БД
    подменённые ссылки отбрасываются (пустая строка / пропуск tier).
    """
    s = (url or "").strip()
    if not s:
        return "" if allow_empty else ""

    try:
        return validate_external_url(s, allow_empty=allow_empty)
    except ValueError:
        return ""
