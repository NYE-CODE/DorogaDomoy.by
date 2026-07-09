import { api } from '@/shared/api/http';

export interface SightingItem {
  id: string;
  pet_id: string;
  location_lat: number;
  location_lng: number;
  seen_at: string;
  comment: string | null;
  has_contact: boolean;
  created_at: string;
}

export const sightingsApi = {
  create: (
    petId: string,
    data: { location_lat: number; location_lng: number; seen_at: string; comment?: string; contact?: string },
  ) =>
    api<SightingItem>(`/pets/${encodeURIComponent(petId)}/sightings`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listByPet: (petId: string, days = 7, init?: RequestInit) =>
    api<SightingItem[]>(`/pets/${encodeURIComponent(petId)}/sightings?days=${days}`, init),

  getCounts: (petIds: string[]) =>
    api<Record<string, number>>(`/pets/sightings/counts?pet_ids=${petIds.join(',')}`),
};

