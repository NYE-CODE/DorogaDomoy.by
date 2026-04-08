import { useEffect } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import {
  applySeo,
  canonicalUrlFromPath,
  SEO_KEYWORDS,
  SEO_ROBOTS_PRIVATE,
  truncateMetaDescription,
} from '../utils/seo';

export default function NotFoundPage() {
  const { t } = useI18n();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const path = window.location.pathname + window.location.search;
    applySeo({
      title: `${t.notFoundPage.title} | DorogaDomoy.by`,
      description: truncateMetaDescription(`${t.notFoundPage.description} DorogaDomoy.by.`),
      canonicalUrl: canonicalUrlFromPath(path.split('?')[0] || '/'),
      robots: SEO_ROBOTS_PRIVATE,
      keywords: SEO_KEYWORDS,
    });
  }, [t.notFoundPage.title, t.notFoundPage.description]);

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="relative mx-auto w-40 h-40 mb-6">
          <div className="absolute inset-0 flex items-center justify-center text-8xl">
            🐾
          </div>
          <div className="absolute -bottom-1 -right-1 w-14 h-14 bg-red-100 dark:bg-red-950/50 rounded-full flex items-center justify-center">
            <Search className="w-7 h-7 text-red-500" />
          </div>
        </div>

        <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-2">404</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-1">{t.notFoundPage.title}</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-8">
          {t.notFoundPage.description}
        </p>

        <a
          href="/search"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.notFoundPage.toMain}
        </a>
      </div>
    </div>
  );
}
