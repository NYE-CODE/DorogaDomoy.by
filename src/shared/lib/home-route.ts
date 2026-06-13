/**
 * Режим «домашнего» экрана приложения (поиск потеряшек vs приюты).
 * Должен совпадать с лендингом и нижней навигацией.
 */
export const HOME_MODE_STORAGE_KEY = 'dorogadomoy-home-mode';

/** Пользователь уже заходил в рабочее приложение (/search или /shelters). */
export const APP_ENTERED_STORAGE_KEY = 'dorogadomoy-app-entered';

/** Режим отображения поиска: карта+список или только список (a11y). */
export const SEARCH_LAYOUT_STORAGE_KEY = 'dorogadomoy-search-layout';

/** Coachmark переключателя режима search/shelters уже показан. */
export const MODE_COACHMARK_STORAGE_KEY = 'dorogadomoy-mode-coachmark-seen';

export type AppHomeMode = 'search' | 'shelters';

export type SearchLayoutMode = 'split' | 'list';

/** Маршрут основного приложения для текущего режима (не маркетинговый `/`). */
export function getHomePath(): '/search' | '/shelters' {
  if (typeof window === 'undefined') return '/search';
  try {
    const saved = window.localStorage.getItem(HOME_MODE_STORAGE_KEY);
    return saved === 'shelters' ? '/shelters' : '/search';
  } catch {
    return '/search';
  }
}

/** Логотип всегда ведёт на маркетинговый лендинг. */
export function getLogoHref(): '/' {
  return '/';
}

/** Режим по текущему маршруту приложения (если однозначно определяется). */
export function inferHomeModeFromPath(pathname: string): AppHomeMode | null {
  if (pathname === '/shelters' || pathname.startsWith('/shelters/')) return 'shelters';
  if (pathname.startsWith('/shelter-pet/')) return 'shelters';
  if (pathname.startsWith('/my-shelters')) return 'shelters';
  if (pathname.startsWith('/match/')) return 'shelters';
  if (pathname === '/search' || pathname.startsWith('/search')) return 'search';
  if (pathname === '/create' || pathname.startsWith('/create')) return 'search';
  if (pathname.startsWith('/edit/')) return 'search';
  return null;
}

/** Какой режим показать на лендинге после клика по логотипу. */
export function resolveHomeModeForLanding(
  pathname: string,
  toggleMode?: AppHomeMode,
): AppHomeMode {
  return inferHomeModeFromPath(pathname) ?? toggleMode ?? (getHomePath() === '/shelters' ? 'shelters' : 'search');
}

export function persistHomeMode(mode: AppHomeMode): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(HOME_MODE_STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}

export function markAppEntered(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(APP_ENTERED_STORAGE_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function hasEnteredApp(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(APP_ENTERED_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function readSearchLayoutMode(): SearchLayoutMode {
  if (typeof window === 'undefined') return 'split';
  try {
    const saved = window.localStorage.getItem(SEARCH_LAYOUT_STORAGE_KEY);
    return saved === 'list' ? 'list' : 'split';
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

export function hasSeenModeCoachmark(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(MODE_COACHMARK_STORAGE_KEY) === '1';
  } catch {
    return true;
  }
}

export function markModeCoachmarkSeen(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(MODE_COACHMARK_STORAGE_KEY, '1');
  } catch {
    /* ignore */
  }
}
