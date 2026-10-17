import { isMobileTelegramAuthPath } from '@/shared/lib/mobile-telegram-auth-path';

/** Публичный URL сайта для canonical и мета (без слэша в конце). */
const RAW_SITE =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SITE_URL?.trim()) ||
  'https://dorogadomoy.by';

export const SEO_PUBLISHER = 'DorogaDomoy.by';

/** Релевантные формулировки для РБ / Яндекс; без переспама. */
export const SEO_KEYWORDS =
  'пропавшая собака, пропавший кот, потерялся питомец, найдена собака, найден кот, поиск питомца, объявления животные Беларусь, Минск, приюты Беларусь, DorogaDomoy';

export const SEO_ROBOTS_PUBLIC =
  'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

export const SEO_ROBOTS_PRIVATE = 'noindex, nofollow';

/** Заголовок главной — тот же текст, что в index.html, чтобы скрипт его не подменял. */
export const SEO_HOME_TITLE =
  'Пропавшие и найденные животные в Беларуси — объявления и карта | DorogaDomoy.by';

/** Описание главной и дефолт. */
export const SEO_HOME_DESCRIPTION =
  'Разместите объявление о пропаже или находке собаки или кошки. Карта по городам Беларуси, контакты владельца, блог с советами. Бесплатно на DorogaDomoy.by.';

export const SEO_SEARCH_TITLE =
  'Поиск пропавших и найденных питомцев — карта Беларуси | DorogaDomoy.by';

export const SEO_SEARCH_DESCRIPTION =
  'Карта и список объявлений: пропали и нашли собак, кошек и других питомцев. Фильтр по городу, статусу и виду животного на DorogaDomoy.by.';

export const SEO_TERMS_TITLE = 'Условия использования сервиса | DorogaDomoy.by';

export const SEO_TERMS_DESCRIPTION =
  'Правила платформы DorogaDomoy.by: публикация объявлений, персональные данные и ответственность пользователей.';

export const SEO_PRIVACY_TITLE = 'Политика конфиденциальности | DorogaDomoy.by';

export const SEO_PRIVACY_DESCRIPTION =
  'Как DorogaDomoy.by обрабатывает персональные данные: регистрация, объявления, контакты и cookies.';

export const SEO_DELETE_ACCOUNT_TITLE = 'Удаление аккаунта | DorogaDomoy.by';

export const SEO_DELETE_ACCOUNT_DESCRIPTION =
  'Как удалить аккаунт DorogaDomoy.by в приложении, на сайте или письмом без входа. Что стирается и в какой срок.';

export function getSiteOrigin(): string {
  try {
    return new URL(RAW_SITE).origin;
  } catch {
    return 'https://dorogadomoy.by';
  }
}

export function canonicalUrlFromPath(pathname: string): string {
  const origin = getSiteOrigin();
  if (!pathname || pathname === '/') return `${origin}/`;
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${origin}${path}`;
}

export function truncateMetaDescription(text: string, maxLen = 158): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= maxLen) return flat;
  const cut = flat.slice(0, maxLen - 1).trimEnd();
  return `${cut}…`;
}

function upsertMetaByName(name: string, content: string) {
  let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertMetaByProperty(property: string, content: string) {
  let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLinkCanonical(href: string) {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

function absoluteSeoUrl(url: string): string {
  const raw = url.trim();
  if (!raw) return `${getSiteOrigin()}/logo.png`;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('//')) return `https:${raw}`;
  const path = raw.startsWith('/') ? raw : `/${raw}`;
  return `${getSiteOrigin()}${path}`;
}

export type ApplySeoOptions = {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  robots?: string;
  /** Передайте null, чтобы не менять keywords; строка — выставить. */
  keywords?: string | null;
  /** Абсолютный или относительный URL превью (OG / Twitter). */
  imageUrl?: string | null;
  ogType?: string;
};

/** Обновляет document и мета-теги в &lt;head&gt; (SPA). */
export function applySeo(opts: ApplySeoOptions) {
  if (opts.title !== undefined) document.title = opts.title;
  if (opts.description !== undefined) upsertMetaByName('description', opts.description);
  if (opts.robots !== undefined) upsertMetaByName('robots', opts.robots);
  if (opts.keywords !== undefined && opts.keywords !== null) {
    upsertMetaByName('keywords', opts.keywords);
  }
  if (opts.canonicalUrl !== undefined) upsertLinkCanonical(opts.canonicalUrl);

  const title = opts.title;
  const description = opts.description;
  const pageUrl = opts.canonicalUrl;
  const image =
    opts.imageUrl === null
      ? null
      : opts.imageUrl !== undefined
        ? absoluteSeoUrl(opts.imageUrl)
        : undefined;

  if (title !== undefined) {
    upsertMetaByProperty('og:title', title);
    upsertMetaByName('twitter:title', title);
  }
  if (description !== undefined) {
    upsertMetaByProperty('og:description', description);
    upsertMetaByName('twitter:description', description);
  }
  if (pageUrl !== undefined) {
    upsertMetaByProperty('og:url', pageUrl);
  }
  if (opts.ogType !== undefined) {
    upsertMetaByProperty('og:type', opts.ogType);
  } else if (title !== undefined || description !== undefined) {
    upsertMetaByProperty('og:type', 'website');
  }
  upsertMetaByProperty('og:site_name', SEO_PUBLISHER);
  upsertMetaByProperty('og:locale', 'ru_BY');
  if (image) {
    upsertMetaByProperty('og:image', image);
    upsertMetaByProperty('og:image:alt', title || SEO_PUBLISHER);
    upsertMetaByName('twitter:card', 'summary_large_image');
    upsertMetaByName('twitter:image', image);
  }
}

/** Publisher и keywords один раз при старте (дополняют index.html). */
export function ensurePublisherMeta() {
  upsertMetaByName('publisher', SEO_PUBLISHER);
  upsertMetaByName('keywords', SEO_KEYWORDS);
}

export function isPrivateSeoPath(pathname: string): boolean {
  if (isMobileTelegramAuthPath(pathname)) return true;
  if (pathname.startsWith('/admin')) return true;
  if (pathname.startsWith('/profile')) return true;
  if (pathname.startsWith('/my-ads')) return true;
  if (pathname.startsWith('/my-pets')) return true;
  if (pathname.startsWith('/my-shelters')) return true;
  if (pathname.startsWith('/settings')) return true;
  if (pathname === '/favorites') return true;
  if (pathname === '/create') return true;
  if (pathname.startsWith('/edit/')) return true;
  return false;
}

/** Маршруты, где title/description задаёт страница после загрузки данных. */
export function isAsyncSeoPath(pathname: string): boolean {
  if (pathname.startsWith('/blog/') && pathname !== '/blog') return true;
  if (/^\/pet\/[^/]+$/.test(pathname)) return true;
  if (/^\/shelter-pet\/[^/]+$/.test(pathname)) return true;
  if (/^\/city\/[^/]+$/.test(pathname)) return true;
  if (/^\/user\/[^/]+$/.test(pathname)) return true;
  if (/^\/pet-profile\/[^/]+$/.test(pathname)) return true;
  if (/^\/shelters\/[^/]+$/.test(pathname)) return true;
  return false;
}
