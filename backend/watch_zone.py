"""Watch-зона для фильтрации уведомлений о совпадениях."""
from __future__ import annotations

from models import NotificationSettings, Pet
from pet_similarity import haversine_km


def passes_watch_zone(ns: NotificationSettings | None, pet: Pet) -> bool:
    """Если watch-зона включена — новое объявление должно попасть в радиус."""
    if not ns or not getattr(ns, "watch_zone_enabled", False):
        return True
    if ns.home_lat is None or ns.home_lng is None:
        return True
    if pet.location_lat is None or pet.location_lng is None:
        return False
    radius = getattr(ns, "watch_radius_km", None) or 5.0
    dist = haversine_km(ns.home_lat, ns.home_lng, pet.location_lat, pet.location_lng)
    return dist <= radius
