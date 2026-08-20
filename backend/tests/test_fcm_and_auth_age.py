"""Тесты FCM helper и возраста Telegram Login."""
import json
from unittest.mock import MagicMock, patch

from integrations.fcm import fcm_configured, send_fcm_to_tokens
from telegram_login import MAX_AUTH_AGE_SECONDS


def test_fcm_configured_only_server_key(monkeypatch):
    monkeypatch.delenv("FCM_SERVER_KEY", raising=False)
    monkeypatch.setenv("FCM_SERVICE_ACCOUNT_JSON", "/tmp/missing.json")
    assert fcm_configured() is False
    monkeypatch.setenv("FCM_SERVER_KEY", "server-key")
    assert fcm_configured() is True


def test_send_fcm_returns_invalid_tokens(monkeypatch):
    monkeypatch.setenv("FCM_SERVER_KEY", "server-key")
    tokens = ["tok-good", "tok-dead", "tok-bad"]
    payload = {
        "success": 1,
        "failure": 2,
        "results": [
            {"message_id": "1"},
            {"error": "NotRegistered"},
            {"error": "InvalidRegistration"},
        ],
    }
    resp = MagicMock()
    resp.status_code = 200
    resp.json.return_value = payload

    with patch("integrations.fcm.httpx.post", return_value=resp) as mock_post:
        success, invalid = send_fcm_to_tokens(tokens, title="T", body="B")
        mock_post.assert_called_once()
        body = json.loads(mock_post.call_args.kwargs["content"])
        assert body["registration_ids"] == tokens
        assert success == 1
        assert invalid == ["tok-dead", "tok-bad"]


def test_send_fcm_error_does_not_log_body(monkeypatch):
    monkeypatch.setenv("FCM_SERVER_KEY", "server-key")
    resp = MagicMock()
    resp.status_code = 401
    resp.text = "secret-token-should-not-appear"

    with patch("integrations.fcm.httpx.post", return_value=resp):
        with patch("integrations.fcm.logger") as mock_logger:
            success, invalid = send_fcm_to_tokens(["tok"], title="T", body="B")
            assert success == 0
            assert invalid == []
            warn_msg = mock_logger.warning.call_args[0][0]
            assert "secret-token" not in warn_msg
            assert "401" in str(mock_logger.warning.call_args)


def test_telegram_auth_age_is_short():
    # Replay window must stay tight (not 24h).
    assert MAX_AUTH_AGE_SECONDS <= 600
