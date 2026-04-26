/**
 * API client for DorogaDomoy.by backend.
 * `VITE_API_URL` — origin сервера (без `/api/v1`): статика `/uploads`, абсолютные пути фото.
 * JSON API: `/api/v1` (см. `API_V1_BASE`).
 *
 * В production, если хост страницы совпадает с хостом из VITE (включая пара www ↔ apex),
 * используется пустой origin → запросы идут на тот же host, что открыл пользователь.
 * Так Safari не ломает CORS/куки из‑за рассинхрона www и канонического домена в билде.
 */
import type { Pet } from '../types/pet';
import type { User } from '../context/AuthContext';
import type { Report, ReportReason } from '../types/admin';

function trimTrailingSlash(s: string): string {
  return s.replace(/\/+$/, '');
}

function hostKey(hostname: string): string {
  return hostname.replace(/^www\./i, '');
}

function resolveApiBase(): string {
  const envRaw = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  if (import.meta.env.DEV) {
    return trimTrailingSlash(envRaw || 'http://localhost:8000');
  }
  if (typeof window === 'undefined') {
    return envRaw ? trimTrailingSlash(envRaw) : '';
  }
  if (!envRaw) {
    return '';
  }
  let envUrl: URL;
  try {
    envUrl = new URL(envRaw);
  } catch {
    return trimTrailingSlash(envRaw);
  }
  const page = window.location;
  if (envUrl.origin === page.origin) {
    return '';
  }
  if (hostKey(envUrl.hostname) === hostKey(page.hostname)) {
    return '';
  }
  return trimTrailingSlash(envRaw);
}

/** Origin бэкенда для `/uploads/…` и разрешения относительных URL фото (в prod может быть '') */
export const API_BASE = resolveApiBase();

/** Базовый URL REST API версии 1 */
export const API_V1_BASE = API_BASE ? `${API_BASE}/api/v1` : '/api/v1';
const LEGACY_TOKEN_KEY = 'pet_finder_token';

function clearLegacyToken() {
  localStorage.removeItem(LEGACY_TOKEN_KEY);
}

