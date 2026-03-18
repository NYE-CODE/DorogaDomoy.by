/**
 * API client for DorogaDomoy.by backend.
 * Base URL: VITE_API_URL or http://localhost:8000
 */
import type { Pet } from '../types/pet';
import type { User } from '../context/AuthContext';
import type { Report, ReportReason } from '../types/admin';

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function getToken(): string | null {
  return localStorage.getItem('pet_finder_token');
}

function setToken(token: string) {
  localStorage.setItem('pet_finder_token', token);
}

function clearToken() {
  localStorage.removeItem('pet_finder_token');
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (res.status === 401) {
    clearToken();
    const err = await res.json().catch(() => ({}));
    const msg = typeof err?.detail === 'string' ? err.detail : 'Сессия истекла';
    throw new Error(msg);
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(typeof err.detail === 'string' ? err.detail : JSON.stringify(err));
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// --- Auth ---
export interface UserResponse {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: string;
  contacts: { phone?: string; telegram?: string; viber?: string };
  is_blocked?: boolean;
  blocked_reason?: string;
  telegram_id?: number | null;
  telegram_username?: string | null;
  telegram_linked_at?: string | null;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

function toUser(u: UserResponse): User {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    avatar: u.avatar,
    role: u.role as User['role'],
    contacts: u.contacts,
    isBlocked: u.is_blocked,
    blockedReason: u.blocked_reason,
    telegramId: u.telegram_id,
    telegramUsername: u.telegram_username,
    telegramLinkedAt: u.telegram_linked_at,
  };
}

export const authApi = {
  login: (email: string, password: string) =>
    api<TokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }).then((r) => {
      setToken(r.access_token);
      return toUser(r.user);
    }),

  register: (email: string, name: string, password: string, contacts: User['contacts']) =>
    api<TokenResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, name, password, contacts }),
    }).then((r) => {
      setToken(r.access_token);
      return toUser(r.user);
    }),

  me: () => api<UserResponse>('/auth/me').then(toUser),

  updateProfile: (data: { name?: string; email?: string; contacts?: User['contacts']; avatar?: string }) =>
    api<UserResponse>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }).then(toUser),

  changePassword: (currentPassword: string, newPassword: string) =>
    api<{ detail: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    }),

  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = getToken();
    const res = await fetch(`${API_BASE}/auth/avatar-upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (res.status === 401) {
      clearToken();
      throw new Error('Сессия истекла');
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(typeof err.detail === 'string' ? err.detail : JSON.stringify(err));
    }
    const data = await res.json();
    return data.avatar as string;
  },

  logout: () => clearToken(),
};

// --- Pets ---
interface PetResponse {
  id: string;
  photos: string[];
  animal_type: string;
  breed?: string;
  colors: string[];
  gender: string;
  approximate_age?: string;
  status: string;
  description: string;
  city: string;
  location: { lat: number; lng: number };
  published_at: string;
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
}

function resolvePhotoUrl(url: string): string {
  if (!url || url.startsWith('http') || url.startsWith('data:')) return url;
  return `${API_BASE}${url}`;
}

function toPet(p: PetResponse): Pet {
  return {
    id: p.id,
    photos: p.photos.map(resolvePhotoUrl),
    animalType: p.animal_type as Pet['animalType'],
    breed: p.breed,
    colors: p.colors as Pet['colors'],
    gender: p.gender as Pet['gender'],
    approximateAge: p.approximate_age,
    status: p.status as Pet['status'],
    description: p.description,
    city: p.city,
    location: p.location,
    publishedAt: new Date(p.published_at),
    updatedAt: new Date(p.updated_at),
    authorId: p.author_id,
    authorName: p.author_name,
    contacts: p.contacts,
    isArchived: p.is_archived,
    archiveReason: p.archive_reason,
    moderationStatus: p.moderation_status as Pet['moderationStatus'],
    moderationReason: p.moderation_reason,
    moderatedAt: p.moderated_at ? new Date(p.moderated_at) : undefined,
    moderatedBy: p.moderated_by,
  };
}

export interface PetCreateInput {
  photos: string[];
  animalType: string;
  breed?: string;
  colors: string[];
  gender: string;
  approximateAge?: string;
  status: string;
  description: string;
  city: string;
  location: { lat: number; lng: number };
  contacts: Record<string, string>;
  /** Имя для отображения в объявлении (при «другие контакты») */
  author_name?: string;
}

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
    north?: number;
    south?: number;
    east?: number;
    west?: number;
  }, options: RequestInit = {}) => {
    const q = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => v != null && q.set(k, String(v)));
    return api<PetResponse[]>(`/pets?${q}`, options).then((arr) => arr.map(toPet));
  },

  get: (id: string) => api<PetResponse>(`/pets/${id}`).then(toPet),

  create: (data: PetCreateInput) => {
    const body: Record<string, unknown> = {
      photos: data.photos,
      animal_type: data.animalType,
      breed: data.breed,
      colors: data.colors,
      gender: data.gender,
      approximate_age: data.approximateAge,
      status: data.status,
      description: data.description,
      city: data.city,
      location: data.location,
      contacts: data.contacts,
    };
    if (data.author_name != null && data.author_name.trim() !== '') {
      body.author_name = data.author_name.trim();
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
    if (data.city != null) body.city = data.city;
    if (data.location != null) body.location = data.location;
    if (data.contacts != null) body.contacts = data.contacts;
    if (data.author_name != null && data.author_name.trim() !== '') body.author_name = data.author_name.trim();
    if (data.isArchived != null) body.is_archived = data.isArchived;
    if (data.archiveReason != null) body.archive_reason = data.archiveReason;
    if (data.moderationStatus != null) body.moderation_status = data.moderationStatus;
    if (data.moderationReason != null) body.moderation_reason = data.moderationReason;
    return api<PetResponse>(`/pets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }).then(toPet);
  },

  delete: (id: string) => api<void>(`/pets/${id}`, { method: 'DELETE' }),

  statistics: () => api<StatisticsResponse>('/pets/statistics'),
};

