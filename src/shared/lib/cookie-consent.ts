import { YM_ID } from '@/shared/config';

export const COOKIE_CONSENT_STORAGE_KEY = 'dorogadomoy-cookie-consent';

/** `all` — аналитика (Metrika); `necessary` — только функциональные хранилища/cookies. */
export type CookieConsentLevel = 'all' | 'necessary';

export function readCookieConsent(): CookieConsentLevel | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    return value === 'all' || value === 'necessary' ? value : null;
  } catch {
    return null;
  }
}

export function hasAnalyticsConsent(): boolean {
  return readCookieConsent() === 'all';
}

let metrikaInitialized = false;

/** Подключает Yandex Metrika только после согласия на аналитику. */
export function initYandexMetrika(): void {
  if (typeof window === 'undefined' || metrikaInitialized) return;

  const w = window as Window & { ym?: (...args: unknown[]) => void };
  if (typeof w.ym === 'function') {
    metrikaInitialized = true;
    return;
  }

  w.ym =
    w.ym ||
    function (...args: unknown[]) {
      (w.ym!.a = w.ym!.a || []).push(args);
    };
  w.ym!.l = Date.now();

  for (let j = 0; j < document.scripts.length; j++) {
    if (document.scripts[j].src === 'https://mc.yandex.ru/metrika/tag.js') return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://mc.yandex.ru/metrika/tag.js?id=${YM_ID}`;
  document.head.appendChild(script);

  w.ym!(YM_ID, 'init', {
    ssr: true,
    webvisor: true,
    clickmap: true,
    ecommerce: 'dataLayer',
    referrer: document.referrer,
    url: location.href,
    accurateTrackBounce: true,
    trackLinks: true,
  });

  metrikaInitialized = true;
}

export function saveCookieConsent(level: CookieConsentLevel): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, level);
  } catch {
    /* ignore */
  }
  if (level === 'all') {
    initYandexMetrika();
  }
}
