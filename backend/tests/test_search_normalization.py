"""Тесты нормализации поисковых запросов и синонимов animal_type."""
import os

os.environ.setdefault("SECRET_KEY", "unit-test-secret-key-for-search-normalization")

from sqlalchemy import select

from models import Pet
from routers.pets import _apply_pet_list_filters
from search_normalization import (
    normalize_search_query,
    resolve_animal_type_from_search,
)


def test_resolve_kot_to_cat():
    assert resolve_animal_type_from_search("кот") == "cat"
    assert resolve_animal_type_from_search("Кошка") == "cat"
    assert resolve_animal_type_from_search("  CAT  ") == "cat"


def test_resolve_schenok_to_dog():
    assert resolve_animal_type_from_search("щенок") == "dog"
    assert resolve_animal_type_from_search("щен") == "dog"
    assert resolve_animal_type_from_search("собака") == "dog"


def test_unknown_phrase_not_mapped():
    assert resolve_animal_type_from_search("рыжий кот на улице") is None
    assert resolve_animal_type_from_search("") is None


def test_normalize_lowercases():
    assert normalize_search_query("  Минск ") == "минск"


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


def test_search_kot_matches_animal_type_cat_in_sql():
    """Запрос «кот» добавляет OR animal_type = 'cat' к текстовому ILIKE."""
    stmt = _apply_pet_list_filters(select(Pet), **_kwargs(search="кот"))
    sql = str(stmt.compile(compile_kwargs={"literal_binds": True})).lower()
    assert "animal_type" in sql
    assert "cat" in sql
    assert "description" in sql


def test_search_free_text_does_not_force_animal_type():
    stmt = _apply_pet_list_filters(select(Pet), **_kwargs(search="рыжий"))
    sql = str(stmt.compile(compile_kwargs={"literal_binds": True})).lower()
    assert "рыжий" in sql
    # Не должно быть равенства animal_type из синонима
    assert "animal_type" not in sql or "= 'cat'" not in sql
