import { Copy, Download, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Pet } from '@/entities/pet/model/types';
import type { PetShareBundle } from '@/shared/lib/pet-share-text';
import { copyText as copyToClipboard } from '@/shared/lib/copy-text';
import type { PetDetailT } from './pet-detail-archive-badge';
import type { InstagramGuideState } from './use-pet-detail-share';

export interface PetDetailInstagramGuideModalProps {
  pet: Pet;
  t: PetDetailT;
  instagramGuide: NonNullable<InstagramGuideState>;
  shareBundle: PetShareBundle;
  onClose: () => void;
}

export function PetDetailInstagramGuideModal({
  pet,
  t,
  instagramGuide,
  shareBundle,
  onClose,
}: PetDetailInstagramGuideModalProps) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="instagram-guide-title"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-card rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-start gap-4 mb-4">
            <h2 id="instagram-guide-title" className="typo-h1 pr-2">
              {t.petDetail.shareInstagramModalTitle}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-muted-foreground/80 hover:text-muted-foreground dark:hover:text-muted-foreground/50 hover:bg-muted shrink-0"
              aria-label={t.common.close}
            >
              <X size={22} />
            </button>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {t.petDetail.shareInstagramModalExplain}
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-foreground/90 mb-4">
            <li>{t.petDetail.shareInstagramModalStep1}</li>
            <li>{t.petDetail.shareInstagramModalStep2}</li>
            <li>
              {instagramGuide.variant === 'story'
                ? t.petDetail.shareInstagramModalStep3Story
                : t.petDetail.shareInstagramModalStep3Post}
            </li>
          </ol>
          {instagramGuide.variant !== 'story' && (
            <>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                {t.petDetail.shareInstagramModalCaptionLabel}
              </p>
              <textarea
                readOnly
                rows={4}
                value={shareBundle.textFull}
                className="w-full text-sm border border-border dark:border-border rounded-lg p-3 bg-muted/50 dark:bg-muted/50 text-foreground dark:text-foreground resize-y min-h-[80px]"
                onFocus={(e) => e.target.select()}
              />
              <button
                type="button"
                className="mt-2 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 h-10 rounded-lg border border-border dark:border-border text-sm font-medium text-foreground/90 dark:text-foreground hover:bg-muted/50"
                onClick={async () => {
                  if (await copyToClipboard(shareBundle.textFull)) {
                    toast.success(t.petDetail.shareCopiedFull);
                  } else toast.error(t.common.error);
                }}
              >
                <Copy className="w-4 h-4" />
                {t.petDetail.shareInstagramModalCopyText}
              </button>
            </>
          )}
          {instagramGuide.cardUrl ? (
            <div className="mt-5 pt-5 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                {t.petDetail.shareCardSection}
              </p>
              <img
                src={instagramGuide.cardUrl}
                alt="Card preview"
                className="w-full rounded-lg border border-border mb-3"
              />
              <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 px-4 h-10 rounded-lg bg-muted text-sm font-medium text-foreground hover:bg-muted dark:hover:bg-muted/80"
                  onClick={() => {
                    if (!instagramGuide.cardUrl) return;
                    const a = document.createElement('a');
                    a.href = instagramGuide.cardUrl;
                    a.download = `dorogadomoy-${pet.id}-${instagramGuide.variant === 'story' ? 'story' : 'feed'}.png`;
                    a.click();
                    toast.success(t.petDetail.shareCardSaved);
                  }}
                >
                  <Download className="w-4 h-4" />
                  {t.petDetail.shareCardDownloadBtn}
                </button>
              </div>
            </div>
          ) : null}
          <div className="mt-6 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              className="flex-1 h-12 rounded-lg bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white text-sm font-semibold hover:opacity-95 transition-opacity"
              onClick={() =>
                window.open(
                  `https://www.instagram.com${instagramGuide.openPath}`,
                  '_blank',
                  'noopener,noreferrer',
                )
              }
            >
              {t.petDetail.shareInstagramModalOpenIg}
            </button>
            <button
              type="button"
              className="flex-1 h-12 rounded-lg border border-border dark:border-border text-sm font-medium text-foreground/90 dark:text-foreground hover:bg-muted/50"
              onClick={onClose}
            >
              {t.petDetail.shareInstagramModalClose}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
