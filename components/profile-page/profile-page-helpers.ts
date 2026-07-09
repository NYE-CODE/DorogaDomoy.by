import { API_BASE } from '../../api/client';

/** Только https://t.me / telegram.me — без javascript: и посторонних доменов. */
export function sanitizeTelegramBotUrl(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== 'https:') return null;
    if (u.username || u.password) return null;
    const h = u.hostname.toLowerCase();
    if (h !== 't.me' && h !== 'telegram.me' && h !== 'www.telegram.me') return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function resolveAvatarUrl(avatar?: string): string {
  if (!avatar) return '';
  if (avatar.startsWith('http') || avatar.startsWith('data:')) return avatar;
  return `${API_BASE}${avatar}`;
}

export function formatProfileCountdown(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const s = Math.floor(sec);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

export function saveUserLocation(loc: { lat: number; lng: number }, city?: string) {
  try {
    const toSave: { lat: number; lng: number; city?: string } = { lat: loc.lat, lng: loc.lng };
    if (city) toSave.city = city;
    localStorage.setItem('pet_finder_user_location', JSON.stringify(toSave));
  } catch (err: unknown) {
    console.warn('[ProfilePage] saveUserLocation storage failed', err);
  }
}
