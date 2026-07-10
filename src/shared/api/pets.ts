import type { Pet } from '@/entities/pet/model/types';
import { api } from '@/shared/api/http';
import { parseApiDate, resolvePhotoUrl } from '@/shared/api/api-utils';

export interface PetResponse {
  id: string;
  photos: string[];
  animal_type: string;
  breed?: string;
  colors: string[];
  gender: string;
  approximate_age?: string;
  approximate_age_raw?: string | null;
  status: string;
  description: string;
  distinctive_marks?: string[];
  city: string;
  location: { lat: number; lng: number };
  published_at: string;
  expires_at?: string | null;
  updated_at: string;
  author_id: string;
  author_name: string;
  contacts: Record<string, string>;
  is_archived: boolean;
  archive_reason?: string;
  moderation_status: string;
  moderation_reason?: string;
  moderated_at?: string;
  moderated_by?: string;
  reward_mode?: 'points' | 'money';
  reward_amount_byn?: number;
  reward_points?: number;
  reward_recipient_user_id?: string;
  reward_points_awarded_at?: string;
  pet_scope?: 'lost_found' | 'shelter_pet';
  shelter_id?: string;
  adoption_status?: 'available' | 'reserved' | 'adopted' | 'on_treatment' | 'not_for_adoption';
  is_published?: boolean;
  published_by_user_id?: string;
  updated_by_user_id?: string;
  /** Кличка для питомца приюта (ShelterPetDetails), не дублирует author_name */
  nickname?: string | null;
  registration_authority?: string | null;
  registration_token_number?: string | null;
  profile_pet_id?: string | null;
}

export interface ShelterPetResponse {
  id: string;
  photos: string[];
  nickname?: string;
  animal_type: string;
  breed?: string;
  colors: string[];
  gender: string;
  approximate_age?: string;
  description: string;
  city: string;
  location: { lat: number; lng: number };
  published_at: string;
  updated_at: string;
  author_id: string;
  author_name: string;
  contacts: Record<string, string>;
  health_status?: 'disabled' | 'treatment' | 'good' | 'excellent';
  coat_type?: 'smooth' | 'semi' | 'fluffy';
  is_archived: boolean;
  archive_reason?: string;
  pet_scope?: 'shelter_pet';
  shelter_id: string;
  adoption_status?: 'available' | 'reserved' | 'adopted' | 'on_treatment' | 'not_for_adoption';
  is_published?: boolean;
  published_by_user_id?: string;
  updated_by_user_id?: string;
  registration_authority?: string | null;
  registration_token_number?: string | null;
  energy_level?: number | null;
  friendliness_level?: number | null;
  training_level?: number | null;
  independence_level?: number | null;
  good_with_kids?: 'yes' | 'no' | 'unknown' | null;
  good_with_dogs?: 'yes' | 'no' | 'unknown' | null;
  good_with_cats?: 'yes' | 'no' | 'unknown' | null;
}


export function toPet(p: PetResponse): Pet {
  const nick = p.nickname?.trim();
  return {
    id: p.id,
    ...(nick ? { name: nick } : {}),
    photos: (p.photos ?? []).map(resolvePhotoUrl),
    animalType: p.animal_type as Pet['animalType'],
    breed: p.breed,
    colors: (p.colors ?? []) as Pet['colors'],
    gender: p.gender as Pet['gender'],
    approximateAge: p.approximate_age,
    approximateAgeRaw: p.approximate_age_raw ?? undefined,
    status: p.status as Pet['status'],
    description: p.description,
    distinctiveMarks: p.distinctive_marks ?? [],
    city: p.city,
    location: p.location,
    publishedAt: parseApiDate(p.published_at),
    expiresAt: p.expires_at ? parseApiDate(p.expires_at) : undefined,
    updatedAt: parseApiDate(p.updated_at),
    authorId: p.author_id,
    authorName: p.author_name,
    contacts: p.contacts,
    healthStatus: p.health_status,
    coatType: p.coat_type,
    isArchived: p.is_archived,
    archiveReason: p.archive_reason,
    moderationStatus: p.moderation_status as Pet['moderationStatus'],
    moderationReason: p.moderation_reason,
    moderatedAt: p.moderated_at ? parseApiDate(p.moderated_at) : undefined,
    moderatedBy: p.moderated_by,
    rewardMode: (p.reward_mode as Pet['rewardMode']) || 'points',
    rewardAmountByn: p.reward_amount_byn,
    rewardPoints: p.reward_points ?? 50,
    rewardRecipientUserId: p.reward_recipient_user_id,
    rewardPointsAwardedAt: p.reward_points_awarded_at
      ? parseApiDate(p.reward_points_awarded_at)
      : undefined,
    petScope: p.pet_scope,
    shelterId: p.shelter_id,
    adoptionStatus: p.adoption_status as Pet['adoptionStatus'],
    isPublished: p.is_published,
    publishedByUserId: p.published_by_user_id,
    updatedByUserId: p.updated_by_user_id,
    registrationAuthority: p.registration_authority ?? undefined,
    registrationTokenNumber: p.registration_token_number ?? undefined,
    profilePetId: p.profile_pet_id ?? undefined,
  };
}

