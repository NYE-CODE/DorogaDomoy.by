"""Тесты архивации связанных объявлений при удалении профиля питомца."""
import inspect
import os

os.environ.setdefault("SECRET_KEY", "unit-test-secret-key-for-profile-pet-delete")

from routers import profile_pets as profile_pets_mod


def test_delete_profile_pet_accepts_archive_linked_ads_query():
    sig = inspect.signature(profile_pets_mod.delete_profile_pet)
    assert "archive_linked_ads" in sig.parameters
    param = sig.parameters["archive_linked_ads"]
    assert param.default is not inspect.Parameter.empty
