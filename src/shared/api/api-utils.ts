/** Shared API response helpers. */
import { API_BASE } from '@/shared/api/base';

export function resolvePhotoUrl(url: string): string {
  if (!url || url.startsWith('http') || url.startsWith('data:')) return url;
  return `${API_BASE}${url}`;
}

/**
 * FastAPI often returns UTC datetimes without timezone suffix.
 * For such values we explicitly treat them as UTC to avoid local-time shift.
 */
export function parseApiDate(value: string): Date {
  if (/[zZ]|[+\-]\d{2}:\d{2}$/.test(value)) {
    return new Date(value);
  }
  return new Date(`${value}Z`);
}