// --- Users ---
export const usersApi = {
  list: (params?: { search?: string; role?: string; is_blocked?: boolean }) => {
    const q = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => v != null && q.set(k, String(v)));
    return api<UserResponse[]>(`/users?${q}`).then((arr) => arr.map(toUser));
  },

  update: (userId: string, data: Partial<{ name: string; email: string; role: string; is_blocked: boolean; blocked_reason: string; contacts: { phone?: string; telegram?: string; viber?: string } }>) =>
    api<UserResponse>(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }).then(toUser),

  get: (id: string) => api<UserResponse>(`/users/${id}`).then(toUser),

  delete: (userId: string) =>
    api<void>(`/users/${userId}`, { method: 'DELETE' }),
};

// --- Reports ---
interface ReportResponse {
  id: string;
  pet_id: string;
  reporter_id: string;
  reporter_name: string;
  reason: string;
  description: string;
  created_at: string;
  status: string;
  reviewed_by?: string;
  reviewed_at?: string;
  resolution?: string;
}

export const reportsApi = {
  list: (params?: { status?: string; reason?: string }) => {
    const q = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => v != null && q.set(k, String(v)));
    return api<ReportResponse[]>(`/reports?${q}`).then((arr) =>
      arr.map<Report>((r) => ({
        id: r.id,
        petId: r.pet_id,
        reporterId: r.reporter_id,
        reporterName: r.reporter_name,
        reason: r.reason as ReportReason,
        description: r.description,
        createdAt: new Date(r.created_at),
        status: r.status as Report['status'],
        reviewedBy: r.reviewed_by,
        reviewedAt: r.reviewed_at ? new Date(r.reviewed_at) : undefined,
        resolution: r.resolution,
      }))
    );
  },

  create: (petId: string, reason: ReportReason, description: string) =>
    api<ReportResponse>('/reports', {
      method: 'POST',
      body: JSON.stringify({ pet_id: petId, reason, description }),
    }).then<Report>((r) => ({
      id: r.id,
      petId: r.pet_id,
      reporterId: r.reporter_id,
      reporterName: r.reporter_name,
      reason: r.reason as ReportReason,
      description: r.description,
      createdAt: new Date(r.created_at),
      status: r.status as Report['status'],
      reviewedBy: r.reviewed_by,
      reviewedAt: r.reviewed_at ? new Date(r.reviewed_at) : undefined,
      resolution: r.resolution,
    })),

  delete: (reportId: string) =>
    api<void>(`/reports/${reportId}`, { method: 'DELETE' }),

  update: (reportId: string, data: { status?: string; resolution?: string }) =>
    api<ReportResponse>(`/reports/${reportId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// --- Feature Flags ---
export interface FeatureFlags {
  ff_landing_show_stats: string;
  ff_landing_show_help: string;
}

export const featureFlagsApi = {
  get: () => api<FeatureFlags>('/feature-flags'),

  update: (data: { ff_landing_show_stats?: boolean; ff_landing_show_help?: boolean }) =>
    api<FeatureFlags>('/feature-flags', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// --- Settings ---
export interface PlatformSettings {
  require_moderation: string;
  auto_archive_days: string;
  max_photos: string;
}

export const settingsApi = {
  get: () => api<PlatformSettings>('/settings'),

  update: (data: Partial<PlatformSettings>) =>
    api<PlatformSettings>('/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// --- Telegram ---
export interface TelegramLinkResponse {
  code: string;
  expires_in: number;
  bot_url: string;
}

export interface TelegramLinkStatus {
  linked: boolean;
  telegram_username?: string;
}

export const telegramApi = {
  requestLink: () =>
    api<TelegramLinkResponse>('/auth/telegram-link/request', { method: 'POST' }),

  checkStatus: () =>
    api<TelegramLinkStatus>('/auth/telegram-link/status'),

  unlink: () =>
    api<{ detail: string }>('/auth/telegram-unlink', { method: 'DELETE' }),
};

// --- Notifications ---
export interface NotificationSettingsData {
  notifications_enabled: boolean;
  notification_radius_km: number;
}

export interface NotificationItem {
  id: string;
  pet_id: string;
  type: string;
  message: string;
  is_read: boolean;
  sent_via: string;
  sent_at: string;
}

export const notificationsApi = {
  getSettings: () =>
    api<NotificationSettingsData>('/notifications/settings'),

  updateSettings: (data: Partial<NotificationSettingsData>) =>
    api<NotificationSettingsData>('/notifications/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  list: (limit = 50, offset = 0) =>
    api<NotificationItem[]>(`/notifications?limit=${limit}&offset=${offset}`),

  markRead: (id: string) =>
    api<{ detail: string }>(`/notifications/${id}/read`, { method: 'PATCH' }),
};

// --- Media Articles (СМИ о нас) ---
export interface MediaArticle {
  id: string;
  logo_url?: string | null;
  title: string;
  published_at: string;
  link?: string | null;
}

export const mediaApi = {
  list: () => api<MediaArticle[]>('/media'),

  create: (data: { logo_url?: string; title: string; published_at: string; link?: string }) =>
    api<MediaArticle>('/media', {
      method: 'POST',
      body: JSON.stringify({
        logo_url: data.logo_url || null,
        title: data.title,
        published_at: data.published_at,
        link: data.link || null,
      }),
    }),

  update: (id: string, data: Partial<{ logo_url: string; title: string; published_at: string; link: string }>) =>
    api<MediaArticle>(`/media/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) => api<void>(`/media/${id}`, { method: 'DELETE' }),
};

// --- Partners (Наши партнеры) ---
export interface Partner {
  id: string;
  logo_url?: string | null;
  name: string;
  link?: string | null;
}

export const partnersApi = {
  list: () => api<Partner[]>('/partners'),

  create: (data: { logo_url?: string; name: string; link?: string }) =>
    api<Partner>('/partners', {
      method: 'POST',
      body: JSON.stringify({
        logo_url: data.logo_url || null,
        name: data.name,
        link: data.link || null,
      }),
    }),

  update: (id: string, data: Partial<{ logo_url: string; name: string; link: string }>) =>
    api<Partner>(`/partners/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) => api<void>(`/partners/${id}`, { method: 'DELETE' }),
};

// --- Sightings (видения «видел похожее») ---
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
  create: (data: { pet_id: string; location_lat: number; location_lng: number; seen_at: string; comment?: string; contact?: string }) =>
    api<SightingItem>('/sightings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listByPet: (petId: string, days = 7) =>
    api<SightingItem[]>(`/sightings/pet/${petId}?days=${days}`),

  getCounts: (petIds: string[]) =>
    api<Record<string, number>>(`/sightings/counts?pet_ids=${petIds.join(',')}`),
};
