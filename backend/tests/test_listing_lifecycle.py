"""Автоархивация просроченных объявлений (listing lifecycle)."""
from datetime import timedelta
from types import SimpleNamespace
from unittest.mock import MagicMock

from listing_lifecycle import LISTING_EXPIRED_ARCHIVE_REASON, run_listing_lifecycle
from time_utils import utc_now


class _ScalarResult:
    def __init__(self, items):
        self._items = items

    def all(self):
        return self._items


def _pet(**overrides):
    now = utc_now()
    base = dict(
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
    base.update(overrides)
    return SimpleNamespace(**base)


def test_run_listing_lifecycle_archives_expired_pet():
    pet = _pet()

    db = MagicMock()
    # Первый scalars().all() — активные объявления; остальные — пусто/None
    db.scalars.return_value = _ScalarResult([pet])
    db.scalar.return_value = None  # author not found → skip telegram

    stats = run_listing_lifecycle(db)

    assert stats["archived"] == 1
    assert pet.is_archived is True
    assert pet.archive_reason == LISTING_EXPIRED_ARCHIVE_REASON
    db.commit.assert_called()


def test_run_listing_lifecycle_archives_naive_sqlite_expires_at():
    """SQLite отдаёт naive datetime — сравнение с aware utc_now не должно падать."""
    # Наивный UTC, как из SQLite
    pet = _pet(expires_at=(utc_now() - timedelta(days=30)).replace(tzinfo=None))

    db = MagicMock()
    db.scalars.return_value = _ScalarResult([pet])
    db.scalar.return_value = None

    stats = run_listing_lifecycle(db)

    assert stats["archived"] == 1
    assert pet.is_archived is True
    assert pet.archive_reason == LISTING_EXPIRED_ARCHIVE_REASON


def test_run_listing_lifecycle_archives_long_overdue_pet():
    """Давно просроченные объявления архивируются сразу, без «grace»-продления."""
    pet = _pet(expires_at=utc_now() - timedelta(days=120))

    db = MagicMock()
    db.scalars.return_value = _ScalarResult([pet])
    db.scalar.return_value = None

    stats = run_listing_lifecycle(db)

    assert stats["archived"] == 1
    assert pet.is_archived is True
    assert "legacy_grace_applied" not in stats


def test_expired_archived_pet_excluded_from_public_list_sql():
    """После архивации публичный фильтр исключает is_archived."""
    import os

    os.environ.setdefault("SECRET_KEY", "unit-test-secret-key-for-lifecycle")
    from sqlalchemy import select

    from models import Pet
    from routers.pets import _apply_pet_list_filters

    stmt = _apply_pet_list_filters(
        select(Pet),
        animal_type=None,
        breed=None,
        city=None,
        status=None,
        statuses=None,
        days=None,
        moderation_status=None,
        is_archived=None,
        search=None,
        author_id=None,
        pet_scope=None,
        shelter_id=None,
        adoption_status=None,
        ids=None,
        north=None,
        south=None,
        east=None,
        west=None,
        user=None,
    )
    sql = str(stmt.compile(compile_kwargs={"literal_binds": True})).lower()
    assert "is_archived" in sql
    assert "false" in sql or "0" in sql
