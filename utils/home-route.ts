/**
 * Режим «домашнего» экрана приложения (поиск потеряшек vs приюты).
 * Должен совпадать с лендингом и нижней навигацией.
 */
export const HOME_MODE_STORAGE_KEY = 'dorogadomoy-home-mode';

export type AppHomeMode = 'search' | 'shelters';

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
