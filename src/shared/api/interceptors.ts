import { LEGACY_TOKEN_KEY } from '@/shared/api/base';

/** Удаляет legacy JWT из localStorage (до cookie-only auth). */
export function clearLegacyToken(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  } catch {
    /* quota / private mode — не должно ломать login/logout после 200 */
  }
}

/** Сообщение для UI из тела ошибки FastAPI без утечки полного JSON. */
export function formatApiErrorBody(errBody: unknown, fallback: string): string {
  if (!errBody || typeof errBody !== 'object') return fallback;
  const detail = (errBody as Record<string, unknown>).detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const parts = detail.flatMap((item) => {
      if (typeof item === 'string') return [item];
      if (item && typeof item === 'object' && 'msg' in item) {
        const m = (item as { msg?: unknown }).msg;
        return typeof m === 'string' ? [m] : [];
      }
      return [];
    });
    if (parts.length > 0) return parts.join(' · ');
  }
  return fallback;
}

export interface ApiErrorContext {
  status: number;
  statusText: string;
  body: unknown;
}

/** Преобразует HTTP-ответ в Error с человекочитаемым сообщением. */
export function createApiError({ status, statusText, body }: ApiErrorContext): Error {
  if (status === 401) {
    clearLegacyToken();
    return new Error(formatApiErrorBody(body, 'Сессия истекла'));
  }
  if (status === 413) {
    return new Error('Слишком большой размер данных. Уменьшите фото и попробуйте снова.');
  }
  if (status === 429) {
    return new Error(formatApiErrorBody(body, 'Слишком много запросов. Подождите и попробуйте снова.'));
  }
  const fallback =
    status === 422
      ? 'Проверьте введённые данные'
      : `Запрос не выполнен (${status}${statusText ? `: ${statusText}` : ''})`;
  return new Error(formatApiErrorBody(body, fallback));
}

/** Логирование API-ошибок (dev only). */
export function logApiError(path: string, error: unknown): void {
  if (import.meta.env.DEV) {
    console.warn('[api]', path, error);
  }
}
