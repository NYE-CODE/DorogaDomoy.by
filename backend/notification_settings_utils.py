"""Notification settings helpers."""
from __future__ import annotations

from models import NotificationSettings
from schemas import NotificationSettingsResponse


def notification_settings_to_response(ns: NotificationSettings) -> NotificationSettingsResponse:
    return NotificationSettingsResponse(
        notifications_enabled=ns.notifications_enabled,
        notification_radius_km=ns.notification_radius_km,
        notify_similar_matches=getattr(ns, "notify_similar_matches", True),
        watch_zone_enabled=getattr(ns, "watch_zone_enabled", False),
        watch_radius_km=getattr(ns, "watch_radius_km", None) or 5.0,
        home_lat=ns.home_lat,
        home_lng=ns.home_lng,
    )
