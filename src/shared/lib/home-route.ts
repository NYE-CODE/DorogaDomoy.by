/** Режим отображения поиска: карта+список, только список или только карта. */
export const SEARCH_LAYOUT_STORAGE_KEY = 'dorogadomoy-search-layout';

export type SearchLayoutMode = 'split' | 'list' | 'map';

/** Основной маршрут приложения после «домой» (не маркетинговый `/`). */
export function getHomePath(): '/search' {
  return '/search';
}

/** Логотип всегда ведёт на маркетинговый лендинг. */
export function getLogoHref(): '/' {
  return '/';
}

export function readSearchLayoutMode(): SearchLayoutMode {
  if (typeof window === 'undefined') return 'split';
  try {
    const saved = window.localStorage.getItem(SEARCH_LAYOUT_STORAGE_KEY);
    if (saved === 'list' || saved === 'map' || saved === 'split') return saved;
    return 'split';
  } catch {
    return 'split';
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
