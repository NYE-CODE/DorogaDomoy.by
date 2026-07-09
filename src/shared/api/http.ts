/**
 * HTTP helpers for DorogaDomoy.by API.
 */
import { API_V1_BASE } from '@/shared/api/base';
import {
  clearLegacyToken,
  createApiError,
  formatApiErrorBody,
  logApiError,
} from '@/shared/api/interceptors';

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  let res: Response;
  try {
    res = await fetch(`${API_V1_BASE}${path}`, {
      ...options,
      credentials: 'include',
      headers,
    });
  } catch (error) {
    logApiError(path, error);
    throw error;
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw createApiError({ status: res.status, statusText: res.statusText, body });
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

/** Загрузка multipart/form-data с cookie-сессией и единой обработкой 401/413. */
export async function uploadMultipart(
  path: string,
  file: File,
  opts?: { field?: string; tooLargeMessage?: string; errorFallback?: string },
): Promise<Response> {
  const formData = new FormData();
  formData.append(opts?.field ?? 'file', file);
  const res = await fetch(`${API_V1_BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  if (res.status === 401) {
    clearLegacyToken();
    throw new Error('Сессия истекла');
  }
  if (res.status === 413 && opts?.tooLargeMessage) {
    throw new Error(opts.tooLargeMessage);
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(formatApiErrorBody(err, opts?.errorFallback ?? `Ошибка загрузки (${res.status})`));
  }
  return res;
}
