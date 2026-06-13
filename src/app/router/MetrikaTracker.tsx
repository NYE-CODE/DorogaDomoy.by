import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { YM_ID } from '@/shared/config';
import { hasAnalyticsConsent } from '@/shared/lib/cookie-consent';

/** Отправляет hit в Yandex.Metrika при смене маршрута SPA. */
export function MetrikaTracker() {
  const location = useLocation();

  useEffect(() => {
    if (!hasAnalyticsConsent()) return;
    if (typeof window !== 'undefined' && (window as unknown as { ym?: (...args: unknown[]) => void }).ym) {
      (window as unknown as { ym: (...args: unknown[]) => void }).ym(
        YM_ID,
        'hit',
        location.pathname + location.search,
      );
    }
  }, [location.pathname, location.search]);

  return null;
}
