import { Pet } from '../types/pet';
import { API_BASE } from '../api/client';
import type { ShelterAnimalFocus, ShelterKind, ShelterResponse } from '../api/client';
import { PLACEHOLDER_PET_96 } from '../utils/placeholder-images';

export const ADMIN_PLACEHOLDER_PHOTO = PLACEHOLDER_PET_96;

export function getAdminPetPreviewPhoto(pet: Pet): string {
  const first = pet.photos?.[0];
  return first || ADMIN_PLACEHOLDER_PHOTO;
}

export function shelterLogoPreview(url?: string | null): string {
  if (!url) return ADMIN_PLACEHOLDER_PHOTO;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${API_BASE}${url}`;
}

export type ShelterCatalogStatusLabels = {
  statusDraft: string;
  statusPending: string;
  statusApproved: string;
  statusRejected: string;
  statusHidden: string;
};

export function shelterCatalogStatusLabel(
  st: ShelterResponse['moderation_status'],
  sc: ShelterCatalogStatusLabels,
): string {
  switch (st) {
    case 'draft':
      return sc.statusDraft;
    case 'pending':
      return sc.statusPending;
    case 'approved':
      return sc.statusApproved;
    case 'rejected':
      return sc.statusRejected;
    case 'hidden':
    default:
      return sc.statusHidden;
  }
}

export type ShelterKindLabels = {
  kindFoster: string;
  kindOther: string;
  kindShelter: string;
};

export type ShelterFocusLabels = {
  focusDogs: string;
  focusCats: string;
  focusMixed: string;
};

export function shelterKindLabel(kind: ShelterKind | string, s: ShelterKindLabels): string {
  switch (kind) {
    case 'foster':
      return s.kindFoster;
    case 'other':
    case 'vet':
      return s.kindOther;
    case 'shelter':
    default:
      return s.kindShelter;
  }
}

export function shelterAnimalFocusAdminLabel(
  focus: ShelterAnimalFocus | string,
  s: ShelterFocusLabels,
): string {
  switch (focus) {
    case 'dogs':
      return s.focusDogs;
    case 'cats':
      return s.focusCats;
    case 'mixed':
    default:
      return s.focusMixed;
  }
}