export function toPetFromShelter(p: ShelterPetResponse): Pet {
  return {
    id: p.id,
    name: p.nickname,
    photos: (p.photos ?? []).map(resolvePhotoUrl),
    animalType: p.animal_type as Pet['animalType'],
    breed: p.breed,
    colors: (p.colors ?? []) as Pet['colors'],
    gender: p.gender as Pet['gender'],
    approximateAge: p.approximate_age,
    status: 'searching',
    description: p.description,
    city: p.city,
    location: p.location,
    publishedAt: parseApiDate(p.published_at),
    updatedAt: parseApiDate(p.updated_at),
    authorId: p.author_id,
    authorName: p.author_name,
    contacts: p.contacts,
    healthStatus: p.health_status,
    coatType: p.coat_type,
    isArchived: p.is_archived,
    archiveReason: p.archive_reason,
    moderationStatus: 'approved',
    rewardMode: 'points',
    rewardPoints: 50,
    petScope: 'shelter_pet',
    shelterId: p.shelter_id,
    adoptionStatus: p.adoption_status as Pet['adoptionStatus'],
    isPublished: p.is_published,
    publishedByUserId: p.published_by_user_id,
    updatedByUserId: p.updated_by_user_id,
    registrationAuthority: p.registration_authority ?? undefined,
    registrationTokenNumber: p.registration_token_number ?? undefined,
    energyLevel: (p.energy_level ?? undefined) as Pet['energyLevel'],
    friendlinessLevel: (p.friendliness_level ?? undefined) as Pet['friendlinessLevel'],
    trainingLevel: (p.training_level ?? undefined) as Pet['trainingLevel'],
    independenceLevel: (p.independence_level ?? undefined) as Pet['independenceLevel'],
    goodWithKids: (p.good_with_kids ?? undefined) as Pet['goodWithKids'],
    goodWithDogs: (p.good_with_dogs ?? undefined) as Pet['goodWithDogs'],
    goodWithCats: (p.good_with_cats ?? undefined) as Pet['goodWithCats'],
  };
}

export interface PetCreateInput {
  photos: string[];
  animalType: string;
  breed?: string;
  colors: string[];
  gender: string;
  approximateAge?: string;
  /** Исходный возраст из профиля (не категория) */
  approximateAgeRaw?: string;
  status: string;
  description: string;
  city: string;
  location: { lat: number; lng: number };
  contacts: Record<string, string>;
  rewardMode?: 'points' | 'money';
  rewardAmountByn?: number;
  /** Имя для отображения в объявлении (при «другие контакты») */
  author_name?: string;
  petScope?: 'lost_found' | 'shelter_pet';
  shelterId?: string;
  adoptionStatus?: 'available' | 'reserved' | 'adopted' | 'on_treatment' | 'not_for_adoption';
  isPublished?: boolean;
  registrationAuthority?: string;
  registrationTokenNumber?: string;
  /** ID карточки питомца при создании из профиля */
  profilePetId?: string;
  distinctiveMarks?: string[];
}

export interface ShelterPetInput {
  photos: string[];
  nickname?: string;
  animalType: string;
  breed?: string;
  colors: string[];
  gender: string;
  approximateAge?: string;
  description: string;
  city: string;
  location: { lat: number; lng: number };
  contacts: Record<string, string>;
  healthStatus?: 'disabled' | 'treatment' | 'good' | 'excellent';
  coatType?: 'smooth' | 'semi' | 'fluffy';
  /** Статус пристройства питомца в приюте */
  adoptionStatus?: 'available' | 'reserved' | 'adopted' | 'on_treatment' | 'not_for_adoption';
  isPublished?: boolean;
  /** Имя автора/менеджера приюта в карточке */
  author_name?: string;
  registrationAuthority?: string;
  registrationTokenNumber?: string;
  energyLevel?: number;
  friendlinessLevel?: number;
  trainingLevel?: number;
  independenceLevel?: number;
  goodWithKids?: 'yes' | 'no' | 'unknown';
  goodWithDogs?: 'yes' | 'no' | 'unknown';
  goodWithCats?: 'yes' | 'no' | 'unknown';
}

