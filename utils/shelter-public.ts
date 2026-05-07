import type { ShelterAnimalFocus, ShelterKind } from '../api/client';
import { API_BASE } from '../api/client';

export type SheltersLandingCopy = {
  kindShelter: string;
  kindFoster: string;
  kindVet: string;
  kindOther: string;
  animalFocusDogs: string;
  animalFocusCats: string;
  animalFocusMixed: string;
};

export function shelterLogoSrc(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${API_BASE}${url.startsWith('/') ? url : `/${url}`}`;
}

export function shelterKindLabel(kind: ShelterKind, s: SheltersLandingCopy): string {
  switch (kind) {
    case 'foster':
      return s.kindFoster;
    case 'vet':
      return s.kindVet;
    case 'other':
      return s.kindOther;
    case 'shelter':
    default:
      return s.kindShelter;
  }
}

export function shelterAnimalFocusLabel(focus: ShelterAnimalFocus, s: SheltersLandingCopy): string {
  switch (focus) {
    case 'dogs':
      return s.animalFocusDogs;
    case 'cats':
      return s.animalFocusCats;
    case 'mixed':
    default:
      return s.animalFocusMixed;
  }
}
