import { useEffect } from 'react';
import { Copy, Download, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Pet } from '@/entities/pet/model/types';
import type { PetShareBundle } from '@/shared/lib/pet-share-text';
import { copyText as copyToClipboard } from '@/shared/lib/copy-text';
import { cn } from '@/shared/lib/classNames';
import {
  surfaceCtaOutline,
  surfaceCtaPrimary,
  surfaceFieldLabel,
  surfaceIconButton,
  surfaceInput,
} from '@/shared/styles/surface-classes';
import '../../../landing/styles/theme-scoped.css';
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
      aria-labelledby="instagram-guide-title"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <h2 id="instagram-guide-title" className="font-display typo-h2 pr-2 text-foreground">
              {t.petDetail.shareInstagramModalTitle}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className={surfaceIconButton}
              aria-label={t.common.close}
            >
              <X size={20} aria-hidden />
            </button>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            {t.petDetail.shareInstagramModalExplain}
          </p>
          <ol className="mb-4 list-decimal space-y-2 pl-5 text-sm text-foreground/90">
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
              <p className={surfaceFieldLabel}>{t.petDetail.shareInstagramModalCaptionLabel}</p>
              <textarea
                readOnly
                rows={4}
                value={shareBundle.textFull}
                className={cn(surfaceInput, 'min-h-[80px] resize-y bg-landing-muted/40 text-sm')}
                onFocus={(e) => e.target.select()}
              />
              <button
                type="button"
                className={cn(surfaceCtaOutline, 'mt-2 h-11 min-h-11 w-full text-sm sm:w-auto sm:px-5')}
                onClick={async () => {
                  if (await copyToClipboard(shareBundle.textFull)) {
                    toast.success(t.petDetail.shareCopiedFull);
                  } else toast.error(t.common.error);
                }}
              >
                <Copy className="size-4" />
                {t.petDetail.shareInstagramModalCopyText}
              </button>
            </>
          )}
          {instagramGuide.cardUrl ? (
            <div className="mt-5 border-t border-border pt-5">
              <p className={surfaceFieldLabel}>{t.petDetail.shareCardSection}</p>
              <img
                src={instagramGuide.cardUrl}
                alt="Card preview"
                className="mb-3 w-full rounded-xl border border-border"
              />
              <div className="flex flex-col flex-wrap gap-2 sm:flex-row">
                <button
                  type="button"
                  className={cn(surfaceCtaOutline, 'h-11 min-h-11 w-full text-sm sm:w-auto sm:px-5')}
                  onClick={() => {
                    if (!instagramGuide.cardUrl) return;
                    const a = document.createElement('a');
                    a.href = instagramGuide.cardUrl;
                    a.download = `dorogadomoy-${pet.id}-${instagramGuide.variant === 'story' ? 'story' : 'feed'}.png`;
                    a.click();
                    toast.success(t.petDetail.shareCardSaved);
                  }}
                >
                  <Download className="size-4" />
                  {t.petDetail.shareCardDownloadBtn}
                </button>
              </div>
            </div>
          ) : null}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              className={cn(surfaceCtaPrimary, 'sm:flex-1')}
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
            <button type="button" className={cn(surfaceCtaOutline, 'sm:flex-1')} onClick={onClose}>
              {t.petDetail.shareInstagramModalClose}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
