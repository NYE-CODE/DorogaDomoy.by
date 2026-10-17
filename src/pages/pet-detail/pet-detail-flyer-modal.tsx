import { useEffect } from 'react';
import { AlertCircle, Download, FileText, QrCode, X } from 'lucide-react';
import { typoH3 } from '@/shared/styles/typography-classes';
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
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="flyer-modal-title"
      onClick={onClose}
    >
      <div
        className="mx-auto w-full max-w-2xl rounded-lg border border-border bg-card p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 id="flyer-modal-title" className="typo-h2">
            {t.petDetail.flyerModalTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground/80 transition-colors hover:bg-muted hover:text-muted-foreground dark:hover:text-muted-foreground/50"
            aria-label={t.common.close}
          >
            <X size={28} aria-hidden />
          </button>
        </div>
        <p className="mb-8 text-muted-foreground">{t.petDetail.flyerModalIntro}</p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <button
            type="button"
            onClick={onFlyerQR}
            className="group relative rounded-lg border-2 border-primary bg-gradient-to-br from-primary/10 to-card p-6 transition-all duration-150 ease-in-out hover:scale-[1.02] hover:shadow-xl focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:from-primary/20 dark:to-card"
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-lg bg-primary transition-transform group-hover:scale-110">
                <QrCode size={40} className="text-white" aria-hidden />
              </div>
              <h3 className={`${typoH3} mb-2`}>{t.petDetail.flyerWithQR}</h3>
              <p className="mb-4 text-sm text-muted-foreground">{t.petDetail.flyerWithQRDesc}</p>
              <div className="flex items-center gap-2 font-medium text-primary">
                <Download size={18} aria-hidden />
                {t.petDetail.flyerDownload}
              </div>
            </div>
            <div className="absolute right-3 top-3 rounded-full bg-primary px-2 py-1 text-xs text-white">
              {t.petDetail.flyerRecommended}
            </div>
          </button>
          <button
            type="button"
            onClick={onFlyerClassic}
            className="group relative rounded-lg border-2 border-border bg-card p-6 transition-all duration-300 hover:scale-[1.02] hover:border-primary hover:shadow-xl focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-lg bg-muted transition-all group-hover:scale-110 group-hover:bg-primary-surface">
                <FileText
                  size={40}
                  className="text-muted-foreground transition-colors group-hover:text-primary"
                  aria-hidden
                />
              </div>
              <h3 className={`${typoH3} mb-2`}>{t.petDetail.flyerClassic}</h3>
              <p className="mb-4 text-sm text-muted-foreground">{t.petDetail.flyerClassicDesc}</p>
              <div className="flex items-center gap-2 font-medium text-muted-foreground transition-colors group-hover:text-primary">
                <Download size={18} aria-hidden />
                {t.petDetail.flyerDownload}
              </div>
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
