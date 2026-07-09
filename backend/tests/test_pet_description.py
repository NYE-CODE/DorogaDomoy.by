"""Тесты минимальной длины описания объявления."""
import pytest
from pydantic import ValidationError

from schemas import PET_DESCRIPTION_MIN_LENGTH, PetCreate, PetUpdate


def _minimal_create(**overrides):
    base = {
        "photos": ["https://example.com/a.jpg"],
        "animal_type": "cat",
        "description": "x" * PET_DESCRIPTION_MIN_LENGTH,
        "city": "Минск",
        "location": {"lat": 53.9, "lng": 27.5},
    }
    base.update(overrides)
    return PetCreate(**base)


def test_pet_create_rejects_short_description():
    with pytest.raises(ValidationError) as exc:
        _minimal_create(description="коротко")
    msgs = " ".join(err["msg"] for err in exc.value.errors())
    assert str(PET_DESCRIPTION_MIN_LENGTH) in msgs
    assert any("description" in err.get("loc", ()) for err in exc.value.errors())


def test_pet_create_rejects_empty_description():
    with pytest.raises(ValidationError):
        _minimal_create(description="   ")


def test_pet_create_accepts_min_length():
    pet = _minimal_create(description="а" * PET_DESCRIPTION_MIN_LENGTH)
    assert len(pet.description) == PET_DESCRIPTION_MIN_LENGTH


def test_pet_create_strips_description():
    raw = "  " + ("б" * PET_DESCRIPTION_MIN_LENGTH) + "  "
    pet = _minimal_create(description=raw)
    assert pet.description == "б" * PET_DESCRIPTION_MIN_LENGTH


def test_pet_update_rejects_short_description_when_set():
    with pytest.raises(ValidationError):
        PetUpdate(description="test")


def test_pet_update_allows_omitting_description():
    upd = PetUpdate(city="Гродно")
    assert upd.description is None
