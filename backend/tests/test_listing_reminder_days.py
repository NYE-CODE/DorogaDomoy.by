"""Парсинг дней напоминаний и lifecycle с настройками."""
from datetime import timedelta
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from listing_lifecycle import (
    LISTING_EXPIRED_ARCHIVE_REASON,
    get_listing_reminder_days,
    parse_listing_reminder_days,
    run_listing_lifecycle,
)
from time_utils import utc_now


class _ScalarResult:
    def __init__(self, items):
        self._items = items

    def all(self):
        return self._items


def test_parse_listing_reminder_days_defaults():
    assert parse_listing_reminder_days(None) == (3, 1)
    assert parse_listing_reminder_days("") == (3, 1)
    assert parse_listing_reminder_days("garbage") == (3, 1)


def test_parse_listing_reminder_days_custom():
    assert parse_listing_reminder_days("7,3,1") == (7, 3, 1)
    assert parse_listing_reminder_days("1, 7 , 3") == (7, 3, 1)
    assert parse_listing_reminder_days("7,7,3") == (7, 3)


def test_get_listing_reminder_days_from_db():
    db = MagicMock()
    with patch("platform_settings.get_setting_value", return_value="5,2"):
        assert get_listing_reminder_days(db) == (5, 2)


def test_run_listing_lifecycle_archives_expired_pet():
    now = utc_now()
    pet = SimpleNamespace(
        id="pet-expired",
        author_id="user-1",
        animal_type="cat",
        status="searching",
        breed=None,
        city="Минск",
        expires_at=now - timedelta(hours=1),
        published_at=now - timedelta(days=100),
        is_archived=False,
        archive_reason=None,
        updated_at=None,
        pet_scope="lost_found",
        moderation_status="approved",
    )

    db = MagicMock()
    db.scalars.return_value = _ScalarResult([pet])
    db.scalar.return_value = None

    with patch("listing_lifecycle.get_listing_reminder_days", return_value=(3, 1)):
        stats = run_listing_lifecycle(db)

    assert stats["archived"] == 1
    assert pet.is_archived is True
    assert pet.archive_reason == LISTING_EXPIRED_ARCHIVE_REASON
    db.commit.assert_called()


def test_run_listing_lifecycle_backfills_legacy_expires_at():
    now = utc_now()
    pet = SimpleNamespace(
        id="pet-legacy",
        author_id="user-1",
        animal_type="dog",
        status="searching",
        breed="лабрадор",
        city="Гродно",
        expires_at=None,
        published_at=now - timedelta(days=200),
        is_archived=False,
        archive_reason=None,
        updated_at=None,
        pet_scope="lost_found",
        moderation_status="approved",
    )

    db = MagicMock()
    db.scalars.return_value = _ScalarResult([pet])
    db.scalar.return_value = None

    with patch("listing_lifecycle.get_listing_reminder_days", return_value=(7, 3)):
        stats = run_listing_lifecycle(db)

    assert stats["backfilled_expires_at"] == 1
    assert pet.expires_at is not None
    assert pet.expires_at > now
    assert stats["archived"] == 0
    db.commit.assert_called()
