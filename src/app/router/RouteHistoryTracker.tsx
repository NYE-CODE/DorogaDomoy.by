import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { CURRENT_ROUTE_KEY, PREV_ROUTE_KEY } from '@/shared/config';

/** Сохраняет предыдущий и текущий path в sessionStorage для back-навигации. */
export function RouteHistoryTracker() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const next = `${location.pathname}${location.search}`;
    const current = window.sessionStorage.getItem(CURRENT_ROUTE_KEY);
    if (current && current !== next) {
      window.sessionStorage.setItem(PREV_ROUTE_KEY, current);
    }
    window.sessionStorage.setItem(CURRENT_ROUTE_KEY, next);
  }, [location.pathname, location.search]);

  return null;
}
