import { api } from '@/shared/api/http';

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

