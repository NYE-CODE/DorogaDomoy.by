"""Instagram Graph API publication helpers."""
from __future__ import annotations

import os
import time
from dataclasses import dataclass

import httpx

GRAPH_BASE = os.getenv("INSTAGRAM_GRAPH_BASE", "https://graph.facebook.com/v21.0").rstrip("/")
GRAPH_TIMEOUT = float(os.getenv("INSTAGRAM_GRAPH_TIMEOUT_SECONDS", "20"))
GRAPH_POLL_ATTEMPTS = int(os.getenv("INSTAGRAM_GRAPH_POLL_ATTEMPTS", "8"))
GRAPH_POLL_DELAY_SECONDS = float(os.getenv("INSTAGRAM_GRAPH_POLL_DELAY_SECONDS", "1.5"))


class InstagramPublishError(RuntimeError):
    """Recoverable publishing error returned by Graph API."""


@dataclass(slots=True)
class InstagramPublishResult:
    media_id: str


def _api_post(path: str, data: dict) -> dict:
    url = f"{GRAPH_BASE}/{path.lstrip('/')}"
    with httpx.Client(timeout=GRAPH_TIMEOUT) as client:
        resp = client.post(url, data=data)
    payload = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
    if resp.status_code >= 400:
        msg = payload.get("error", {}).get("message") if isinstance(payload, dict) else resp.text
        raise InstagramPublishError(msg or f"HTTP {resp.status_code}")
    return payload


def _api_get(path: str, params: dict) -> dict:
    url = f"{GRAPH_BASE}/{path.lstrip('/')}"
    with httpx.Client(timeout=GRAPH_TIMEOUT) as client:
        resp = client.get(url, params=params)
    payload = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
    if resp.status_code >= 400:
        msg = payload.get("error", {}).get("message") if isinstance(payload, dict) else resp.text
        raise InstagramPublishError(msg or f"HTTP {resp.status_code}")
    return payload


def _wait_container_ready(container_id: str, access_token: str) -> None:
    last_status = "UNKNOWN"
    for _ in range(max(1, GRAPH_POLL_ATTEMPTS)):
        data = _api_get(
            container_id,
            {
                "fields": "id,status_code,status",
                "access_token": access_token,
            },
        )
        status_code = str(data.get("status_code") or data.get("status") or "").upper()
        last_status = status_code or "UNKNOWN"
        if status_code in {"FINISHED", "PUBLISHED"}:
            return
        if status_code in {"ERROR", "EXPIRED"}:
            raise InstagramPublishError(f"Media container status: {status_code}")
        time.sleep(max(0.2, GRAPH_POLL_DELAY_SECONDS))
    raise InstagramPublishError(f"Media container not ready: {last_status}")


def build_feed_caption(*, pet_id: str, city: str | None, status: str | None, site_url: str) -> str:
    status_text = "Пропал питомец" if status == "searching" else "Найден питомец"
    city_text = (city or "").strip()
    location_line = f"\n📍 {city_text}" if city_text else ""
    return (
        f"{status_text}{location_line}\n\n"
        f"Подробнее: {site_url.rstrip('/')}/pet/{pet_id}\n"
        "#dorogadomoy #питомцы #поискпитомца"
    )


def publish_image(
    *,
    instagram_business_id: str,
    access_token: str,
    image_url: str,
    caption: str | None = None,
    is_story: bool = False,
) -> InstagramPublishResult:
    if not instagram_business_id.strip():
        raise InstagramPublishError("Missing instagram_business_id")
    if not access_token.strip():
        raise InstagramPublishError("Missing access token")
    if not image_url.startswith("http://") and not image_url.startswith("https://"):
        raise InstagramPublishError("Image URL must be public absolute URL")

    create_payload = {
        "image_url": image_url,
        "access_token": access_token,
    }
    if is_story:
        create_payload["media_type"] = "STORIES"
    elif caption:
        create_payload["caption"] = caption

    created = _api_post(f"{instagram_business_id}/media", create_payload)
    container_id = str(created.get("id") or "").strip()
    if not container_id:
        raise InstagramPublishError("Graph API did not return media container id")

    _wait_container_ready(container_id, access_token)

    published = _api_post(
        f"{instagram_business_id}/media_publish",
        {
            "creation_id": container_id,
            "access_token": access_token,
        },
    )
    media_id = str(published.get("id") or "").strip()
    if not media_id:
        raise InstagramPublishError("Graph API did not return media id")
    return InstagramPublishResult(media_id=media_id)
