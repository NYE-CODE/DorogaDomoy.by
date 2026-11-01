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
import { surfaceCtaPrimary } from '@/shared/styles/surface-classes';
import '../../../landing/styles/theme-scoped.css';

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
        className="landing-theme flex max-h-[min(90vh,720px)] max-w-2xl flex-col gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-card sm:max-w-2xl"
        showCloseButton
      >
        <DialogHeader className="sticky top-0 z-10 border-b border-border/80 bg-card px-5 py-4 text-left sm:px-6">
          <DialogTitle className="font-display">{op.partnersModalTitle}</DialogTitle>
          <DialogDescription>{op.partnersModalSubtitle}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 overflow-y-auto bg-landing px-5 py-4 sm:px-6">
          {partnersLoading ? (
            <p className="text-sm text-muted-foreground">{loadingLabel}</p>
          ) : partnersError ? (
            <div className="space-y-3">
              <p className="text-sm text-destructive">{partnersError}</p>
              <Button type="button" className={cn(surfaceCtaPrimary, 'w-full sm:w-auto')} onClick={onRetry}>
                {op.partnersRetry}
              </Button>
            </div>
          ) : medallionPartners.length === 0 ? (
            <p className="text-sm text-muted-foreground">{op.partnersEmpty}</p>
          ) : (
            medallionPartners.map((partner) => (
              <div
                key={partner.id}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-card sm:flex-row sm:items-center"
              >
                {partner.logo_url ? (
                  <img
                    src={partner.logo_url}
                    alt={partner.name}
                    className="size-12 shrink-0 rounded-xl border border-border object-cover"
                  />
                ) : (
                  <div className="size-12 shrink-0 rounded-xl border border-border bg-landing-muted" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{partner.name}</p>
                </div>
                {partner.link ? (
                  <a
                    href={partner.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(surfaceCtaPrimary, 'h-11 min-h-11 w-full shrink-0 text-sm sm:w-auto sm:px-5')}
                  >
                    {op.partnersOpenLink}
                    <ExternalLink className="size-4" />
                  </a>
                ) : (
                  <Button type="button" disabled variant="secondary" size="sm" className="shrink-0 rounded-full">
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
