/**
 * API client for DorogaDomoy.by backend.
 * `VITE_API_URL` — origin сервера (без `/api/v1`): статика `/uploads`, абсолютные пути фото.
 * JSON API: `/api/v1` (см. `API_V1_BASE`).
 *
 * В production, если хост страницы совпадает с хостом из VITE (включая пара www ↔ apex),
 * используется пустой origin → запросы идут на тот же host, что открыл пользователь.
 * Так Safari не ломает CORS/куки из‑за рассинхрона www и канонического домена в билде.
 */
export { API_BASE, API_V1_BASE } from '@/shared/api/base';
export { api, uploadMultipart } from '@/shared/api/http';
export * from '@/shared/api/auth';
export * from '@/shared/api/pets';
export * from '@/shared/api/users';
export * from '@/shared/api/rewards';
export * from '@/shared/api/reports';
export * from '@/shared/api/feature-flags';
export * from '@/shared/api/settings';
export * from '@/shared/api/telegram';
export * from '@/shared/api/notifications';
export * from '@/shared/api/media';
export * from '@/shared/api/blog';
export * from '@/shared/api/partners';
export * from '@/shared/api/partner-ads';
export * from '@/shared/api/faq';
export * from '@/shared/api/help';
export * from '@/shared/api/profile-pets';
export * from '@/shared/api/sightings';
export * from '@/shared/api/shelters';
