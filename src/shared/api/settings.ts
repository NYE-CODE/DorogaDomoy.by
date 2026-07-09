import { api } from '@/shared/api/http';

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
  help_volunteer_url?: string;
}

export const settingsApi = {
  get: () => api<PlatformSettings>('/settings'),

  update: (data: Partial<PlatformSettings>) =>
    api<PlatformSettings>('/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

