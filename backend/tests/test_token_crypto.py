"""Тесты шифрования токенов Instagram."""
import os

import pytest

from token_crypto import decrypt_token, encrypt_token


def test_encrypt_decrypt_roundtrip(monkeypatch):
    monkeypatch.setenv("SECRET_KEY", "unit-test-secret-key")
    monkeypatch.delenv("INSTAGRAM_TOKEN_ENCRYPTION_KEY", raising=False)
    enc = encrypt_token("graph-token-abc")
    assert enc and enc.startswith("enc:v1:")
    assert decrypt_token(enc) == "graph-token-abc"


def test_encrypt_requires_secret(monkeypatch):
    monkeypatch.delenv("SECRET_KEY", raising=False)
    monkeypatch.delenv("INSTAGRAM_TOKEN_ENCRYPTION_KEY", raising=False)
    with pytest.raises(RuntimeError, match="SECRET_KEY"):
        encrypt_token("x")


def test_decrypt_plaintext_legacy():
    assert decrypt_token("plain-old-token") == "plain-old-token"
