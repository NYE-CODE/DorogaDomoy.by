import { api, uploadMultipart } from '@/shared/api/http';
import { resolvePhotoUrl } from '@/shared/api/api-utils';

export interface ProfilePetResponse {
  id: string;
  owner_id: string;
  name: string;
  species: string;
  breed?: string | null;
  gender: string;
  age?: string | null;
  colors: string[];
  special_marks?: string | null;
  is_chipped: boolean;
  chip_number?: string | null;
  registration_authority?: string | null;
  registration_token_number?: string | null;
  medical_info?: string | null;
  temperament?: string | null;
  responds_to_name: boolean;
  favorite_treats?: string | null;
  favorite_walks?: string | null;
  photos: string[];
  created_at: string;
  updated_at: string;
  owner_name?: string | null;
  owner_phone?: string | null;
  owner_email?: string | null;
  owner_city?: string | null;
  owner_viber?: string | null;
  /** Привязан ли Telegram у владельца (нужен для кнопки «Я нашёл питомца») */
  owner_telegram_linked?: boolean;
}

export interface ProfilePetInput {
  name: string;
  species: string;
  breed?: string;
  gender: string;
  age?: string;
  colors: string[];
  special_marks?: string;
  is_chipped: boolean;
  chip_number?: string;
  registration_authority?: string;
  registration_token_number?: string;
  medical_info?: string;
  temperament?: string;
  responds_to_name: boolean;
  favorite_treats?: string;
  favorite_walks?: string;
  photos: string[];
}

export interface ProfilePetFoundSignalResponse {
  accepted: boolean;
  throttled: boolean;
  telegram_sent: boolean;
  detail: string;
}

function resolveProfilePetPhotos(p: ProfilePetResponse): ProfilePetResponse {
  return { ...p, photos: p.photos.map(resolvePhotoUrl) };
}

export const profilePetsApi = {
  list: (params?: { owner_id?: string }) => {
    const q = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => v != null && q.set(k, String(v)));
    return api<ProfilePetResponse[]>(`/profile-pets?${q}`).then((arr) => arr.map(resolveProfilePetPhotos));
  },

  my: () =>
    api<ProfilePetResponse[]>('/profile-pets/my').then((arr) => arr.map(resolveProfilePetPhotos)),

  get: (id: string) =>
    api<ProfilePetResponse>(`/profile-pets/${id}`).then(resolveProfilePetPhotos),

  create: (data: ProfilePetInput) =>
    api<ProfilePetResponse>('/profile-pets', {
      method: 'POST',
      body: JSON.stringify(data),
    }).then(resolveProfilePetPhotos),

  uploadPhoto: async (file: File) => {
    const res = await uploadMultipart('/profile-pets/upload-photo', file, {
      tooLargeMessage: 'Файл слишком большой. Уменьшите фото и попробуйте снова.',
      errorFallback: 'Не удалось загрузить фото',
    });
    const data = (await res.json()) as { photo: string };
    return resolvePhotoUrl(data.photo);
  },

  update: (id: string, data: Partial<ProfilePetInput>) =>
    api<ProfilePetResponse>(`/profile-pets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }).then(resolveProfilePetPhotos),

  sendFoundSignal: (id: string, source: 'qr' | 'nfc' | 'unknown' = 'unknown') =>
    api<ProfilePetFoundSignalResponse>(
      `/profile-pets/${id}/found-signal?source=${encodeURIComponent(source)}`,
      { method: 'POST' }
    ),

  delete: (id: string, opts?: { archiveLinkedAds?: boolean }) => {
    const q = opts?.archiveLinkedAds ? '?archive_linked_ads=true' : '';
    return api<void>(`/profile-pets/${id}${q}`, { method: 'DELETE' });
  },
};

