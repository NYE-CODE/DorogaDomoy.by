"""Трейсинг создания объявлений (в т.ч. из карточки питомца)."""
from __future__ import annotations

from typing import Any, Sequence

from schemas import PET_DESCRIPTION_MIN_LENGTH, PetCreate


def collect_empty_pet_create_fields(data: PetCreate) -> list[str]:
    """Поля, важные для поиска, которые пусты / минимальны на момент создания."""
    empty: list[str] = []
    if not (data.breed or "").strip():
        empty.append("breed")
    if not data.colors:
        empty.append("colors")
    gender = (data.gender or "").strip().lower()
    if not gender or gender == "unknown":
        empty.append("gender")
    if not (data.approximate_age or "").strip():
        empty.append("approximate_age")
    raw_age = getattr(data, "approximate_age_raw", None)
    if not (raw_age or "").strip():
        empty.append("approximate_age_raw")
    description = (data.description or "").strip()
    if len(description) <= PET_DESCRIPTION_MIN_LENGTH:
        empty.append("description_minimal")
    return empty


def format_pet_created_from_profile_log(
    *,
    profile_pet_id: str,
    pet_id: str,
    empty_fields: Sequence[str],
) -> str:
    """Одна строка structured-лога для grep/аналитики."""
    fields = ",".join(empty_fields) if empty_fields else "-"
    return (
        "pet_created_from_profile "
        f"profile_pet_id={profile_pet_id} pet_id={pet_id} empty_fields={fields}"
    )


def empty_fields_from_mapping(payload: dict[str, Any]) -> list[str]:
    """Удобно для unit-тестов без полной сборки PetCreate."""
    return collect_empty_pet_create_fields(PetCreate(**payload))
