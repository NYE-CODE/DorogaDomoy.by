import { ExternalLink } from 'lucide-react';
import type { Partner } from '@/shared/api/client';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { cn } from '@/shared/ui/utils';
import { appPrimaryCtaClass } from '@/shared/styles/cta-classes';

export interface MyPetProfilePartnersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  op: Record<string, string>;
  loadingLabel: string;
  partnersLoading: boolean;
  partnersError: string;
  medallionPartners: Partner[];
  onRetry: () => void;
}

export function MyPetProfilePartnersModal({
  open,
  onOpenChange,
  op,
  loadingLabel,
  partnersLoading,
  partnersError,
  medallionPartners,
  onRetry,
}: MyPetProfilePartnersModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[min(90vh,720px)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
        showCloseButton
      >
        <DialogHeader className="sticky top-0 z-10 border-b border-border bg-background px-6 py-4 text-left">
          <DialogTitle>{op.partnersModalTitle}</DialogTitle>
          <DialogDescription>{op.partnersModalSubtitle}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 overflow-y-auto px-6 py-4">
          {partnersLoading ? (
            <p className="text-sm text-muted-foreground">{loadingLabel}</p>
          ) : partnersError ? (
            <div className="space-y-3">
              <p className="text-sm text-destructive">{partnersError}</p>
              <Button type="button" onClick={onRetry}>
                {op.partnersRetry}
              </Button>
            </div>
          ) : medallionPartners.length === 0 ? (
            <p className="text-sm text-muted-foreground">{op.partnersEmpty}</p>
          ) : (
            medallionPartners.map((partner) => (
              <div
                key={partner.id}
                className="flex flex-col gap-3 rounded-md border border-border/80 bg-muted/20 p-4 sm:flex-row sm:items-center"
              >
                {partner.logo_url ? (
                  <img
                    src={partner.logo_url}
                    alt={partner.name}
                    className="size-12 shrink-0 rounded-lg border border-border object-cover"
                  />
                ) : (
                  <div className="size-12 shrink-0 rounded-lg border border-border bg-muted" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{partner.name}</p>
                </div>
                {partner.link ? (
                  <a
                    href={partner.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(appPrimaryCtaClass, 'inline-flex shrink-0 text-sm')}
                  >
                    {op.partnersOpenLink}
                    <ExternalLink className="size-4" />
                  </a>
                ) : (
                  <Button type="button" disabled variant="secondary" size="sm" className="shrink-0">
                    {op.partnersNoLink}
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
