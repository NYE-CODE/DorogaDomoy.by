import { api } from '@/shared/api/http';
import type { PaginatedList, ShelterPetInput, ShelterPetUpdateInput } from '@/shared/api/pets';
import { toPetFromShelter, type ShelterPetResponse } from '@/shared/api/pets';

/** Приюты / передержки (владелец — пользователь с ролью shelter; модерация админом). */
export type ShelterKind = 'shelter' | 'foster' | 'other';
/** Кому оказывается помощь: собаки, кошки или оба вида. */
export type ShelterAnimalFocus = 'dogs' | 'cats' | 'mixed';
export type ShelterModerationStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'hidden';

export interface ShelterContacts {
  phone?: string;
  telegram?: string;
  website?: string;
  email?: string;
}

export interface ShelterResponse {
  id: string;
  name: string;
  kind: ShelterKind;
  animal_focus: ShelterAnimalFocus;
  description?: string | null;
  city: string;
  address?: string | null;
  location_lat: number;
  location_lng: number;
  contacts: ShelterContacts;
  logo_url?: string | null;
  /** Широкое изображение-шапка публичной страницы приюта */
  cover_url?: string | null;
  moderation_status: ShelterModerationStatus;
  moderation_reason?: string | null;
  moderated_at?: string | null;
  moderated_by?: string | null;
  owner_user_id: string;
  created_at: string;
  updated_at: string;
}

export type ShelterMemberRole = 'owner' | 'manager' | 'volunteer';
export type ShelterMemberStatus = 'invited' | 'active' | 'removed';

export interface ShelterMemberResponse {
  id: string;
  shelter_id: string;
  user_id: string;
  role: ShelterMemberRole;
  status: ShelterMemberStatus;
  invited_by_user_id?: string | null;
  joined_at?: string | null;
  removed_at?: string | null;
  created_at: string;
  updated_at: string;
  user_name?: string | null;
  user_email?: string | null;
  user_avatar?: string | null;
}

export interface ShelterSubscriptionStatus {
  subscriber_count: number;
  subscribed: boolean;
}

