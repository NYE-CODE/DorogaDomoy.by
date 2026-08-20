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


def _mock_prefetch(db, *, owners=None, push_owner_ids=None, settings_list=None):
    """Configure db.scalars() for owners / device tokens / notification settings prefetch."""
    owners_q = MagicMock()
    owners_q.all.return_value = list(owners or [])
    push_q = MagicMock()
    push_q.all.return_value = list(push_owner_ids or [])
    settings_q = MagicMock()
    settings_q.all.return_value = list(settings_list or [])
    db.scalars.side_effect = [owners_q, push_q, settings_q]


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
    _mock_prefetch(db, owners=[owner])
    db.scalar.return_value = None  # not already notified

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
                with patch("push_delivery.push_to_user", return_value=False):
                    _send_similar_match_notifications(pet, db)
                mock_send.assert_called_once()
                args = mock_send.call_args[0]
                assert args[0] == 12345
                assert "72%" in args[1]
                assert "similar_match" in str(db.add.call_args[0][0].type)


def test_notifies_via_push_without_bot_token():
    pet = _make_pet()
    owner_pet = _make_pet(id="pet-old", author_id="owner-1", status="searching")
    owner = SimpleNamespace(id="owner-1", telegram_id=None, is_blocked=False)
    db = MagicMock()
    _mock_prefetch(db, owners=[owner], push_owner_ids=["owner-1"])
    db.scalar.return_value = None

    with patch("match_notifications.find_similar_pets") as mock_find:
        mock_find.return_value = [
            {"pet": owner_pet, "match_percent": 80, "distance_km": 1.0, "reasons": ["nearby"]},
        ]
        with patch("match_notifications.BOT_TOKEN", ""):
            with patch("match_notifications._send_telegram_message_sync") as mock_send:
                with patch("push_delivery.push_to_user", return_value=True) as mock_push:
                    _send_similar_match_notifications(pet, db)
                mock_send.assert_not_called()
                mock_push.assert_called_once()
                assert db.add.called


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
    owner = SimpleNamespace(id="owner-1", telegram_id=12345, is_blocked=False)
    db = MagicMock()
    _mock_prefetch(db, owners=[owner])
    db.scalar.return_value = "notif-existing"

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
        user_id="owner-1",
        notifications_enabled=True,
        notify_similar_matches=False,
        notify_animal_types=["dog", "cat", "other"],
    )
    db = MagicMock()
    _mock_prefetch(db, owners=[owner], settings_list=[settings])
    db.scalar.return_value = None

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
        user_id="owner-1",
        notifications_enabled=True,
        notify_similar_matches=True,
        notify_animal_types=["dog", "cat", "other"],
        watch_zone_enabled=True,
        home_lat=53.9,
        home_lng=27.5,
        watch_radius_km=3.0,
    )
    db = MagicMock()
    _mock_prefetch(db, owners=[owner], settings_list=[settings])
    db.scalar.return_value = None

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
