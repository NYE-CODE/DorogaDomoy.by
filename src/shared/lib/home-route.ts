/** Режим отображения поиска: список или карта. */
export const SEARCH_LAYOUT_STORAGE_KEY = 'dorogadomoy-search-layout';

export type SearchLayoutMode = 'list' | 'map';

/** Основной маршрут приложения после «домой» (не маркетинговый `/`). */
export function getHomePath(): '/search' {
  return '/search';
}

/** Логотип всегда ведёт на маркетинговый лендинг. */
export function getLogoHref(): '/' {
  return '/';
}

export function readSearchLayoutMode(): SearchLayoutMode {
  if (typeof window === 'undefined') return 'list';
  try {
    const saved = window.localStorage.getItem(SEARCH_LAYOUT_STORAGE_KEY);
    if (saved === 'list' || saved === 'map') return saved;
    /* Миграция со старого split */
    if (saved === 'split') return 'list';
    return 'list';
  } catch {
    return 'list';
  }
}

export function saveSearchLayoutMode(mode: SearchLayoutMode): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SEARCH_LAYOUT_STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}
