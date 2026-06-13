function trimTrailingSlash(s: string): string {
  return s.replace(/\/+$/, '');
}

function hostKey(hostname: string): string {
  return hostname.replace(/^www\./i, '');
}

/** Origin бэкенда с учётом same-host prod fallback. */
export function resolveApiBase(): string {
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

/** Origin бэкенда для `/uploads/…` (в prod может быть ''). */
export const API_BASE = resolveApiBase();

/** Базовый URL REST API v1. */
export const API_V1_BASE = API_BASE ? `${API_BASE}/api/v1` : '/api/v1';

export const LEGACY_TOKEN_KEY = 'pet_finder_token';
