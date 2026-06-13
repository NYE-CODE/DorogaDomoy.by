import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useI18n } from '@/app/providers/I18nContext';
import { Button } from '@/shared/ui/button';
import {
  initYandexMetrika,
  readCookieConsent,
  saveCookieConsent,
  type CookieConsentLevel,
} from '@/shared/lib/cookie-consent';

/** Баннер согласия на cookies: необходимые всегда, аналитика — только после «Принять все». */
export function CookieConsentBanner() {
  const { t } = useI18n();
  const c = t.cookieConsent;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = readCookieConsent();
    if (saved === 'all') {
      initYandexMetrika();
    }
    if (!saved) {
      setOpen(true);
    }
  }, []);

  const choose = (level: CookieConsentLevel) => {
    saveCookieConsent(level);
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-border bg-card/95 p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] backdrop-blur-sm pb-[calc(1rem+env(safe-area-inset-bottom,0px))] dark:bg-card/98"
    >
      <div className="page-container flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 max-w-3xl space-y-2">
          <h2 id="cookie-consent-title" className="text-base font-semibold text-foreground">
            {c.title}
          </h2>
          <p id="cookie-consent-desc" className="text-sm leading-relaxed text-muted-foreground">
            {c.description}{' '}
            <Link to="/privacy" className="font-medium text-primary underline-offset-4 hover:underline">
              {c.privacyLink}
            </Link>
            .
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => choose('necessary')}>
            {c.acceptNecessary}
          </Button>
          <Button type="button" className="w-full sm:w-auto" onClick={() => choose('all')}>
            {c.acceptAll}
          </Button>
        </div>
      </div>
    </div>
  );
}
