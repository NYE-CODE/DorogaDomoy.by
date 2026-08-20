"""FCM Legacy HTTP sender (server key). No-op when FCM_SERVER_KEY is missing."""
from __future__ import annotations

import json
import logging
import os
from typing import Any

import httpx

logger = logging.getLogger(__name__)

# Legacy FCM HTTP API (server key). HTTP v1 / service-account is not implemented yet.
_LEGACY_URL = "https://fcm.googleapis.com/fcm/send"

# Results that mean the registration token should be deactivated.
_INVALID_TOKEN_ERRORS = frozenset({
    "NotRegistered",
    "InvalidRegistration",
    "MismatchSenderId",
})


def _strip_html(text: str) -> str:
    # Telegram messages may contain simple HTML tags.
    out = text
    for tag in ("<b>", "</b>", "<i>", "</i>", "<code>", "</code>"):
        out = out.replace(tag, "")
    return out.replace("&nbsp;", " ").strip()


def fcm_configured() -> bool:
    return bool(os.getenv("FCM_SERVER_KEY", "").strip())


def send_fcm_to_tokens(
    tokens: list[str],
    *,
    title: str,
    body: str,
    data: dict[str, str] | None = None,
) -> tuple[int, list[str]]:
    """Send notification to device tokens.

    Returns ``(success_count, invalid_tokens)`` where ``invalid_tokens`` should be
    deactivated locally.
    """
    clean = [t.strip() for t in tokens if t and str(t).strip()]
    if not clean:
        return 0, []

    server_key = os.getenv("FCM_SERVER_KEY", "").strip()
    if not server_key:
        logger.info("FCM_SERVER_KEY not set — skip push (%s tokens)", len(clean))
        return 0, []

    plain_body = _strip_html(body)
    batch = clean[:900]
    payload: dict[str, Any] = {
        "registration_ids": batch,
        "notification": {
            "title": title[:120],
            "body": plain_body[:900],
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
        if resp.status_code >= 400:
            # Do not log response body — may contain registration IDs.
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
                if err in _INVALID_TOKEN_ERRORS and idx < len(batch):
                    invalid.append(batch[idx])
        return success, invalid
    except Exception:
        logger.exception("FCM send failed")
        return 0, []
