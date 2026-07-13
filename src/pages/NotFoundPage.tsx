import { useEffect } from 'react';
import { Link } from 'react-router';
import { MapPinOff } from 'lucide-react';
import { useI18n } from '@/app/providers/I18nContext';
import { Header } from '@/widgets/layout/Header';
import { Footer } from '@/widgets/layout/Footer';
import { Button } from '@/shared/ui/button';
import { appPrimaryCtaClass } from '@/shared/styles/cta-classes';
import { getHomePath, getLogoHref } from '@/shared/lib/home-route';
import { ERROR_REPORT_TELEGRAM_URL } from '@/shared/lib/support-links';
import {
  applySeo,
  canonicalUrlFromPath,
  SEO_KEYWORDS,
  SEO_ROBOTS_PRIVATE,
  truncateMetaDescription,
} from '@/shared/lib/seo';

export default function NotFoundPage() {
  const { t } = useI18n();
  const nf = t.notFoundPage;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const path = window.location.pathname + window.location.search;
    applySeo({
      title: `${nf.title} | DorogaDomoy.by`,
      description: truncateMetaDescription(`${nf.description} DorogaDomoy.by.`),
      canonicalUrl: canonicalUrlFromPath(path.split('?')[0] || '/'),
      robots: SEO_ROBOTS_PRIVATE,
      keywords: SEO_KEYWORDS,
    });
  }, [nf.title, nf.description]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header showCitySelector />

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <div className="max-w-md space-y-5 text-center">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
            <MapPinOff className="size-10" aria-hidden />
          </div>

          <div className="space-y-2">
            <p className="typo-display text-primary/80">404</p>
            <h1 className="typo-h2">{nf.title}</h1>
            <p className="text-muted-foreground">{nf.description}</p>
          </div>

          <p className="text-sm text-muted-foreground">
            {nf.reportPrefix}
            <a
              href={ERROR_REPORT_TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:text-primary-hover hover:underline dark:text-primary-soft dark:hover:text-primary-soft-hover"
            >
              {nf.reportLink}
            </a>
            {nf.reportSuffix}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <Button type="button" className={appPrimaryCtaClass} asChild>
              <Link to={getHomePath()}>{nf.toMain}</Link>
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link to={getLogoHref()}>{nf.toLanding}</Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
