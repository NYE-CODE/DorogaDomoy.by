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
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-background rounded-lg p-8 shadow-2xl max-w-2xl w-full mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="typo-h2">{t.petDetail.flyerModalTitle}</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground/80 hover:text-muted-foreground dark:hover:text-muted-foreground/50 transition-colors"
          >
            <X size={28} />
          </button>
        </div>
        <p className="text-muted-foreground mb-8">
          {t.petDetail.flyerModalIntro}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={onFlyerQR}
            className="group relative bg-gradient-to-br from-primary/10 to-white dark:from-orange-950/30 dark:to-background border-2 border-primary rounded-lg p-6 hover:shadow-xl transition-all duration-150 ease-in-out hover:scale-105 focus-within:ring-[3px] focus-within:ring-ring/50"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-primary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <QrCode size={40} className="text-white" />
              </div>
              <h3 className={`${typoH3} mb-2`}>{t.petDetail.flyerWithQR}</h3>
              <p className="text-muted-foreground text-sm mb-4">
                {t.petDetail.flyerWithQRDesc}
              </p>
              <div className="flex items-center gap-2 text-primary font-medium">
                <Download size={18} />
                {t.petDetail.flyerDownload}
              </div>
            </div>
            <div className="absolute top-3 right-3 bg-primary text-white text-xs px-2 py-1 rounded-full">
              {t.petDetail.flyerRecommended}
            </div>
          </button>
          <button
            onClick={onFlyerClassic}
            className="group relative bg-white dark:bg-card border-2 border-border rounded-lg p-6 hover:border-primary hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-muted group-hover:bg-primary-surface dark:group-hover:bg-orange-950/30 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-all">
                <FileText size={40} className="text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className={`${typoH3} mb-2`}>{t.petDetail.flyerClassic}</h3>
              <p className="text-muted-foreground text-sm mb-4">
                {t.petDetail.flyerClassicDesc}
              </p>
              <div className="flex items-center gap-2 text-muted-foreground group-hover:text-primary font-medium transition-colors">
                <Download size={18} />
                {t.petDetail.flyerDownload}
              </div>
            </div>
          </button>
        </div>
        <div className="mt-6 pt-6 border-t border-border">
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5 text-primary" />
            <p>{t.petDetail.flyerHint}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
