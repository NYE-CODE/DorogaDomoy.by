import { useEffect } from 'react';
import { AlertCircle, Download, FileText, QrCode, X } from 'lucide-react';
import { cn } from '@/shared/lib/classNames';
import {
  surfaceChoiceCard,
  surfaceChoiceIconBrand,
  surfaceChoiceIconMuted,
  surfaceIconButton,
} from '@/shared/styles/surface-classes';
import { typoH3 } from '@/shared/styles/typography-classes';
import '../../../landing/styles/theme-scoped.css';
import type { PetDetailT } from './pet-detail-archive-badge';

export interface PetDetailFlyerModalProps {
  t: PetDetailT;
  onClose: () => void;
  onFlyerQR: () => void;
  onFlyerClassic: () => void;
}

export function PetDetailFlyerModal({ t, onClose, onFlyerQR, onFlyerClassic }: PetDetailFlyerModalProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="landing-theme fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="flyer-modal-title"
      onClick={onClose}
    >
      <div
        className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 id="flyer-modal-title" className="font-display typo-h2 text-foreground">
            {t.petDetail.flyerModalTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={surfaceIconButton}
            aria-label={t.common.close}
          >
            <X size={22} aria-hidden />
          </button>
        </div>
        <p className="mb-8 text-muted-foreground">{t.petDetail.flyerModalIntro}</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          <button type="button" onClick={onFlyerQR} className={cn(surfaceChoiceCard, 'relative border-primary/40')}>
            <div className={surfaceChoiceIconBrand}>
              <QrCode size={28} aria-hidden />
            </div>
            <h3 className={cn(typoH3, 'font-display')}>{t.petDetail.flyerWithQR}</h3>
            <p className="text-sm text-muted-foreground">{t.petDetail.flyerWithQRDesc}</p>
            <div className="mt-1 flex items-center gap-2 font-medium text-primary">
              <Download size={18} aria-hidden />
              {t.petDetail.flyerDownload}
            </div>
            <div className="absolute right-3 top-3 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-landing-dark">
              {t.petDetail.flyerRecommended}
            </div>
          </button>
          <button type="button" onClick={onFlyerClassic} className={surfaceChoiceCard}>
            <div className={surfaceChoiceIconMuted}>
              <FileText size={28} aria-hidden />
            </div>
            <h3 className={cn(typoH3, 'font-display')}>{t.petDetail.flyerClassic}</h3>
            <p className="text-sm text-muted-foreground">{t.petDetail.flyerClassicDesc}</p>
            <div className="mt-1 flex items-center gap-2 font-medium text-muted-foreground transition-colors group-hover:text-primary">
              <Download size={18} aria-hidden />
              {t.petDetail.flyerDownload}
            </div>
          </button>
        </div>
        <div className="mt-6 border-t border-border pt-6">
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <AlertCircle size={18} className="mt-0.5 flex-shrink-0 text-primary" aria-hidden />
            <p>{t.petDetail.flyerHint}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
