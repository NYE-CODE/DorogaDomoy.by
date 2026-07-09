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
        is_archived=False,
        archive_reason=None,
        updated_at=None,
        pet_scope="lost_found",
        moderation_status="approved",
    )

    db = MagicMock()
    # Первый scalars().all() — активные объявления; остальные — пусто/None
    db.scalars.return_value = _ScalarResult([pet])
    db.scalar.return_value = None  # author not found → skip telegram

    stats = run_listing_lifecycle(db)

    assert stats["archived"] == 1
    assert pet.is_archived is True
    assert pet.archive_reason == LISTING_EXPIRED_ARCHIVE_REASON
    db.commit.assert_called()


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
