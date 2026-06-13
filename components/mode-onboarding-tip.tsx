import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { Building2, Search, X } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import {
  getHomePath,
  hasSeenModeCoachmark,
  markModeCoachmarkSeen,
} from '@/shared/lib/home-route';

export function ModeOnboardingTip() {
  const { pathname } = useLocation();
  const { t } = useI18n();
  const tip = t.onboarding.modeSwitch;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pathname !== '/search' && pathname !== '/shelters') {
      setVisible(false);
      return;
    }
    if (hasSeenModeCoachmark()) {
      setVisible(false);
      return;
    }
    const timer = window.setTimeout(() => setVisible(true), 600);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  if (!visible) return null;

  const dismiss = () => {
    markModeCoachmarkSeen();
    setVisible(false);
  };

  const isShelters = getHomePath() === '/shelters';

  return (
    <div
      role="dialog"
      aria-labelledby="mode-coachmark-title"
      aria-describedby="mode-coachmark-desc"
      className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md rounded-2xl border border-border bg-card p-4 shadow-xl md:bottom-6 md:left-auto md:right-6"
    >
      <div className="flex gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          {isShelters ? <Building2 className="size-5" /> : <Search className="size-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p id="mode-coachmark-title" className="text-sm font-semibold text-foreground">
            {tip.title}
          </p>
          <p id="mode-coachmark-desc" className="mt-1 text-sm text-muted-foreground">
            {tip.description}
          </p>
          <button
            type="button"
            onClick={dismiss}
            className="mt-3 text-sm font-medium text-primary hover:underline"
          >
            {tip.gotIt}
          </button>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={t.common.close}
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
