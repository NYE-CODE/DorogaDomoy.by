"""Тесты уведомлений о похожих объявлениях."""
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from match_notifications import (
    MIN_MATCH_PERCENT,
    _send_similar_match_notifications,
    send_similar_match_notifications_sync,
)


def _make_pet(**kwargs):
    defaults = {
        "id": "pet-new",
        "author_id": "author-new",
        "pet_scope": "lost_found",
        "moderation_status": "approved",
        "is_archived": False,
        "status": "found",
        "animal_type": "dog",
        "breed": "Лабрадор",
        "location_lat": 53.9,
        "location_lng": 27.5,
    }
    defaults.update(kwargs)
    return SimpleNamespace(**defaults)


def test_skips_when_match_percent_below_threshold():
    pet = _make_pet()
    owner_pet = _make_pet(id="pet-old", author_id="owner-1", status="searching")
    db = MagicMock()

    with patch("match_notifications.find_similar_pets") as mock_find:
        mock_find.return_value = [
            {"pet": owner_pet, "match_percent": MIN_MATCH_PERCENT - 1, "distance_km": 2.0, "reasons": ["nearby"]},
        ]
        with patch("match_notifications._send_telegram_message_sync") as mock_send:
            _send_similar_match_notifications(pet, db)
            mock_send.assert_not_called()
            db.add.assert_not_called()


def test_notifies_owner_of_similar_pet():
    pet = _make_pet()
    owner_pet = _make_pet(id="pet-old", author_id="owner-1", status="searching", breed="лабрадор")
    owner = SimpleNamespace(id="owner-1", telegram_id=12345, is_blocked=False)
    db = MagicMock()
    db.scalar.side_effect = [None, owner, None]  # dedup, owner, settings

    with patch("match_notifications.find_similar_pets") as mock_find:
        mock_find.return_value = [
            {
                "pet": owner_pet,
                "match_percent": 72,
                "distance_km": 3.2,
                "reasons": ["similar_breed", "visual_similarity", "nearby"],
            },
        ]
        with patch("match_notifications.BOT_TOKEN", "test-token"):
            with patch("match_notifications._send_telegram_message_sync", return_value=True) as mock_send:
                _send_similar_match_notifications(pet, db)
                mock_send.assert_called_once()
                args = mock_send.call_args[0]
                assert args[0] == 12345
                assert "72%" in args[1]
                assert "similar_match" in str(db.add.call_args[0][0].type)


def test_skips_same_author():
    pet = _make_pet(author_id="owner-1")
    own_pet = _make_pet(id="pet-old", author_id="owner-1", status="searching")
    db = MagicMock()

    with patch("match_notifications.find_similar_pets") as mock_find:
        mock_find.return_value = [
            {"pet": own_pet, "match_percent": 80, "distance_km": 1.0, "reasons": ["nearby"]},
        ]
        with patch("match_notifications.BOT_TOKEN", "test-token"):
            with patch("match_notifications._send_telegram_message_sync") as mock_send:
                _send_similar_match_notifications(pet, db)
                mock_send.assert_not_called()


def test_skips_if_already_notified():
    pet = _make_pet()
    owner_pet = _make_pet(id="pet-old", author_id="owner-1", status="searching")
    db = MagicMock()
    db.scalar.return_value = "notif-existing"  # dedup hit

    with patch("match_notifications.find_similar_pets") as mock_find:
        mock_find.return_value = [
            {"pet": owner_pet, "match_percent": 80, "distance_km": 1.0, "reasons": ["nearby"]},
        ]
        with patch("match_notifications.BOT_TOKEN", "test-token"):
            with patch("match_notifications._send_telegram_message_sync") as mock_send:
                _send_similar_match_notifications(pet, db)
                mock_send.assert_not_called()


def test_skips_when_similar_matches_disabled():
    pet = _make_pet()
    owner_pet = _make_pet(id="pet-old", author_id="owner-1", status="searching")
    owner = SimpleNamespace(id="owner-1", telegram_id=12345, is_blocked=False)
    settings = SimpleNamespace(
        notifications_enabled=True,
        notify_similar_matches=False,
        notify_animal_types=["dog", "cat", "other"],
    )
    db = MagicMock()
    db.scalar.side_effect = [None, owner, settings]

    with patch("match_notifications.find_similar_pets") as mock_find:
        mock_find.return_value = [
            {"pet": owner_pet, "match_percent": 80, "distance_km": 1.0, "reasons": ["nearby"]},
        ]
        with patch("match_notifications.BOT_TOKEN", "test-token"):
            with patch("match_notifications._send_telegram_message_sync") as mock_send:
                _send_similar_match_notifications(pet, db)
                mock_send.assert_not_called()


def test_skips_when_outside_watch_zone():
    pet = _make_pet(location_lat=54.5, location_lng=28.0)
    owner_pet = _make_pet(id="pet-old", author_id="owner-1", status="searching")
    owner = SimpleNamespace(id="owner-1", telegram_id=12345, is_blocked=False)
    settings = SimpleNamespace(
        notifications_enabled=True,
        notify_similar_matches=True,
        notify_animal_types=["dog", "cat", "other"],
        watch_zone_enabled=True,
        home_lat=53.9,
        home_lng=27.5,
        watch_radius_km=3.0,
    )
    db = MagicMock()
    db.scalar.side_effect = [None, owner, settings]

    with patch("match_notifications.find_similar_pets") as mock_find:
        mock_find.return_value = [
            {"pet": owner_pet, "match_percent": 80, "distance_km": 1.0, "reasons": ["nearby"]},
        ]
        with patch("match_notifications.BOT_TOKEN", "test-token"):
            with patch("match_notifications._send_telegram_message_sync") as mock_send:
                _send_similar_match_notifications(pet, db)
                mock_send.assert_not_called()


def test_sync_entry_loads_pet_and_runs():
    pet = _make_pet()
    db = MagicMock()
    db.scalar.return_value = pet

    with patch("match_notifications.SessionLocal", return_value=db):
        with patch("match_notifications._send_similar_match_notifications") as mock_inner:
            send_similar_match_notifications_sync("pet-new")
            mock_inner.assert_called_once_with(pet, db)
            db.close.assert_called_once()
