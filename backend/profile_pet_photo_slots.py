"""
Семантика photos[] для профиля питомца (адресник / QR), не для объявлений.

Держать в синхроне с src/shared/lib/profile-pet-photo-slots.ts

Индексы массива (всегда длина 6 после нормализации, пустые слоты — ""):
  0 — face_front      анфас
  1 — profile_left    профиль слева
  2 — profile_right   профиль справа
  3 — full_body       в полный рост
  4 — special_mark_1  особая примета крупно
  5 — special_mark_2  особая примета крупно

При создании и при полной замене photos в PATCH — минимум 1 непустой элемент.
"""

PROFILE_PET_PHOTO_SLOT_IDS = (
    "face_front",
    "profile_left",
    "profile_right",
    "full_body",
    "special_mark_1",
    "special_mark_2",
)
PROFILE_PET_PHOTO_SLOT_COUNT = len(PROFILE_PET_PHOTO_SLOT_IDS)

PHOTOS_MIN_FILLED = 1
PHOTOS_TOO_MANY_MSG = f"Не более {PROFILE_PET_PHOTO_SLOT_COUNT} фото"
PHOTOS_REQUIRED_MSG = "Добавьте хотя бы одно фото питомца"

PROFILE_PET_PHOTOS_FIELD_DESCRIPTION = (
    "Фиксированные 6 слотов: 0=анфас, 1=профиль слева, 2=профиль справа, "
    "3=полный рост, 4–5=особые приметы. Пустые слоты — пустая строка."
)


def count_filled_profile_pet_photos(raw: list[str] | None) -> int:
    if not raw:
        return 0
    return sum(1 for ph in raw[:PROFILE_PET_PHOTO_SLOT_COUNT] if str(ph).strip())


def validate_profile_pet_photos_raw(raw: list[str] | None) -> list[str]:
    """Проверка длины и минимума заполненных слотов. ValueError при нарушении."""
    items = raw if raw is not None else []
    if len(items) > PROFILE_PET_PHOTO_SLOT_COUNT:
        raise ValueError(PHOTOS_TOO_MANY_MSG)
    if count_filled_profile_pet_photos(items) < PHOTOS_MIN_FILLED:
        raise ValueError(PHOTOS_REQUIRED_MSG)
    return items


def pad_profile_pet_photos(slots: list[str]) -> list[str]:
    """Дополнить до PROFILE_PET_PHOTO_SLOT_COUNT пустыми строками."""
    out = list(slots[:PROFILE_PET_PHOTO_SLOT_COUNT])
    while len(out) < PROFILE_PET_PHOTO_SLOT_COUNT:
        out.append("")
    return out
