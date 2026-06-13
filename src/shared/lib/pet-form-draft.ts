import type { PetFormData } from '../../../components/pet-form';

const DRAFT_PREFIX = 'dd-pet-form-draft:';

export interface PetFormDraftPayload {
  formData: PetFormData;
  step: number;
  savedPhotoCount: number;
  savedAt: string;
}

function storageKey(userId: string): string {
  return `${DRAFT_PREFIX}${userId}`;
}

/** Черновик без фото (sessionStorage лимит ~5 МБ). */
export function savePetFormDraft(userId: string, payload: Omit<PetFormDraftPayload, 'savedAt'>): void {
  if (typeof window === 'undefined') return;
  try {
    const savedPhotoCount = payload.formData.photos.length;
    const toStore: PetFormDraftPayload = {
      formData: { ...payload.formData, photos: [] },
      step: payload.step,
      savedPhotoCount,
      savedAt: new Date().toISOString(),
    };
    sessionStorage.setItem(storageKey(userId), JSON.stringify(toStore));
  } catch (err: unknown) {
    console.warn('[pet-form-draft] save failed', err);
  }
}

export function loadPetFormDraft(userId: string): PetFormDraftPayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PetFormDraftPayload;
    if (!parsed?.formData || typeof parsed.step !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPetFormDraft(userId: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(storageKey(userId));
  } catch {
    /* ignore */
  }
}
