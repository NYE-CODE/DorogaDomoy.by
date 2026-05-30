"""Проверка данных Telegram Login Widget (https://core.telegram.org/widgets/login)."""
from __future__ import annotations

import hashlib
import hmac
import os
from typing import Any

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
# Максимальный возраст auth_date (секунды)
MAX_AUTH_AGE_SECONDS = 86400


def verify_telegram_login_payload(data: dict[str, Any]) -> tuple[bool, str]:
    """
    Проверяет подпись hash от Telegram Login Widget.
    Возвращает (ok, error_message).
    """
    if not BOT_TOKEN:
        return False, "Telegram-бот не настроен на сервере"

    payload = {k: v for k, v in data.items() if v is not None and k != "hash"}
    check_hash = data.get("hash")
    if not check_hash:
        return False, "Некорректные данные Telegram"

    try:
        auth_date = int(payload.get("auth_date", 0))
    except (TypeError, ValueError):
        return False, "Некорректная дата авторизации Telegram"

    if auth_date <= 0:
        return False, "Некорректная дата авторизации Telegram"

    import time

    if int(time.time()) - auth_date > MAX_AUTH_AGE_SECONDS:
        return False, "Данные Telegram устарели. Попробуйте снова."

    data_check_string = "\n".join(f"{k}={payload[k]}" for k in sorted(payload.keys()))
    secret_key = hashlib.sha256(BOT_TOKEN.encode()).digest()
    calculated = hmac.new(
        secret_key, data_check_string.encode(), hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(calculated, str(check_hash)):
        return False, "Неверная подпись Telegram"

    if not payload.get("id"):
        return False, "Некорректный идентификатор Telegram"

    return True, ""


def telegram_display_name(data: dict[str, Any]) -> str:
    first = str(data.get("first_name") or "").strip()
    last = str(data.get("last_name") or "").strip()
    if first and last:
        return f"{first} {last}"
    if first:
        return first
    if last:
        return last
    username = str(data.get("username") or "").strip()
    if username:
        return f"@{username}"
    return "Пользователь"


def internal_telegram_email(telegram_id: int) -> str:
    return f"tg{telegram_id}@telegram.local"


def is_internal_email(email: str | None) -> bool:
    return bool(email) and str(email).endswith("@telegram.local")
