"""Тесты опциональной связи pets.profile_pet_id."""
from schemas import PetCreate, PetResponse, PET_DESCRIPTION_MIN_LENGTH


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


def test_pet_create_accepts_optional_profile_pet_id():
    pet = _minimal_create(profile_pet_id="abc123")
    assert pet.profile_pet_id == "abc123"


def test_pet_create_profile_pet_id_defaults_none():
    pet = _minimal_create()
    assert pet.profile_pet_id is None


def test_pet_response_includes_profile_pet_id():
    from datetime import datetime, timezone

    now = datetime.now(timezone.utc)
    resp = PetResponse(
        id="pet-1",
        photos=[],
        animal_type="dog",
        description="y" * PET_DESCRIPTION_MIN_LENGTH,
        city="Минск",
        location={"lat": 53.9, "lng": 27.5},
        published_at=now,
        updated_at=now,
        author_id="u1",
        author_name="Test",
        profile_pet_id="pp-1",
    )
    assert resp.profile_pet_id == "pp-1"
