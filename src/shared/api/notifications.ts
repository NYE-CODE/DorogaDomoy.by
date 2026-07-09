import { api } from '@/shared/api/http';

export interface NotificationSettingsData {
  notifications_enabled: boolean;
  notification_radius_km: number;
  notify_similar_matches: boolean;
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
    api<NotificationItem>(`/notifications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_read: true }),
    }),
};

