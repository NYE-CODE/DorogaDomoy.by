"""Тесты хранения исходного возраста (approximate_age_raw)."""
from schemas import PET_DESCRIPTION_MIN_LENGTH, PetCreate


def test_pet_create_keeps_approximate_age_raw():
    pet = PetCreate(
        photos=["https://example.com/a.jpg"],
        animal_type="cat",
        description="x" * PET_DESCRIPTION_MIN_LENGTH,
        city="Минск",
        location={"lat": 53.9, "lng": 27.5},
        approximate_age="более 2 года",
        approximate_age_raw="3 года 2 месяца",
    )
    assert pet.approximate_age == "более 2 года"
    assert pet.approximate_age_raw == "3 года 2 месяца"


def test_pet_create_age_raw_optional():
    pet = PetCreate(
        photos=["https://example.com/a.jpg"],
        animal_type="dog",
        description="y" * PET_DESCRIPTION_MIN_LENGTH,
        city="Минск",
        location={"lat": 53.9, "lng": 27.5},
    )
    assert pet.approximate_age_raw is None
