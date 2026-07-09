import type { SightingItem } from '@/shared/api/client';
import { PLACEHOLDER_PRINT_FLYER } from '@/shared/lib/placeholder-images';

export const PRINT_PLACEHOLDER_IMAGE = PLACEHOLDER_PRINT_FLYER;

export function escapeHtml(value: string | null | undefined): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function isAbortError(e: unknown): boolean {
  if (e instanceof DOMException && e.name === 'AbortError') return true;
  if (e instanceof Error && e.name === 'AbortError') return true;
  return false;
}

export function getSafeImageUrl(url?: string): string {
  if (!url) return PRINT_PLACEHOLDER_IMAGE;
  if (url.startsWith('data:image/')) return url;
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : PRINT_PLACEHOLDER_IMAGE;
  } catch {
    return PRINT_PLACEHOLDER_IMAGE;
  }
}

export function createSightingPopupContent(seenLabel: string, sighting: SightingItem): HTMLDivElement {
  const container = document.createElement('div');
  container.className = 'text-sm';
  const title = document.createElement('strong');
  const seenAt = new Date(sighting.seen_at);
  title.textContent =
    `${seenLabel} ${seenAt.toLocaleDateString('ru-RU')} ` +
    seenAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  container.appendChild(title);
  if (sighting.comment) {
    const comment = document.createElement('div');
    const trimmed = sighting.comment.slice(0, 80);
    comment.textContent = `${trimmed}${sighting.comment.length > 80 ? '?' : ''}`;
    container.appendChild(comment);
  }
  return container;
}
