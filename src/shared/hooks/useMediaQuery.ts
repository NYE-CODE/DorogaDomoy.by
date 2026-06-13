import { useEffect, useState } from 'react';

/**
 * Подписка на CSS media query. SSR-safe: начальное значение — defaultValue.
 */
export function useMediaQuery(query: string, defaultValue = false): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return defaultValue;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** Breakpoint mobile: max-width 767px (совпадает с legacy use-mobile). */
export const MOBILE_MEDIA_QUERY = '(max-width: 767px)';

/** Breakpoint desktop lg: min-width 1024px. */
export const DESKTOP_LG_MEDIA_QUERY = '(min-width: 1024px)';
