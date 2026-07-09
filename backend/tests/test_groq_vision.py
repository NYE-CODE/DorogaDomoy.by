"""Тесты валидации фото для Groq AI."""
from integrations.groq_vision import _photo_reject_error


def test_reject_not_animal():
    assert _photo_reject_error({"is_animal": False, "reject_reason": "not_animal"}) == "not_animal"


def test_reject_unclear():
    assert _photo_reject_error({"is_animal": False, "reject_reason": "unclear"}) == "photo_unclear"


def test_accept_animal():
    assert _photo_reject_error({"is_animal": True, "animal_type": "dog"}) is None
