import type { User } from '@/entities/user/model/types';
import { api } from '@/shared/api/http';
import { toUser, type UserResponse } from '@/shared/api/auth';

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

