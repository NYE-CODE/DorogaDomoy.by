import type { User } from '@/entities/user/model/types';
import { clearLegacyToken } from '@/shared/api/interceptors';
import { api, uploadMultipart } from '@/shared/api/http';

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
  registered_as_volunteer?: boolean;
  profile_completed?: boolean;
  password_set?: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

export function toUser(u: UserResponse): User {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    avatar: u.avatar,
    role: u.role as User['role'],
    registeredAsVolunteer: u.registered_as_volunteer ?? false,
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
    profileCompleted: u.profile_completed ?? true,
    passwordSet: u.password_set ?? true,
  };
}

function userFromTokenResponse(r: TokenResponse): User {
  clearLegacyToken();
  return toUser(r.user);
}

export interface AuthPublicConfig {
  telegram_bot_username?: string | null;
  telegram_login_enabled: boolean;
}

export interface TelegramAuthPayload {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export const authApi = {
  getConfig: () => api<AuthPublicConfig>('/auth/config'),

  loginWithTelegram: (payload: TelegramAuthPayload) =>
    api<TokenResponse>('/auth/telegram/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }).then(userFromTokenResponse),

  completeProfile: (data: { email: string; role: 'user' | 'volunteer'; password?: string }) =>
    api<UserResponse>('/auth/complete-profile', {
      method: 'POST',
      body: JSON.stringify(data),
    }).then(toUser),

  forgotPassword: (email: string) =>
    api<{ detail: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, newPassword: string) =>
    api<{ detail: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password: newPassword }),
    }),

  setPassword: (newPassword: string) =>
    api<{ detail: string }>('/auth/set-password', {
      method: 'POST',
      body: JSON.stringify({ new_password: newPassword }),
    }),

  login: (email: string, password: string) =>
    api<TokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }).then(userFromTokenResponse),

  register: (
    email: string,
    name: string,
    password: string,
    contacts: User['contacts'],
    signupRole: 'user' | 'volunteer' = 'user',
  ) =>
    api<TokenResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, name, password, contacts, role: signupRole }),
    }).then(userFromTokenResponse),

  me: () => api<UserResponse>('/auth/me').then(toUser),

  updateProfile: (data: {
    name?: string;
    email?: string;
    contacts?: User['contacts'];
    avatar?: string;
    role?: 'user' | 'volunteer';
  }) =>
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
    const res = await uploadMultipart('/auth/avatar-upload', file, {
      errorFallback: 'Не удалось загрузить аватар',
    });
    const data = (await res.json()) as { avatar: string };
    return data.avatar;
  },

  logout: async () => {
    try {
      await api<void>('/auth/logout', { method: 'POST' });
    } catch {
      /* Локальный выход важнее: cookie могла уже сброситься или сеть недоступна. */
    } finally {
      clearLegacyToken();
    }
  },
};

