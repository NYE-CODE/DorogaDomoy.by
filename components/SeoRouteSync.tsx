import { useEffect } from 'react';
import { useLocation } from 'react-router';
import {
  applySeo,
  canonicalUrlFromPath,
  ensurePublisherMeta,
  isAsyncSeoPath,
  isPrivateSeoPath,
  SEO_HOME_DESCRIPTION,
  SEO_HOME_TITLE,
  SEO_KEYWORDS,
  SEO_ROBOTS_PRIVATE,
  SEO_ROBOTS_PUBLIC,
  SEO_SEARCH_DESCRIPTION,
  SEO_SEARCH_TITLE,
  SEO_TERMS_DESCRIPTION,
  SEO_TERMS_TITLE,
} from '../utils/seo';

let publisherEnsured = false;

/**
 * Синхронизирует canonical, robots и базовые title/description по маршруту.
 * Страницы с данными (/pet/:id, /blog/:slug, …) дополняют мету через applySeo.
 */
export function SeoRouteSync() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (!publisherEnsured) {
      ensurePublisherMeta();
      publisherEnsured = true;
    }

    const canonical = canonicalUrlFromPath(pathname);
    const privateRoute = isPrivateSeoPath(pathname);
    const robots = privateRoute ? SEO_ROBOTS_PRIVATE : SEO_ROBOTS_PUBLIC;

    if (privateRoute) {
      applySeo({
        canonicalUrl: canonical,
        robots,
        keywords: SEO_KEYWORDS,
      });
      return;
    }

    applySeo({ canonicalUrl: canonical, robots, keywords: SEO_KEYWORDS });

    if (isAsyncSeoPath(pathname)) {
      return;
    }

    if (pathname === '/') {
      applySeo({
        title: SEO_HOME_TITLE,
        description: SEO_HOME_DESCRIPTION,
        canonicalUrl: canonical,
        robots,
        keywords: SEO_KEYWORDS,
      });
      return;
    }

    if (pathname === '/search') {
      applySeo({
        title: SEO_SEARCH_TITLE,
        description: SEO_SEARCH_DESCRIPTION,
        canonicalUrl: canonical,
        robots,
        keywords: SEO_KEYWORDS,
      });
      return;
    }

    if (pathname === '/terms') {
      applySeo({
        title: SEO_TERMS_TITLE,
        description: SEO_TERMS_DESCRIPTION,
        canonicalUrl: canonical,
        robots,
        keywords: SEO_KEYWORDS,
      });
      return;
    }

    if (pathname === '/blog') {
      return;
    }

    applySeo({
      title: 'DorogaDomoy.by — Дорога Домой',
      description: SEO_HOME_DESCRIPTION,
      canonicalUrl: canonical,
      robots,
      keywords: SEO_KEYWORDS,
    });
  }, [pathname]);

  return null;
}
