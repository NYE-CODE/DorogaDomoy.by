import {
  API_BASE,
  type ShelterAnimalFocus,
  type ShelterContacts,
  type ShelterKind,
  type ShelterResponse,
} from '../api/client';
import { DEFAULT_CITY, findCityByName } from './cities';

export const SHELTER_FORM_STEPS = 4;

export function defaultsFromSelectedCity(selectedCity: string): {
  city: string;
  lat: number;
  lng: number;
} {
  const trimmed = selectedCity.trim();
  if (!trimmed) {
    return { city: DEFAULT_CITY.name, lat: DEFAULT_CITY.coordinates[0], lng: DEFAULT_CITY.coordinates[1] };
  }
  const found = findCityByName(trimmed);
  if (found) {
    return { city: found.name, lat: found.coordinates[0], lng: found.coordinates[1] };
  }
  return { city: trimmed, lat: DEFAULT_CITY.coordinates[0], lng: DEFAULT_CITY.coordinates[1] };
}

/** Шапка страницы: ограничиваем по ширине и высоте, сохраняя пропорции (широкий баннер). */
export function compressShelterCover(
  file: File,
  maxW = 1680,
  maxH = 520,
  quality = 0.82,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      const ratio = Math.min(maxW / width, maxH / height, 1);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('image'));
    };
    img.src = URL.createObjectURL(file);
  });
}

export function compressLogo(file: File, maxDim = 640, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('image'));
    };
    img.src = URL.createObjectURL(file);
  });
}

export function logoPreview(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${API_BASE}${url.startsWith('/') ? url : `/${url}`}`;
}

export function emptyForm(
  defaults: { city: string; lat: number; lng: number },
  contacts?: ShelterContacts | null,
): {
  name: string;
  kind: ShelterKind;
  animalFocus: ShelterAnimalFocus;
  description: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  telegram: string;
  website: string;
  email: string;
  logoDataUrl: string | null;
  coverDataUrl: string | null;
} {
  const c = contacts || {};
  return {
    name: '',
    kind: 'shelter',
    animalFocus: 'mixed',
    description: '',
    city: defaults.city,
    address: '',
    lat: defaults.lat,
    lng: defaults.lng,
    phone: (c.phone as string) || '',
    telegram: (c.telegram as string) || '',
    website: (c.website as string) || '',
    email: (c.email as string) || '',
    logoDataUrl: null,
    coverDataUrl: null,
  };
}

export function formFromShelter(s: ShelterResponse) {
  const c = s.contacts || {};
  return {
    name: s.name,
    kind: s.kind,
    animalFocus: s.animal_focus ?? 'mixed',
    description: s.description || '',
    city: s.city,
    address: s.address || '',
    lat: s.location_lat,
    lng: s.location_lng,
    phone: (c.phone as string) || '',
    telegram: (c.telegram as string) || '',
    website: (c.website as string) || '',
    email: (c.email as string) || '',
    logoDataUrl: null as string | null,
    existingLogo: s.logo_url ?? null,
    coverDataUrl: null as string | null,
    existingCover: s.cover_url ?? null,
  };
}

export type ShelterFormState = ReturnType<typeof emptyForm> & {
  existingLogo?: string | null;
  existingCover?: string | null;
};