/** Сообщение для UI из тела ошибки FastAPI без утечки полного JSON. */
function formatApiErrorBody(errBody: unknown, fallback: string): string {
  if (!errBody || typeof errBody !== 'object') return fallback;
  const detail = (errBody as Record<string, unknown>).detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const parts: string[] = [];
    for (const item of detail) {
      if (typeof item === 'string') {
        parts.push(item);
        continue;
      }
      if (item && typeof item === 'object' && 'msg' in item) {
        const m = (item as { msg?: unknown }).msg;
        if (typeof m === 'string') parts.push(m);
      }
    }
    if (parts.length > 0) return parts.join(' · ');
  }
  return fallback;
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  const res = await fetch(`${API_V1_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers,
  });
  if (res.status === 401) {
    clearLegacyToken();
    const err = await res.json().catch(() => ({}));
    throw new Error(formatApiErrorBody(err, 'Сессия истекла'));
  }
  if (res.status === 413) {
    throw new Error("Слишком большой размер данных. Уменьшите фото и попробуйте снова.");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    const fallback =
      res.status === 422
        ? 'Проверьте введённые данные'
        : `Запрос не выполнен (${res.status})`;
    throw new Error(formatApiErrorBody(err, fallback));
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
  helper_code?: string | null;
  helper_confirmed_count?: number;
  points_balance?: number;
  points_earned_total?: number;
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
    helperCode: u.helper_code,
    helperConfirmedCount: u.helper_confirmed_count ?? 0,
    pointsBalance: u.points_balance ?? 0,
    pointsEarnedTotal: u.points_earned_total ?? 0,
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
      clearLegacyToken();
      return toUser(r.user);
    }),

  register: (email: string, name: string, password: string, contacts: User['contacts']) =>
    api<TokenResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, name, password, contacts }),
    }).then((r) => {
      clearLegacyToken();
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
    const res = await fetch(`${API_V1_BASE}/auth/avatar-upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    if (res.status === 401) {
      clearLegacyToken();
      throw new Error('Сессия истекла');
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(
        formatApiErrorBody(err, `Не удалось загрузить аватар (${res.status})`)
      );
    }
    const data = await res.json();
    return data.avatar as string;
  },

  logout: async () => {
    try {
      await api<void>('/auth/logout', { method: 'POST' });
    } finally {
      clearLegacyToken();
    }
  },
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
  reward_mode?: 'points' | 'money';
  reward_amount_byn?: number;
  reward_points?: number;
  reward_recipient_user_id?: string;
  reward_points_awarded_at?: string;
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
    rewardMode: (p.reward_mode as Pet['rewardMode']) || 'points',
    rewardAmountByn: p.reward_amount_byn,
    rewardPoints: p.reward_points ?? 50,
    rewardRecipientUserId: p.reward_recipient_user_id,
    rewardPointsAwardedAt: p.reward_points_awarded_at
      ? new Date(p.reward_points_awarded_at)
      : undefined,
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
  rewardMode?: 'points' | 'money';
  rewardAmountByn?: number;
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
    return api<PetResponse[]>(`/pets?${q}`, options).then((arr) => arr.map(toPet));
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
      status: data.status,
      description: data.description,
      city: data.city,
      location: data.location,
      contacts: data.contacts,
      reward_mode: data.rewardMode ?? 'points',
      reward_amount_byn: data.rewardAmountByn,
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
      rewardPoints?: number;
      rewardHelperCode?: string;
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
    if (data.rewardMode != null) body.reward_mode = data.rewardMode;
    if (data.rewardAmountByn != null) body.reward_amount_byn = data.rewardAmountByn;
    if (data.rewardPoints != null) body.reward_points = data.rewardPoints;
    if (data.rewardHelperCode != null) body.reward_helper_code = data.rewardHelperCode;
    return api<PetResponse>(`/pets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }).then(toPet);
  },

  delete: (id: string) => api<void>(`/pets/${id}`, { method: 'DELETE' }),

  statistics: () => api<StatisticsResponse>('/pets/statistics'),
};

export interface FavoriteIdsResponse {
  ids: string[];
}

export const favoritesApi = {
  ids: () => api<FavoriteIdsResponse>('/favorites/ids'),
  list: () => api<PetResponse[]>('/favorites').then((arr) => arr.map(toPet)),
  add: (petId: string) =>
    api<{ ok: boolean; already?: boolean }>(`/favorites/${encodeURIComponent(petId)}`, {
      method: 'POST',
    }),
  remove: (petId: string) =>
    api<void>(`/favorites/${encodeURIComponent(petId)}`, { method: 'DELETE' }),
  importBatch: (petIds: string[]) =>
    api<FavoriteIdsResponse>('/favorites/import', {
      method: 'POST',
      body: JSON.stringify({ pet_ids: petIds }),
    }),
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

  findByHelperCode: (
    helperCode: string
  ) =>
    api<{
      id: string;
      name: string;
      avatar?: string | null;
      helper_code: string;
      helper_confirmed_count: number;
    }>(`/users/helper-code/${encodeURIComponent(helperCode.trim())}`),

  delete: (userId: string) =>
    api<void>(`/users/${userId}`, { method: 'DELETE' }),
};

// --- Rewards ---
export interface PointsTransactionItem {
  id: string;
  user_id: string;
  pet_id?: string | null;
  amount: number;
  kind: string;
  note?: string | null;
  created_at: string;
}

export const rewardsApi = {
  listPointsTransactions: (params?: { user_id?: string; pet_id?: string; kind?: string; limit?: number; offset?: number }) => {
    const q = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => v != null && q.set(k, String(v)));
    return api<PointsTransactionItem[]>(`/rewards/points-transactions?${q}`);
  },
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
  /** Отсутствует в ответе старых бэкендов до миграции — клиент трактует как true */
  ff_landing_show_pets_feature?: string;
  /** FAQ на лендинге; до миграции — true */
  ff_landing_show_faq?: string;
  /** Продвижение в Instagram Stories из «Мои объявления»; до миграции — true */
  ff_instagram_boost_stories?: string;
  /** Включена ли система наград */
  ff_reward_enabled?: string;
  /** Разрешен ли денежный тип награды */
  ff_reward_money_enabled?: string;
}

export const featureFlagsApi = {
  get: () => api<FeatureFlags>('/feature-flags'),

  update: (data: {
    ff_landing_show_stats?: boolean;
    ff_landing_show_help?: boolean;
    ff_landing_show_pets_feature?: boolean;
    ff_landing_show_faq?: boolean;
    ff_instagram_boost_stories?: boolean;
    ff_reward_enabled?: boolean;
    ff_reward_money_enabled?: boolean;
  }) =>
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
  reward_default_points?: string;
  /** @username канала / супергруппы или -100… — куда слать анонсы блога */
  telegram_blog_chat_id?: string;
  /** Публичный username канала без @ — для ссылок на пост и комментарии */
  telegram_blog_public_username?: string;
  instagram_autopublish_enabled?: string;
  instagram_story_enabled?: string;
  instagram_manual_when_auto_off?: string;
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
  list: (params?: { limit?: number; offset?: number }) => {
    const q = new URLSearchParams();
    if (params?.limit != null) q.set('limit', String(params.limit));
    if (params?.offset != null && params.offset > 0) q.set('offset', String(params.offset));
    const suffix = q.toString() ? `?${q}` : '';
    return api<MediaArticle[]>(`/media${suffix}`);
  },

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

// --- Blog ---
export interface BlogCategory {
  id: string;
  slug: string;
  title: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BlogPostListItem {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  cover_image_url?: string | null;
  category: string;
  category_title: string;
  published_at: string;
  reading_minutes: number;
}

export interface BlogPostPublic extends BlogPostListItem {
  body_md: string;
  meta_description?: string | null;
  telegram_post_url?: string | null;
}

export interface BlogPostAdmin extends BlogPostPublic {
  status: string;
  created_at: string;
  updated_at: string;
  author_id?: string | null;
  telegram_message_id?: number | null;
  telegram_channel_username?: string | null;
}

export const blogApi = {
  listCategories: () => api<BlogCategory[]>('/blog/categories'),

  listPublished: (params?: { limit?: number; offset?: number }) => {
    const q = new URLSearchParams();
    if (params?.limit != null) q.set('limit', String(params.limit));
    if (params?.offset != null && params.offset > 0) q.set('offset', String(params.offset));
    const suffix = q.toString() ? `?${q}` : '';
    return api<BlogPostListItem[]>(`/blog/posts${suffix}`);
  },

  getPublished: (slug: string) => api<BlogPostPublic>(`/blog/posts/${encodeURIComponent(slug)}`),

  adminList: (params?: { limit?: number; offset?: number }) => {
    const q = new URLSearchParams();
    if (params?.limit != null) q.set('limit', String(params.limit));
    if (params?.offset != null && params.offset > 0) q.set('offset', String(params.offset));
    const suffix = q.toString() ? `?${q}` : '';
    return api<BlogPostAdmin[]>(`/blog/admin/posts${suffix}`);
  },

  adminCategoryCreate: (data: { slug: string; title: string; sort_order?: number }) =>
    api<BlogCategory>('/blog/admin/categories', {
      method: 'POST',
      body: JSON.stringify({
        slug: data.slug,
        title: data.title,
        sort_order: data.sort_order ?? 0,
      }),
    }),

  adminCategoryUpdate: (id: string, data: Partial<{ title: string; sort_order: number }>) =>
    api<BlogCategory>(`/blog/admin/categories/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  adminCategoryDelete: (id: string) =>
    api<void>(`/blog/admin/categories/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  adminCreate: (data: {
    slug: string;
    title: string;
    excerpt?: string;
    body_md: string;
    cover_image_url?: string;
    meta_description?: string;
    category?: string;
    status?: 'draft' | 'published';
  }) =>
    api<BlogPostAdmin>('/blog/admin/posts', {
      method: 'POST',
      body: JSON.stringify({
        slug: data.slug,
        title: data.title,
        excerpt: data.excerpt ?? null,
        body_md: data.body_md,
        cover_image_url: data.cover_image_url ?? null,
        meta_description: data.meta_description ?? null,
        category: data.category ?? 'guides',
        status: data.status ?? 'draft',
      }),
    }),

  adminUpdate: (
    id: string,
    data: Partial<{
      slug: string;
      title: string;
      excerpt: string;
      body_md: string;
      cover_image_url: string;
      meta_description: string;
      category: string;
      status: 'draft' | 'published';
    }>,
  ) =>
    api<BlogPostAdmin>(`/blog/admin/posts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  adminDelete: (id: string) => api<void>(`/blog/admin/posts/${id}`, { method: 'DELETE' }),

  adminSendTelegram: (id: string) =>
    api<BlogPostAdmin>(`/blog/admin/posts/${id}/telegram`, { method: 'POST' }),
};

// --- Partners (Наши партнеры) ---
export interface Partner {
  id: string;
  logo_url?: string | null;
  name: string;
  link?: string | null;
  is_medallion_partner?: boolean;
}

export const partnersApi = {
  list: () => api<Partner[]>('/partners'),

  create: (data: { logo_url?: string; name: string; link?: string; is_medallion_partner?: boolean }) =>
    api<Partner>('/partners', {
      method: 'POST',
      body: JSON.stringify({
        logo_url: data.logo_url || null,
        name: data.name,
        link: data.link || null,
        is_medallion_partner: data.is_medallion_partner ?? false,
      }),
    }),

  update: (id: string, data: Partial<{ logo_url: string; name: string; link: string; is_medallion_partner: boolean }>) =>
    api<Partner>(`/partners/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) => api<void>(`/partners/${id}`, { method: 'DELETE' }),
};

// --- FAQ (лендинг) ---
export interface FaqItem {
  id: string;
  question_ru: string;
  question_be: string;
  question_en: string;
  answer_ru: string;
  answer_be: string;
  answer_en: string;
  sort_order: number;
}

export const faqApi = {
  list: () => api<FaqItem[]>('/faq'),

  create: (data: {
    question_ru?: string;
    question_be?: string;
    question_en?: string;
    answer_ru?: string;
    answer_be?: string;
    answer_en?: string;
    sort_order?: number;
  }) =>
    api<FaqItem>('/faq', {
      method: 'POST',
      body: JSON.stringify({
        question_ru: data.question_ru ?? '',
        question_be: data.question_be ?? '',
        question_en: data.question_en ?? '',
        answer_ru: data.answer_ru ?? '',
        answer_be: data.answer_be ?? '',
        answer_en: data.answer_en ?? '',
        sort_order: data.sort_order ?? 0,
      }),
    }),

  update: (
    id: string,
    data: Partial<{
      question_ru: string;
      question_be: string;
      question_en: string;
      answer_ru: string;
      answer_be: string;
      answer_en: string;
      sort_order: number;
    }>,
  ) =>
    api<FaqItem>(`/faq/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) => api<void>(`/faq/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

// --- Profile Pets (адресник / QR) ---
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
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_V1_BASE}/profile-pets/upload-photo`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    if (res.status === 401) {
      clearLegacyToken();
      throw new Error('Сессия истекла');
    }
    if (res.status === 413) {
      throw new Error('Файл слишком большой. Уменьшите фото и попробуйте снова.');
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(
        formatApiErrorBody(err, `Не удалось загрузить фото (${res.status})`)
      );
    }
    const data = await res.json() as { photo: string };
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

  delete: (id: string) => api<void>(`/profile-pets/${id}`, { method: 'DELETE' }),
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

  listByPet: (petId: string, days = 7, init?: RequestInit) =>
    api<SightingItem[]>(`/sightings/pet/${petId}?days=${days}`, init),

  getCounts: (petIds: string[]) =>
    api<Record<string, number>>(`/sightings/counts?pet_ids=${petIds.join(',')}`),
};

// --- Instagram publishing admin ---
export interface InstagramAccountResponse {
  id: string;
  name: string;
  instagram_business_id: string;
  facebook_page_id?: string | null;
  has_access_token: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InstagramRegionRouteResponse {
  id: string;
  region_key: string;
  account_id: string;
  account_name: string;
  is_fallback: boolean;
  created_at: string;
  updated_at: string;
}

export interface InstagramPublicationResponse {
  id: string;
  pet_id: string;
  account_id?: string | null;
  account_name?: string | null;
  initiated_by?: string | null;
  region_key?: string | null;
  mode: string;
  source?: 'auto' | 'manual_admin' | 'boost_user';
  requested_by_user_id?: string | null;
  requested_at?: string | null;
  format: 'story';
  status: string;
  attempts: number;
  last_error?: string | null;
  external_media_id?: string | null;
  idempotency_key: string;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  published_at?: string | null;
}

export interface InstagramBoostEligibilityResponse {
  eligible: boolean;
  reason:
    | 'ok'
    | 'pet_not_found'
    | 'not_owner'
    | 'not_approved'
    | 'archived_or_found'
    | 'too_early'
    | 'route_missing'
    | 'limit_reached';
  next_available_at?: string | null;
  pet_age_days?: number | null;
}

export const instagramApi = {
  listAccounts: () => api<InstagramAccountResponse[]>('/instagram/accounts'),
  createAccount: (data: {
    name: string;
    instagram_business_id: string;
    facebook_page_id?: string;
    access_token?: string;
    is_active?: boolean;
  }) =>
    api<InstagramAccountResponse>('/instagram/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateAccount: (accountId: string, data: Partial<{
    name: string;
    instagram_business_id: string;
    facebook_page_id: string | null;
    access_token: string | null;
    is_active: boolean;
  }>) =>
    api<InstagramAccountResponse>(`/instagram/accounts/${accountId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  listRoutes: () => api<InstagramRegionRouteResponse[]>('/instagram/routes'),
  createRoute: (data: { region_key: string; account_id: string; is_fallback?: boolean }) =>
    api<InstagramRegionRouteResponse>('/instagram/routes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateRoute: (routeId: string, data: Partial<{ account_id: string; is_fallback: boolean }>) =>
    api<InstagramRegionRouteResponse>(`/instagram/routes/${routeId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteRoute: (routeId: string) =>
    api<void>(`/instagram/routes/${routeId}`, { method: 'DELETE' }),

  listPublications: (params?: { status?: string; pet_id?: string; limit?: number; offset?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.pet_id) q.set('pet_id', params.pet_id);
    if (params?.limit != null) q.set('limit', String(params.limit));
    if (params?.offset != null) q.set('offset', String(params.offset));
    const suffix = q.toString() ? `?${q}` : '';
    return api<InstagramPublicationResponse[]>(`/instagram/publications${suffix}`);
  },
  createManualPublication: (data: { pet_id: string; format: 'story' }) =>
    api<InstagramPublicationResponse[]>('/instagram/publications/manual', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  boostEligibility: (petId: string) =>
    api<InstagramBoostEligibilityResponse>(`/instagram/boosts/eligibility?pet_id=${encodeURIComponent(petId)}`),
  createBoostPublication: (pet_id: string) =>
    api<InstagramPublicationResponse>('/instagram/publications/boost', {
      method: 'POST',
      body: JSON.stringify({ pet_id }),
    }),
  retryPublication: (publicationId: string) =>
    api<InstagramPublicationResponse>(`/instagram/publications/${publicationId}/retry`, {
      method: 'POST',
    }),
  cancelPublication: (publicationId: string) =>
    api<InstagramPublicationResponse>(`/instagram/publications/${publicationId}/cancel`, {
      method: 'POST',
    }),
  publishNow: (publicationId: string) =>
    api<InstagramPublicationResponse>(`/instagram/publications/${publicationId}/publish-now`, {
      method: 'POST',
    }),
};
