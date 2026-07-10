"""Тесты watch-зоны."""
from types import SimpleNamespace

from watch_zone import passes_watch_zone


def _pet(lat: float, lng: float):
    return SimpleNamespace(location_lat=lat, location_lng=lng)


def _settings(enabled: bool, lat: float | None, lng: float | None, radius: float = 5.0):
    return SimpleNamespace(
        watch_zone_enabled=enabled,
        home_lat=lat,
        home_lng=lng,
        watch_radius_km=radius,
    )


def test_watch_zone_disabled_passes_always():
    pet = _pet(53.9, 27.5)
    ns = _settings(False, 53.9, 27.5)
    assert passes_watch_zone(ns, pet) is True
    assert passes_watch_zone(None, pet) is True


def test_watch_zone_filters_by_radius():
    center_lat, center_lng = 53.9, 27.5
    ns = _settings(True, center_lat, center_lng, radius=2.0)
    near = _pet(center_lat + 0.005, center_lng)
    far = _pet(center_lat + 0.2, center_lng)
    assert passes_watch_zone(ns, near) is True
    assert passes_watch_zone(ns, far) is False
