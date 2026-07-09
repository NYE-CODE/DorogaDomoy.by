import { Bell, Building2 } from 'lucide-react';
import type { ShelterResponse } from '@/shared/api/client';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { shelterAnimalFocusLabel, shelterKindLabel } from '@/shared/lib/shelter-public';

export interface ShelterDetailHeroProps {
  row: ShelterResponse;
  s: Record<string, string>;
  logo?: string;
  cover?: string;
  subCount: number | null;
  subLoading: boolean;
  subscribed: boolean;
  subBusy: boolean;
  authLoading: boolean;
  onSubscribeToggle: () => void;
}

export function ShelterDetailHero({
  row,
  s,
  logo,
  cover,
  subCount,
  subLoading,
  subscribed,
  subBusy,
  authLoading,
  onSubscribeToggle,
}: ShelterDetailHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-lg border border-border/60">
      <div className="h-64 overflow-hidden bg-muted md:h-80 lg:h-96">
        {cover ? (
          <img src={cover} alt={row.name} className="size-full object-cover" />
        ) : (
          <div
            className="size-full bg-gradient-to-br from-muted via-muted/80 to-background"
            aria-hidden
          />
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent">
        <div className="flex items-end gap-4 px-5 pb-5 pt-6 md:gap-6 md:px-6 md:pb-6 md:pt-8">
          <div className="shrink-0">
            <div className="flex size-20 items-center justify-center overflow-hidden rounded-lg border-2 border-white/95 bg-card shadow-lg md:size-30 lg:size-36">
              {logo ? (
                <img src={logo} alt={`${row.name} logo`} className="size-full object-cover" />
              ) : (
                <Building2
                  className="size-10 text-muted-foreground opacity-60 md:size-14 lg:size-16"
                  aria-hidden
                />
              )}
            </div>
            <p className="mt-2 text-center text-xs font-medium text-white/80 md:text-sm">
              {subLoading && subCount === null
                ? '…'
                : s.detailSubscribeCount.replace('{n}', String(subCount ?? 0))}
            </p>
          </div>

          <div className="min-w-0 pr-12 sm:pr-0">
            <h1 className="typo-h1 text-balance text-white">{row.name}</h1>
            {row.city ? (
              <p className="mt-1 text-sm text-white/90 md:text-base">{row.city}</p>
            ) : null}
            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              <Badge className="max-w-[min(12rem,calc(100vw-4rem))] truncate border-white/25 bg-black/35 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white sm:max-w-[14rem] sm:text-xs">
                {shelterKindLabel(row.kind, s)}
              </Badge>
              <Badge
                variant="secondary"
                className={`max-w-[min(12rem,calc(100vw-4rem))] truncate px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white sm:max-w-[14rem] sm:text-xs ${
                  row.animal_focus === 'mixed'
                    ? 'border-white/25 bg-transparent'
                    : 'border-white/20 bg-white/20'
                }`}
                title={s.detailAnimalFocus}
              >
                {shelterAnimalFocusLabel(row.animal_focus, s)}
              </Badge>
            </div>
          </div>
        </div>
        <div className="absolute right-4 bottom-4 md:right-6 md:bottom-6">
          <Button
            type="button"
            variant="secondary"
            className="size-9 shrink-0 border-white/20 bg-white/15 p-0 text-white hover:bg-white/25 sm:h-9 sm:w-auto sm:px-3 sm:py-2"
            aria-label={s.detailSubscribeAria}
            disabled={subBusy || subLoading || authLoading}
            onClick={onSubscribeToggle}
          >
            <Bell className="size-4 shrink-0" aria-hidden />
            <span className="hidden sm:inline">
              {subscribed ? s.detailUnsubscribe : s.detailSubscribe}
            </span>
          </Button>
        </div>
      </div>
    </section>
  );
}
