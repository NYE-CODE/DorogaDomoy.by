"""FCM HTTP v1 sender (service account). Legacy server key remains a fallback."""
from __future__ import annotations

import json
import logging
import os
import time
from typing import Any

import httpx
from jose import jwt

logger = logging.getLogger(__name__)

_LEGACY_URL = "https://fcm.googleapis.com/fcm/send"
_TOKEN_URL = "https://oauth2.googleapis.com/token"
_FCM_SCOPE = "https://www.googleapis.com/auth/firebase.messaging"
_V1_URL = "https://fcm.googleapis.com/v1/projects/{project_id}/messages:send"

_INVALID_TOKEN_ERRORS = frozenset({
    "NotRegistered",
    "InvalidRegistration",
    "MismatchSenderId",
})
_V1_INVALID_CODES = frozenset({
    "UNREGISTERED",
    "SENDER_ID_MISMATCH",
    "NOT_FOUND",
})

_access_cache: dict[str, Any] = {}


def _strip_html(text: str) -> str:
    out = text
    for tag in ("<b>", "</b>", "<i>", "</i>", "<code>", "</code>"):
        out = out.replace(tag, "")
    return out.replace("&nbsp;", " ").strip()


def _service_account_path() -> str:
    return os.getenv("FCM_SERVICE_ACCOUNT_JSON", "").strip()


def _load_service_account() -> dict[str, Any] | None:
    path = _service_account_path()
    if not path or not os.path.isfile(path):
        return None
    try:
        with open(path, encoding="utf-8") as handle:
            data = json.load(handle)
    except Exception:
        logger.exception("FCM service account file is unreadable")
        return None
    if not isinstance(data, dict):
        return None
    if not data.get("client_email") or not data.get("private_key") or not data.get("project_id"):
        logger.warning("FCM service account file is missing required fields")
        return None
    return data


def fcm_configured() -> bool:
    if _load_service_account() is not None:
        return True
    return bool(os.getenv("FCM_SERVER_KEY", "").strip())


def _access_token(account: dict[str, Any]) -> str:
    now = int(time.time())
    cached = _access_cache.get("token")
    exp = int(_access_cache.get("exp") or 0)
    email = account.get("client_email")
    if cached and _access_cache.get("email") == email and exp - 60 > now:
        return str(cached)

    claims = {
        "iss": account["client_email"],
        "scope": _FCM_SCOPE,
        "aud": _TOKEN_URL,
        "iat": now,
        "exp": now + 3600,
    }
    assertion = jwt.encode(claims, account["private_key"], algorithm="RS256")
    resp = httpx.post(
        _TOKEN_URL,
        data={
            "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
            "assertion": assertion,
        },
        timeout=15.0,
    )
    resp.raise_for_status()
    body = resp.json()
    token = str(body["access_token"])
    _access_cache["token"] = token
    _access_cache["email"] = email
    _access_cache["exp"] = now + int(body.get("expires_in") or 3600)
    return token


def _v1_error_code(payload: Any) -> str | None:
    if not isinstance(payload, dict):
        return None
    err = payload.get("error")
    if not isinstance(err, dict):
        return None
    details = err.get("details") or []
    if isinstance(details, list):
        for item in details:
            if isinstance(item, dict) and item.get("errorCode"):
                return str(item["errorCode"])
    status = err.get("status")
    if status:
        return str(status)
    return None


def _send_v1(
    account: dict[str, Any],
    tokens: list[str],
    *,
    title: str,
    body: str,
    data: dict[str, str] | None,
) -> tuple[int, list[str]]:
    token = _access_token(account)
    project_id = str(account["project_id"])
    url = _V1_URL.format(project_id=project_id)
    string_data = {str(k): str(v) for k, v in (data or {}).items() if v is not None}
    success = 0
    invalid: list[str] = []
    for device in tokens:
        message: dict[str, Any] = {
            "token": device,
            "notification": {"title": title[:120], "body": body[:900]},
            "android": {
                "priority": "HIGH",
                "notification": {
                    "channel_id": "doragadomoy_push",
                    "sound": "default",
                },
            },
            "apns": {"payload": {"aps": {"sound": "default"}}},
        }
        if string_data:
            message["data"] = string_data
        try:
            resp = httpx.post(
                url,
                headers={"Authorization": f"Bearer {token}"},
                json={"message": message},
                timeout=15.0,
            )
        except Exception:
            logger.exception("FCM v1 send failed")
            continue
        if 200 <= resp.status_code < 300:
            success += 1
            continue
        code = None
        try:
            code = _v1_error_code(resp.json())
        except Exception:
            code = None
        logger.warning("FCM v1 error status=%s code=%s", resp.status_code, code or "")
        if code in _V1_INVALID_CODES:
            invalid.append(device)
    return success, invalid


def _send_legacy(
    tokens: list[str],
    *,
    title: str,
    body: str,
    data: dict[str, str] | None,
) -> tuple[int, list[str]]:
    server_key = os.getenv("FCM_SERVER_KEY", "").strip()
    if not server_key:
        logger.info("FCM is not configured — skip push (%s tokens)", len(tokens))
        return 0, []

    payload: dict[str, Any] = {
        "registration_ids": tokens,
        "notification": {
            "title": title[:120],
            "body": body[:900],
            "sound": "default",
        },
        "data": data or {},
        "priority": "high",
    }
    try:
        resp = httpx.post(
            _LEGACY_URL,
            headers={
                "Authorization": f"key={server_key}",
                "Content-Type": "application/json",
            },
            content=json.dumps(payload),
            timeout=15.0,
        )
    except Exception:
        logger.exception("FCM send failed")
        return 0, []
    if resp.status_code >= 400:
        logger.warning("FCM error status=%s", resp.status_code)
        return 0, []
    data_json = resp.json()
    success = int(data_json.get("success") or 0)
    invalid: list[str] = []
    results = data_json.get("results") or []
    if isinstance(results, list):
        for idx, item in enumerate(results):
            if not isinstance(item, dict):
                continue
            err = item.get("error")
            if err in _INVALID_TOKEN_ERRORS and idx < len(tokens):
                invalid.append(tokens[idx])
    return success, invalid


def send_fcm_to_tokens(
    tokens: list[str],
    *,
    title: str,
    body: str,
    data: dict[str, str] | None = None,
) -> tuple[int, list[str]]:
    """Send a notification to device tokens.

    Returns ``(success_count, invalid_tokens)``. Invalid tokens should be deactivated.
    """
    clean = [t.strip() for t in tokens if t and str(t).strip()]
    if not clean:
        return 0, []

    plain_body = _strip_html(body)
    account = _load_service_account()
    if account is not None:
        return _send_v1(
            account,
            clean[:900],
            title=title,
            body=plain_body,
            data=data,
        )
    return _send_legacy(clean[:900], title=title, body=plain_body, data=data)