export type ShelterPetUpdateInput = Partial<ShelterPetInput> & {
  isArchived?: boolean;
  archiveReason?: string;
};

export interface StatisticsResponse {
  searching: number;
  found: number;
  fostering: number;
  /** Количество городов с активными объявлениями */
  cities_count?: number;
  /** Найденные питомцы (архив со счастливым концом) */
  found_pets?: number;
  /** Процент успешных поисков; null при малой выборке (< 5) */
  success_rate?: number | null;
  /** Зарегистрированные пользователи */
  users_count?: number;
}

export interface PaginatedList<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export const petsApi = {
  list: (params?: {
    animal_type?: string;
    breed?: string;
    city?: string;
    status?: string;
    statuses?: string;
    days?: number;
    moderation_status?: string;
    is_archived?: boolean;
    search?: string;
    author_id?: string;
    /** Список id через запятую (до 80), публичные одобренные — для гостевого избранного */
    ids?: string;
    north?: number;
    south?: number;
    east?: number;
    west?: number;
    limit?: number;
    offset?: number;
  }, options: RequestInit = {}) => {
    const q = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => v != null && q.set(k, String(v)));
    return api<PaginatedList<PetResponse>>(`/pets?${q}`, options).then((page) => page.items.map(toPet));
  },

  get: (id: string, init?: RequestInit) =>
    api<PetResponse>(`/pets/${id}`, init).then(toPet),

  create: (data: PetCreateInput) => {
    const body: Record<string, unknown> = {
      photos: data.photos,
      animal_type: data.animalType,
      breed: data.breed,
      colors: data.colors,
      gender: data.gender,
      approximate_age: data.approximateAge,
      approximate_age_raw: data.approximateAgeRaw,
      status: data.status,
      description: data.description,
      distinctive_marks: data.distinctiveMarks ?? [],
      city: data.city,
      location: data.location,
      contacts: data.contacts,
      reward_mode: data.rewardMode ?? 'points',
      reward_amount_byn: data.rewardAmountByn,
      pet_scope: data.petScope ?? 'lost_found',
      shelter_id: data.shelterId,
      adoption_status: data.adoptionStatus,
      is_published: data.isPublished ?? true,
    };
    const ra = data.registrationAuthority?.trim();
    const rt = data.registrationTokenNumber?.trim();
    if (ra) body.registration_authority = ra;
    if (rt) body.registration_token_number = rt;
    if (data.author_name != null && data.author_name.trim() !== '') {
      body.author_name = data.author_name.trim();
    }
    if (data.profilePetId?.trim()) {
      body.profile_pet_id = data.profilePetId.trim();
    }
    return api<PetResponse>('/pets', { method: 'POST', body: JSON.stringify(body) }).then(toPet);
  },

  update: (
    id: string,
    data: Partial<PetCreateInput> & {
      isArchived?: boolean;
      archiveReason?: string;
      moderationStatus?: string;
      moderationReason?: string;
      rewardPoints?: number;
      rewardHelperCode?: string;
      petScope?: 'lost_found' | 'shelter_pet';
      shelterId?: string;
      adoptionStatus?: 'available' | 'reserved' | 'adopted' | 'on_treatment' | 'not_for_adoption';
      isPublished?: boolean;
    }
  ) => {
    const body: Record<string, unknown> = {};
    if (data.photos != null) body.photos = data.photos;
    if (data.animalType != null) body.animal_type = data.animalType;
    if (data.breed != null) body.breed = data.breed;
    if (data.colors != null) body.colors = data.colors;
    if (data.gender != null) body.gender = data.gender;
    if (data.approximateAge != null) body.approximate_age = data.approximateAge;
    if (data.status != null) body.status = data.status;
    if (data.description != null) body.description = data.description;
    if (data.distinctiveMarks != null) body.distinctive_marks = data.distinctiveMarks;
    if (data.city != null) body.city = data.city;
    if (data.location != null) body.location = data.location;
    if (data.contacts != null) body.contacts = data.contacts;
    if (data.author_name != null && data.author_name.trim() !== '') body.author_name = data.author_name.trim();
    if (data.isArchived != null) body.is_archived = data.isArchived;
    if (data.archiveReason != null) body.archive_reason = data.archiveReason;
    if (data.moderationStatus != null) body.moderation_status = data.moderationStatus;
    if (data.moderationReason != null) body.moderation_reason = data.moderationReason;
    if (data.rewardMode != null) body.reward_mode = data.rewardMode;
    if (data.rewardAmountByn != null) body.reward_amount_byn = data.rewardAmountByn;
    if (data.rewardPoints != null) body.reward_points = data.rewardPoints;
    if (data.rewardHelperCode != null) body.reward_helper_code = data.rewardHelperCode;
    if (data.petScope != null) body.pet_scope = data.petScope;
    if (data.shelterId != null) body.shelter_id = data.shelterId;
    if (data.adoptionStatus != null) body.adoption_status = data.adoptionStatus;
    if (data.isPublished != null) body.is_published = data.isPublished;
    if (data.registrationAuthority !== undefined) {
      body.registration_authority = data.registrationAuthority?.trim() || null;
    }
    if (data.registrationTokenNumber !== undefined) {
      body.registration_token_number = data.registrationTokenNumber?.trim() || null;
    }
    return api<PetResponse>(`/pets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }).then(toPet);
  },

  delete: (id: string) => api<void>(`/pets/${id}`, { method: 'DELETE' }),

  renew: (id: string) =>
    api<PetResponse>(`/pets/${id}/renew`, { method: 'POST' }).then(toPet),

  similar: (id: string, params?: { limit?: number; radius_km?: number }, options: RequestInit = {}) => {
    const q = new URLSearchParams();
    if (params?.limit != null) q.set('limit', String(params.limit));
    if (params?.radius_km != null) q.set('radius_km', String(params.radius_km));
    const qs = q.toString();
    return api<SimilarPetsApiResponse>(`/pets/${id}/similar${qs ? `?${qs}` : ''}`, options).then(
      (res) => ({
        sourcePetId: res.source_pet_id,
        matchingStatus: res.matching_status,
        items: res.items.map((item) => ({
          score: item.score,
          matchPercent: item.match_percent,
          distanceKm: item.distance_km ?? null,
          reasons: item.reasons,
          pet: toPet(item.pet),
        })),
      }),
    );
  },

  analyzePhoto: (image: string) =>
    api<PhotoAnalyzeResponse>('/pets/analyze-photo', {
      method: 'POST',
      body: JSON.stringify({ image }),
    }),

  /** До 3 кадров — сервер агрегирует ответ Groq (голосование по полям). */
  analyzePhotos: (images: string[]) => {
    const batch = images.map((p) => p?.trim()).filter(Boolean).slice(0, 3);
    if (batch.length === 0) {
      return Promise.reject(new Error('No images'));
    }
    if (batch.length === 1) {
      return petsApi.analyzePhoto(batch[0]!);
    }
    return api<PhotoAnalyzeResponse>('/pets/analyze-photo', {
      method: 'POST',
      body: JSON.stringify({ images: batch }),
    });
  },

  statistics: () => api<StatisticsResponse>('/pets/statistics'),
};

export interface SimilarPetItemResponse {
  pet: PetResponse;
  score: number;
  match_percent: number;
  distance_km?: number | null;
  reasons: string[];
}

export interface SimilarPetsApiResponse {
  source_pet_id: string;
  matching_status: string;
  items: SimilarPetItemResponse[];
}

export interface SimilarPetsResult {
  sourcePetId: string;
  matchingStatus: string;
  items: {
    pet: Pet;
    score: number;
    matchPercent: number;
    distanceKm: number | null;
    reasons: string[];
  }[];
}

export interface PhotoAnalyzeResponse {
  ai_available: boolean;
  animal_type?: string | null;
  breed?: string | null;
  colors?: string[];
  gender?: string | null;
  approximate_age?: string | null;
  age_years_estimate?: number | null;
  description?: string | null;
  notes?: string | null;
  distinctive_marks?: string[];
  error?: string | null;
}

export interface FavoriteIdsResponse {
  ids: string[];
}

export const favoritesApi = {
  ids: () => api<FavoriteIdsResponse>('/favorites/ids'),
  list: (limit = 200, offset = 0) =>
    api<PaginatedList<PetResponse>>(`/favorites?limit=${limit}&offset=${offset}`).then((page) =>
      page.items.map(toPet),
    ),
  add: (petId: string) =>
    api<{ ok: boolean; already?: boolean }>(`/favorites/${encodeURIComponent(petId)}`, {
      method: 'PUT',
    }),
  remove: (petId: string) =>
    api<void>(`/favorites/${encodeURIComponent(petId)}`, { method: 'DELETE' }),
  importBatch: (petIds: string[]) =>
    api<FavoriteIdsResponse>('/favorites/import', {
      method: 'POST',
      body: JSON.stringify({ pet_ids: petIds }),
    }),
};