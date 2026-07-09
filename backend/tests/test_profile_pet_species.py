"""Строгий enum species для карточки питомца."""
import pytest
from pydantic import ValidationError

from schemas import ProfilePetCreate


def _minimal(**overrides):
    base = {
        "name": "Барсик",
        "species": "cat",
        "photos": ["https://example.com/a.jpg"],
    }
    base.update(overrides)
    return ProfilePetCreate(**base)


def test_profile_pet_species_accepts_dog_cat_other():
    assert _minimal(species="dog").species == "dog"
    assert _minimal(species="cat").species == "cat"
    assert _minimal(species="other").species == "other"


def test_profile_pet_species_rejects_free_text():
    with pytest.raises(ValidationError):
        _minimal(species="кот")
    with pytest.raises(ValidationError):
        _minimal(species="bird")
