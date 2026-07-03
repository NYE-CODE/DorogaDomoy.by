/**
 * Слоты фото профиля питомца (не объявления).
 * Порядок индексов фиксирован — для будущего ИИ-сопоставления.
 *
 * Контракт API: backend/profile_pet_photo_slots.py (длина 6, пустые слоты — "").
 */
export const PROFILE_PET_PHOTO_SLOT_IDS = [
  'face_front',
  'profile_left',
  'profile_right',
  'full_body',
  'special_mark_1',
  'special_mark_2',
] as const;

export type ProfilePetPhotoSlotId = (typeof PROFILE_PET_PHOTO_SLOT_IDS)[number];

export const PROFILE_PET_PHOTO_SLOT_COUNT = PROFILE_PET_PHOTO_SLOT_IDS.length;

export function emptyProfilePetPhotoSlots(): (string | null)[] {
  return Array.from({ length: PROFILE_PET_PHOTO_SLOT_COUNT }, () => null);
}

/** Пустой массив для формы: 6 позиций, пустые — "". */
export function emptyStoredProfilePetPhotos(): string[] {
  return storedPhotosFromSlots(emptyProfilePetPhotoSlots());
}

/**
 * Загрузка из API.
 * — 6 элементов → слот-выровненный формат (с пустыми строками).
 * — иначе → legacy: фото по порядку в первые слоты.
 */
export function slotsFromStoredPhotos(photos: string[] | null | undefined): (string | null)[] {
  const slots = emptyProfilePetPhotoSlots();
  const list = photos ?? [];
  if (!list.length) return slots;

  if (list.length === PROFILE_PET_PHOTO_SLOT_COUNT) {
    return list.map((url) => {
      const trimmed = (url ?? '').trim();
      return trimmed ? trimmed : null;
    });
  }

  for (let i = 0; i < Math.min(list.length, PROFILE_PET_PHOTO_SLOT_COUNT); i++) {
    const trimmed = (list[i] ?? '').trim();
    if (trimmed) slots[i] = trimmed;
  }
  return slots;
}

/** Сохранение в API: всегда 6 позиций, пустые слоты — "". */
export function storedPhotosFromSlots(slots: readonly (string | null)[]): string[] {
  return PROFILE_PET_PHOTO_SLOT_IDS.map((_, index) => {
    const trimmed = (slots[index] ?? '').trim();
    return trimmed ? trimmed : '';
  });
}

export function countFilledProfilePetPhotoSlots(slots: readonly (string | null)[] | string[]): number {
  if (typeof slots[0] === 'string' && slots.length === PROFILE_PET_PHOTO_SLOT_COUNT) {
    return (slots as string[]).filter((url) => url.trim()).length;
  }
  return (slots as (string | null)[]).filter((url) => url?.trim()).length;
}

/** Галерея для отображения (без пустых позиций). */
export function getProfilePetGalleryPhotos(photos: string[] | null | undefined): string[] {
  return (photos ?? []).map((url) => url.trim()).filter(Boolean);
}

/** Главное фото: анфас (слот 0) или первое непустое. */
export function getProfilePetPrimaryPhoto(photos: string[] | null | undefined): string {
  const slots = slotsFromStoredPhotos(photos);
  const face = slots[0]?.trim();
  if (face) return face;
  return getProfilePetGalleryPhotos(photos)[0] ?? '';
}
