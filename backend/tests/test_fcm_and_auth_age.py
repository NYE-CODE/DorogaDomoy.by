"""Тесты FCM helper и возраста Telegram Login."""
import json
from unittest.mock import MagicMock, patch

from integrations.fcm import fcm_configured, send_fcm_to_tokens
from telegram_login import MAX_AUTH_AGE_SECONDS


def test_device_token_extract_prefers_fcm_token():
    from routers.device_tokens import _extract_token_and_platform

    class _Req:
        query_params = {"token": "query-token-value-1234567890"}

    token, platform = _extract_token_and_platform(
        {"fcm_token": "body-fcm-token-value-1234567890", "platform": "ios"},
        _Req(),
    )
    assert token.startswith("body-fcm-token")
    assert platform == "ios"


def test_fcm_configured_only_server_key(monkeypatch):
    monkeypatch.delenv("FCM_SERVER_KEY", raising=False)
    monkeypatch.setenv("FCM_SERVICE_ACCOUNT_JSON", "/tmp/missing.json")
    assert fcm_configured() is False
    monkeypatch.setenv("FCM_SERVER_KEY", "server-key")
    assert fcm_configured() is True


def test_fcm_configured_service_account_file(monkeypatch, tmp_path):
    monkeypatch.delenv("FCM_SERVER_KEY", raising=False)
    path = tmp_path / "sa.json"
    path.write_text(
        json.dumps(
            {
                "project_id": "dorogadomoy-by",
                "client_email": "push@dorogadomoy-by.iam.gserviceaccount.com",
                "private_key": "not-used-here",
            }
        ),
        encoding="utf-8",
    )
    monkeypatch.setenv("FCM_SERVICE_ACCOUNT_JSON", str(path))
    assert fcm_configured() is True


def test_send_fcm_v1_deactivates_unregistered(monkeypatch, tmp_path):
    monkeypatch.delenv("FCM_SERVER_KEY", raising=False)
    path = tmp_path / "sa.json"
    path.write_text(
        json.dumps(
            {
                "project_id": "dorogadomoy-by",
                "client_email": "push@dorogadomoy-by.iam.gserviceaccount.com",
                "private_key": "not-used-here",
            }
        ),
        encoding="utf-8",
    )
    monkeypatch.setenv("FCM_SERVICE_ACCOUNT_JSON", str(path))

    ok = MagicMock()
    ok.status_code = 200
    ok.json.return_value = {"name": "projects/dorogadomoy-by/messages/1"}
    dead = MagicMock()
    dead.status_code = 404
    dead.json.return_value = {
        "error": {
            "status": "NOT_FOUND",
            "details": [{"errorCode": "UNREGISTERED"}],
        }
    }

    with patch("integrations.fcm._access_token", return_value="ya29.test"):
        with patch("integrations.fcm.httpx.post", side_effect=[ok, dead]) as mock_post:
            success, invalid = send_fcm_to_tokens(
                ["tok-good", "tok-dead"],
                title="T",
                body="B",
                data={"pet_id": "p1"},
            )
    assert success == 1
    assert invalid == ["tok-dead"]
    sent = mock_post.call_args_list[0].kwargs["json"]["message"]
    assert sent["token"] == "tok-good"
    assert sent["data"]["pet_id"] == "p1"
    assert "fcm/send" not in mock_post.call_args_list[0].args[0]


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
