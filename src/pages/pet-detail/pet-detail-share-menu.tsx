import { Check, Copy, Image, Share2, X } from 'lucide-react';
import { cn } from '@/shared/ui/utils';
import { appPrimaryCtaClass } from '@/shared/styles/cta-classes';
import { Button } from '@/shared/ui/button';
import type { PetDetailT } from './pet-detail-archive-badge';

export interface PetDetailShareMenuProps {
  t: PetDetailT;
  showShareMenu: boolean;
  setShowShareMenu: (open: boolean) => void;
  shareMenuRef: React.RefObject<HTMLDivElement | null>;
  copiedKind: null | 'link' | 'full';
  cardLoading: null | 'feed' | 'story';
  onShareTelegram: () => void;
  onShareInstagramPost: () => void;
  onShareInstagramStory: () => void;
  onCopyPostText: () => void;
  onCopyLinkOnly: () => void;
}

export function PetDetailShareMenu({
  t,
  showShareMenu,
  setShowShareMenu,
  shareMenuRef,
  copiedKind,
  cardLoading,
  onShareTelegram,
  onShareInstagramPost,
  onShareInstagramStory,
  onCopyPostText,
  onCopyLinkOnly,
}: PetDetailShareMenuProps) {
  return (
    <div className="relative flex min-w-0 gap-2" ref={shareMenuRef}>
      <Button
        type="button"
        className={cn(appPrimaryCtaClass, 'min-w-0 flex-1')}
        onClick={() => setShowShareMenu(!showShareMenu)}
        aria-expanded={showShareMenu}
        aria-haspopup="true"
      >
        <Share2 className="size-5" aria-hidden />
        {t.petDetail.shareAdButton}
      </Button>
      {showShareMenu && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[min(70vh,520px)] overflow-hidden overflow-y-auto rounded-md border border-border bg-card shadow-lg">
          <div className="px-4 py-2.5 border-b border-border/60 dark:border-border flex items-center justify-between sticky top-0 bg-card z-10">
            <span className="text-sm font-semibold text-foreground">{t.petDetail.share}</span>
            <button type="button" onClick={() => setShowShareMenu(false)} className="p-1 hover:bg-accent dark:hover:bg-accent rounded-lg"><X className="w-4 h-4 text-muted-foreground/80" /></button>
          </div>
          <div className="py-1">
            <button type="button" onClick={onShareTelegram} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent dark:hover:bg-accent transition-colors text-left">
              <span className="w-8 h-8 flex items-center justify-center rounded-full bg-telegram/10 shrink-0">
                <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 text-telegram" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              </span>
              <span className="text-sm text-foreground/90">{t.petDetail.shareTelegram}</span>
            </button>
            <div className="border-t border-border/60 dark:border-border my-1" />
            <div className="px-4 py-1.5"><span className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wide">{t.petDetail.shareInstagramSection}</span></div>
            <button type="button" onClick={onShareInstagramPost} disabled={cardLoading !== null} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent dark:hover:bg-accent transition-colors text-left disabled:opacity-50">
              <span className="w-8 h-8 flex items-center justify-center rounded-full bg-muted text-foreground/90 dark:text-foreground shrink-0">
                <Image className="w-4 h-4" aria-hidden />
              </span>
              <span className="text-sm text-foreground/90">
                {cardLoading === 'feed' ? t.petDetail.shareCardDownloading : t.petDetail.shareInstagramPost}
              </span>
            </button>
            <button type="button" onClick={onShareInstagramStory} disabled={cardLoading !== null} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent dark:hover:bg-accent transition-colors text-left disabled:opacity-50">
              <span className="w-8 h-8 flex items-center justify-center rounded-full bg-muted text-foreground/90 dark:text-foreground shrink-0">
                <Image className="w-4 h-4" aria-hidden />
              </span>
              <span className="text-sm text-foreground/90">
                {cardLoading === 'story' ? t.petDetail.shareCardDownloading : t.petDetail.shareInstagramStory}
              </span>
            </button>
            <div className="border-t border-border/60 dark:border-border my-1" />
            <button type="button" onClick={onCopyPostText} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent dark:hover:bg-accent transition-colors text-left">
              <span className="w-8 h-8 flex items-center justify-center rounded-full bg-muted shrink-0">
                {copiedKind === 'full' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
              </span>
              <span className="text-sm text-foreground/90">{t.petDetail.shareCopyFull}</span>
            </button>
            <button type="button" onClick={onCopyLinkOnly} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent dark:hover:bg-accent transition-colors text-left">
              <span className="w-8 h-8 flex items-center justify-center rounded-full bg-muted shrink-0">
                {copiedKind === 'link' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
              </span>
              <span className="text-sm text-foreground/90">{t.petDetail.shareCopyLinkOnly}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
