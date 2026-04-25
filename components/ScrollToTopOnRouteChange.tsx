import { useEffect } from 'react';
import { useLocation } from 'react-router';

function tryScrollToHash(hash: string): boolean {
  if (!hash || hash === '#') return false;
  const raw = hash.slice(1);
  if (!raw) return false;
  let id: string;
  try {
    id = decodeURIComponent(raw);
  } catch {
    id = raw;
  }
  const el = document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return true;
}

/**
 * Без якоря — вверх при смене пути (как раньше).
 * С якорем — прокрутка к `#id` (SPA: React Router сам не скроллит; плюс lazy-лендинг
 * может дорисовать секции позже — несколько попыток).
 */
export function ScrollToTopOnRouteChange() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash || hash === '#') {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      return;
    }

    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const maxAttempts = 45;

    const tick = (attempt: number) => {
      if (cancelled || attempt >= maxAttempts) return;
      if (tryScrollToHash(hash)) return;
      timeouts.push(window.setTimeout(() => tick(attempt + 1), 50));
    };

    timeouts.push(window.setTimeout(() => tick(0), 0));

    return () => {
      cancelled = true;
      timeouts.forEach((tid) => clearTimeout(tid));
    };
  }, [pathname, hash]);

  return null;
}
