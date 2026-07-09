"""Публичный GET /pets не отдаёт pending/rejected без прав."""
import os

# auth.py требует SECRET_KEY при импорте routers.pets
os.environ.setdefault("SECRET_KEY", "unit-test-secret-key-for-moderation-filters")

from types import SimpleNamespace

from sqlalchemy import select

from models import Pet
from routers.pets import _apply_pet_list_filters


def _kwargs(**overrides):
    base = dict(
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
    base.update(overrides)
    return base


def _sql(stmt) -> str:
    return str(stmt.compile(compile_kwargs={"literal_binds": True})).lower()


def test_anonymous_list_forces_approved_even_if_pending_requested():
    """Query-параметр moderation_status=pending не открывает чужие pending."""
    stmt = _apply_pet_list_filters(
        select(Pet),
        **_kwargs(moderation_status="pending", user=None),
    )
    sql = _sql(stmt)
    assert "moderation_status" in sql
    assert "approved" in sql
    assert "pending" not in sql


def test_anonymous_list_excludes_archived():
    stmt = _apply_pet_list_filters(select(Pet), **_kwargs())
    sql = _sql(stmt)
    assert "is_archived" in sql


def test_admin_can_filter_pending_explicitly():
    admin = SimpleNamespace(id="admin-1", role="admin")
    stmt = _apply_pet_list_filters(
        select(Pet),
        **_kwargs(moderation_status="pending", user=admin),
    )
    sql = _sql(stmt)
    assert "pending" in sql


def test_owner_viewing_own_ads_can_see_pending_with_flag():
    user = SimpleNamespace(id="user-1", role="user")
    stmt = _apply_pet_list_filters(
        select(Pet),
        **_kwargs(author_id="user-1", moderation_status="pending", user=user),
    )
    sql = _sql(stmt)
    assert "pending" in sql