export const sheltersApi = {
  list: (params?: { city?: string; limit?: number; offset?: number }) => {
    const q = new URLSearchParams();
    if (params?.city?.trim()) q.set('city', params.city.trim());
    if (params?.limit != null) q.set('limit', String(params.limit));
    if (params?.offset != null) q.set('offset', String(params.offset));
    const suffix = q.toString() ? `?${q}` : '';
    return api<PaginatedList<ShelterResponse>>(`/shelters${suffix}`).then((page) => page.items);
  },
  get: (id: string) => api<ShelterResponse>(`/shelters/${encodeURIComponent(id)}`),
  subscriptionStatus: (id: string) =>
    api<ShelterSubscriptionStatus>(
      `/shelters/${encodeURIComponent(id)}/subscription-status`,
    ),
  subscribe: (id: string) =>
    api<{ ok: boolean }>(`/shelters/${encodeURIComponent(id)}/subscribe`, { method: 'POST' }),
  unsubscribe: (id: string) =>
    api<void>(`/shelters/${encodeURIComponent(id)}/subscribe`, { method: 'DELETE' }),
  mine: () => api<ShelterResponse[]>('/shelters/me'),
  adminPending: () => api<ShelterResponse[]>('/shelters/admin/pending'),
  adminListAll: () => api<ShelterResponse[]>('/shelters/admin/all'),
  adminDelete: (id: string) =>
    api<void>(`/shelters/admin/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  create: (data: {
    name: string;
    kind?: ShelterKind;
    animal_focus?: ShelterAnimalFocus;
    description?: string;
    city: string;
    address?: string;
    location_lat: number;
    location_lng: number;
    contacts?: ShelterContacts;
    logo_url?: string;
    cover_url?: string;
    owner_user_id?: string;
  }) =>
    api<ShelterResponse>('/shelters', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<{
    name: string;
    kind: ShelterKind;
    animal_focus: ShelterAnimalFocus;
    description: string | null;
    city: string;
    address: string | null;
    location_lat: number;
    location_lng: number;
    contacts: ShelterContacts;
    logo_url: string | null;
    cover_url: string | null;
  }>) =>
    api<ShelterResponse>(`/shelters/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  submit: (id: string) =>
    api<ShelterResponse>(`/shelters/${encodeURIComponent(id)}/submit`, { method: 'POST' }),
  moderate: (id: string, body: { action: 'approve' | 'reject' | 'hide'; reason?: string }) =>
    api<ShelterResponse>(`/shelters/${encodeURIComponent(id)}/moderate`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  members: (id: string) =>
    api<ShelterMemberResponse[]>(`/shelters/${encodeURIComponent(id)}/members`),
  inviteMember: (
    id: string,
    body: { role: 'manager' | 'volunteer'; user_id?: string; email?: string },
  ) =>
    api<ShelterMemberResponse>(`/shelters/${encodeURIComponent(id)}/members/invite`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  acceptMemberInvite: (id: string, membershipId: string) =>
    api<ShelterMemberResponse>(
      `/shelters/${encodeURIComponent(id)}/members/${encodeURIComponent(membershipId)}/accept`,
      { method: 'POST' },
    ),
  updateMember: (
    id: string,
    membershipId: string,
    body: { role?: ShelterMemberRole; status?: ShelterMemberStatus },
  ) =>
    api<ShelterMemberResponse>(
      `/shelters/${encodeURIComponent(id)}/members/${encodeURIComponent(membershipId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(body),
      },
    ),
  removeMember: (id: string, membershipId: string) =>
    api<ShelterMemberResponse>(
      `/shelters/${encodeURIComponent(id)}/members/${encodeURIComponent(membershipId)}`,
      { method: 'DELETE' },
    ),
  listPets: (id: string, params?: { is_archived?: boolean; adoption_status?: string; limit?: number; offset?: number }) => {
    const q = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => v != null && q.set(k, String(v)));
    const suffix = q.toString() ? `?${q}` : '';
    return api<ShelterPetResponse[]>(`/shelters/${encodeURIComponent(id)}/pets${suffix}`).then((arr) => arr.map(toPetFromShelter));
  },
  createPet: (id: string, data: ShelterPetInput) => {
    const body: Record<string, unknown> = {
      photos: data.photos,
      nickname: data.nickname,
      animal_type: data.animalType,
      breed: data.breed,
      colors: data.colors,
      gender: data.gender,
      approximate_age: data.approximateAge,
      description: data.description,
      city: data.city,
      location: data.location,
      contacts: data.contacts,
      health_status: data.healthStatus,
      coat_type: data.coatType,
      adoption_status: data.adoptionStatus,
      is_published: data.isPublished ?? true,
      energy_level: data.energyLevel,
      friendliness_level: data.friendlinessLevel,
      training_level: data.trainingLevel,
      independence_level: data.independenceLevel,
      good_with_kids: data.goodWithKids,
      good_with_dogs: data.goodWithDogs,
      good_with_cats: data.goodWithCats,
    };
    const cra = data.registrationAuthority?.trim();
    const crt = data.registrationTokenNumber?.trim();
    if (cra) body.registration_authority = cra;
    if (crt) body.registration_token_number = crt;
    if (data.author_name != null && data.author_name.trim() !== '') body.author_name = data.author_name.trim();
    return api<ShelterPetResponse>(`/shelters/${encodeURIComponent(id)}/pets`, {
      method: 'POST',
      body: JSON.stringify(body),
    }).then(toPetFromShelter);
  },
};

export const shelterPetsApi = {
  catalog: (params?: {
    adoption_status?: string;
    limit?: number;
    offset?: number;
  }) => {
    const q = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => v != null && q.set(k, String(v)));
    }
    const suffix = q.toString() ? `?${q}` : '';
    return api<ShelterPetResponse[]>(`/shelter-pets/catalog${suffix}`).then((arr) =>
      arr.map(toPetFromShelter),
    );
  },
  update: (petId: string, data: ShelterPetUpdateInput) => {
    const body: Record<string, unknown> = {};
    if (data.photos != null) body.photos = data.photos;
    if (data.nickname != null) body.nickname = data.nickname;
    if (data.animalType != null) body.animal_type = data.animalType;
    if (data.breed != null) body.breed = data.breed;
    if (data.colors != null) body.colors = data.colors;
    if (data.gender != null) body.gender = data.gender;
    if (data.approximateAge != null) body.approximate_age = data.approximateAge;
    if (data.description != null) body.description = data.description;
    if (data.city != null) body.city = data.city;
    if (data.location != null) body.location = data.location;
    if (data.contacts != null) body.contacts = data.contacts;
    if (data.healthStatus != null) body.health_status = data.healthStatus;
    if (data.coatType != null) body.coat_type = data.coatType;
    if (data.energyLevel != null) body.energy_level = data.energyLevel;
    if (data.friendlinessLevel != null) body.friendliness_level = data.friendlinessLevel;
    if (data.trainingLevel != null) body.training_level = data.trainingLevel;
    if (data.independenceLevel != null) body.independence_level = data.independenceLevel;
    if (data.goodWithKids != null) body.good_with_kids = data.goodWithKids;
    if (data.goodWithDogs != null) body.good_with_dogs = data.goodWithDogs;
    if (data.goodWithCats != null) body.good_with_cats = data.goodWithCats;
    if (data.isArchived != null) body.is_archived = data.isArchived;
    if (data.archiveReason != null) body.archive_reason = data.archiveReason;
    if (data.adoptionStatus != null) body.adoption_status = data.adoptionStatus;
    if (data.isPublished != null) body.is_published = data.isPublished;
    if (data.registrationAuthority !== undefined) {
      body.registration_authority = data.registrationAuthority?.trim() || null;
    }
    if (data.registrationTokenNumber !== undefined) {
      body.registration_token_number = data.registrationTokenNumber?.trim() || null;
    }
    return api<ShelterPetResponse>(`/shelter-pets/${encodeURIComponent(petId)}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }).then(toPetFromShelter);
  },
  archive: (petId: string, reason?: string) =>
    api<ShelterPetResponse>(`/shelter-pets/${encodeURIComponent(petId)}/archive`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }).then(toPetFromShelter),
  publish: (petId: string) =>
    api<ShelterPetResponse>(`/shelter-pets/${encodeURIComponent(petId)}/publish`, {
      method: 'POST',
    }).then(toPetFromShelter),
};

