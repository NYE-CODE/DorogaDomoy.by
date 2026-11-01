import { MapPin } from 'lucide-react';
import { useScrollLock } from './ui/use-scroll-lock';
import { useI18n } from '../context/I18nContext';
import { cn } from '@/shared/lib/classNames';
import { surfaceCtaOutline, surfaceCtaPrimary } from '@/shared/styles/surface-classes';
import '../landing/styles/theme-scoped.css';

interface CityDetectPopupProps {
  open: boolean;
  detectedCity: string;
  onConfirm: () => void;
  onReject: () => void;
}

export function CityDetectPopup({ open, detectedCity, onConfirm, onReject }: CityDetectPopupProps) {
  const { t } = useI18n();
  useScrollLock(open);

  if (!open) return null;

  return (
    <div className="landing-theme fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="city-detect-title"
        className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card shadow-card"
      >
        <div className="border-b border-border/80 bg-card px-5 pb-4 pt-5 text-center sm:px-6">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MapPin className="size-6" aria-hidden />
          </div>
          <h2 id="city-detect-title" className="typo-h2 font-display text-foreground">
            {t.cityDetect.yourCity} {detectedCity}
            {t.cityDetect.question}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t.cityDetect.showAds}</p>
        </div>

        <div className="flex gap-3 bg-landing px-5 py-5 sm:px-6">
          <button type="button" onClick={onReject} className={cn(surfaceCtaOutline, 'flex-1')}>
            {t.cityDetect.no}
          </button>
          <button type="button" onClick={onConfirm} className={cn(surfaceCtaPrimary, 'flex-1')}>
            {t.cityDetect.yes}
          </button>
        </div>
      </div>
    </div>
  );
}
