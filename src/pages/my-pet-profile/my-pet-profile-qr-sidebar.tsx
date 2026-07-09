import QRCode from 'react-qr-code';
import { Download, ExternalLink, Share2 } from 'lucide-react';
import type { ProfilePetResponse } from '@/shared/api/client';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { cn } from '@/shared/ui/utils';
import { appOutlineCtaClass, appPrimaryCtaClass } from '@/shared/styles/cta-classes';
import { MY_PET_PROFILE_SECTION_TITLE_CLASS } from './my-pet-profile-display';

export interface MyPetProfileQrSidebarProps {
  pet: ProfilePetResponse;
  op: Record<string, string>;
  publicPetUrl: string;
  publicPetQrUrl: string;
  qrWrapRef: React.RefObject<HTMLDivElement | null>;
  onDownloadQr: () => void;
  onShareLink: () => void;
  onOpenPartners: () => void;
}

export function MyPetProfileQrSidebar({
  pet,
  op,
  publicPetUrl,
  publicPetQrUrl,
  qrWrapRef,
  onDownloadQr,
  onShareLink,
  onOpenPartners,
}: MyPetProfileQrSidebarProps) {
  return (
    <Card className="sticky top-20 border-primary/15 bg-card/95 shadow-lg ring-1 ring-border/60 backdrop-blur-sm supports-[backdrop-filter]:bg-card/85 lg:top-24 lg:self-start">
      <CardHeader className="pb-3">
        <CardTitle className={MY_PET_PROFILE_SECTION_TITLE_CLASS}>{op.qrTitle}</CardTitle>
        <CardDescription className="text-sm leading-relaxed">{op.qrDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center gap-3 rounded-lg bg-medallion-soft/70 px-4 pb-4 pt-8 dark:bg-background/80">
          <div className="relative">
            <span
              aria-hidden="true"
              className="absolute left-1/2 top-0 z-10 size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-medallion bg-transparent"
            />
            <div
              ref={qrWrapRef}
              className="flex size-60 items-center justify-center rounded-full border-4 border-medallion bg-white shadow-sm"
            >
              <QRCode value={publicPetQrUrl || publicPetUrl} size={156} level="M" />
            </div>
          </div>
          {pet.name ? <p className="typo-engraved text-medallion-foreground">{pet.name}</p> : null}
        </div>
        <div className="rounded-md border border-border/80 bg-muted/25 p-4">
          <p className="text-sm font-semibold text-foreground">{op.freeOptionTitle}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{op.freeOptionHint}</p>
        </div>
        <div className="flex flex-col gap-3">
          <Button
            type="button"
            className={cn(appPrimaryCtaClass, 'h-12 w-full text-base')}
            onClick={onDownloadQr}
          >
            <Download size={20} />
            <span>{op.downloadQr}</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className={cn(appOutlineCtaClass, 'h-12 w-full text-base')}
            onClick={onShareLink}
          >
            <Share2 size={20} />
            <span>{op.shareLink}</span>
          </Button>
        </div>
        <div className="rounded-md border border-border/80 bg-muted/25 p-4">
          <p className="text-sm font-semibold text-foreground">{op.partnerOptionTitle}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{op.partnerOptionHint}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-12 w-full gap-2 border-primary/40 text-base text-primary hover:bg-primary/10"
          onClick={onOpenPartners}
        >
          <ExternalLink size={18} />
          {op.orderFromPartners}
        </Button>
        <div className="rounded-md border border-amber-200/70 bg-amber-50/80 p-4 dark:border-amber-800/50 dark:bg-amber-950/30">
          <p className="text-sm leading-relaxed text-amber-950 dark:text-amber-100">
            <strong>{op.qrTipBold}</strong> {op.qrTip}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
