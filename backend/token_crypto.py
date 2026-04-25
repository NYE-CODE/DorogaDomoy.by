"""Helpers to encrypt/decrypt sensitive tokens for DB storage."""
from __future__ import annotations

import base64
import hashlib
import os

from cryptography.fernet import Fernet, InvalidToken

ENC_PREFIX = "enc:v1:"


def _build_fernet() -> Fernet:
    # Dedicated key has priority; fallback keeps environments working with existing SECRET_KEY.
    seed = (
        os.getenv("INSTAGRAM_TOKEN_ENCRYPTION_KEY")
        or os.getenv("SECRET_KEY")
        or "dorogadomoy-instagram-token-fallback"
    )
    key = base64.urlsafe_b64encode(hashlib.sha256(seed.encode("utf-8")).digest())
    return Fernet(key)


def encrypt_token(token: str | None) -> str | None:
    value = (token or "").strip()
    if not value:
        return None
    fernet = _build_fernet()
    encrypted = fernet.encrypt(value.encode("utf-8")).decode("utf-8")
    return f"{ENC_PREFIX}{encrypted}"


def decrypt_token(value: str | None) -> str:
    raw = (value or "").strip()
    if not raw:
        return ""
    if not raw.startswith(ENC_PREFIX):
        # Backward compatibility with old plaintext rows.
        return raw
    fernet = _build_fernet()
    payload = raw[len(ENC_PREFIX) :]
    try:
        return fernet.decrypt(payload.encode("utf-8")).decode("utf-8")
    except InvalidToken as exc:
        raise ValueError("Invalid encrypted token payload") from exc