export type ShelterCampaignStatus = 'draft' | 'active' | 'completed' | 'cancelled';

export interface ShelterCampaignResponse {
  id: string;
  pet_id: string;
  shelter_id: string;
  title: string;
  description?: string | null;
  help_details?: string | null;
  goal_amount: number;
  collected_amount: number;
  status: ShelterCampaignStatus;
  starts_at?: string | null;
  ends_at?: string | null;
  closed_at?: string | null;
  close_reason?: string | null;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export const campaignsApi = {
  listByPet: (petId: string) =>
    api<ShelterCampaignResponse[]>(`/shelter-pets/${encodeURIComponent(petId)}/campaigns`),
  createForPet: (
    petId: string,
    data: { title: string; description?: string; help_details: string; goal_amount: number; ends_at?: string | null },
  ) =>
    api<ShelterCampaignResponse>(`/shelter-pets/${encodeURIComponent(petId)}/campaigns`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (
    campaignId: string,
    data: Partial<{ title: string; description: string | null; help_details: string; goal_amount: number; ends_at: string | null }>,
  ) =>
    api<ShelterCampaignResponse>(`/shelter-campaigns/${encodeURIComponent(campaignId)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  activate: (campaignId: string) =>
    api<ShelterCampaignResponse>(`/shelter-campaigns/${encodeURIComponent(campaignId)}/activate`, {
      method: 'POST',
    }),
  close: (campaignId: string, data: { action: 'completed' | 'cancelled'; collected_amount: number; close_reason: string }) =>
    api<ShelterCampaignResponse>(`/shelter-campaigns/${encodeURIComponent(campaignId)}/close`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCollected: (campaignId: string, collectedAmount: number) =>
    api<ShelterCampaignResponse>(`/shelter-campaigns/${encodeURIComponent(campaignId)}/collected`, {
      method: 'POST',
      body: JSON.stringify({ collected_amount: collectedAmount }),
    }),
};
