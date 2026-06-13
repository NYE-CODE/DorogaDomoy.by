import { Link } from 'react-router';
import { ArrowRight, X } from 'lucide-react';
import { useState } from 'react';
import { useI18n } from '../../context/I18nContext';
import { getHomePath, hasEnteredApp } from '@/shared/lib/home-route';

const DISMISS_KEY = 'dorogadomoy-return-banner-dismissed';

export function ReturnToAppBanner() {
  const { t } = useI18n();
  const b = t.landing.returnToApp;
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return true;
    try {
      return window.sessionStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  if (!hasEnteredApp() || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      window.sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      role="region"
      aria-label={b.title}
      className="border-b border-primary/20 bg-primary/10 px-4 py-2.5"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <p className="text-sm text-foreground">
          <span className="font-medium">{b.title}</span>
          <span className="hidden sm:inline text-muted-foreground"> — {b.subtitle}</span>
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            to={getHomePath()}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {b.action}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-background/80 hover:text-foreground"
            aria-label={t.common.close}
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
