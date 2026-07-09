"""Трейсинг создания объявления из карточки питомца."""
from pet_create_trace import (
    collect_empty_pet_create_fields,
    format_pet_created_from_profile_log,
)
from schemas import PET_DESCRIPTION_MIN_LENGTH, PetCreate


def _create(**overrides) -> PetCreate:
    base = {
        "photos": ["https://example.com/a.jpg"],
        "animal_type": "cat",
        "description": "x" * PET_DESCRIPTION_MIN_LENGTH,
        "city": "Минск",
        "location": {"lat": 53.9, "lng": 27.5},
    }
    base.update(overrides)
    return PetCreate(**base)


def test_collect_empty_fields_flags_search_gaps():
    data = _create()
    empty = collect_empty_pet_create_fields(data)
    assert "breed" in empty
    assert "colors" in empty
    assert "gender" in empty
    assert "approximate_age" in empty
    assert "approximate_age_raw" in empty
    assert "description_minimal" in empty


def test_collect_empty_fields_omits_filled():
    data = _create(
        breed="дворняга",
        colors=["black"],
        gender="female",
        approximate_age="young",
        approximate_age_raw="1.5",
        description="Подробное описание пропавшего кота с приметами " + ("y" * 10),
    )
    assert collect_empty_pet_create_fields(data) == []


def test_format_log_line_includes_ids_and_fields():
    line = format_pet_created_from_profile_log(
        profile_pet_id="pp-1",
        pet_id="pet-abc",
        empty_fields=["breed", "colors"],
    )
    assert "pet_created_from_profile" in line
    assert "profile_pet_id=pp-1" in line
    assert "pet_id=pet-abc" in line
    assert "empty_fields=breed,colors" in line


def test_format_log_line_empty_dash():
    line = format_pet_created_from_profile_log(
        profile_pet_id="pp-1",
        pet_id="pet-abc",
        empty_fields=[],
    )
    assert "empty_fields=-" in line
