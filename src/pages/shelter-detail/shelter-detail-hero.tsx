import { Bell, Building2 } from 'lucide-react';
import type { ShelterResponse } from '@/shared/api/client';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { shelterAnimalFocusLabel, shelterKindLabel } from '@/shared/lib/shelter-public';

export interface ShelterDetailHeroProps {
  row: ShelterResponse;
  s: Record<string, string>;
  logo?: string;
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
  subCount,
  subLoading,
  subscribed,
  subBusy,
  authLoading,
  onSubscribeToggle,
}: ShelterDetailHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-lg border border-border/60 bg-card">
      <div className="flex items-end gap-4 px-5 py-5 md:gap-6 md:px-6 md:py-6">
        <div className="shrink-0">
          <div className="flex size-20 items-center justify-center overflow-hidden rounded-lg border border-border/70 bg-muted shadow-sm md:size-28 lg:size-32">
            {logo ? (
              <img src={logo} alt={`${row.name} logo`} className="size-full object-cover" />
            ) : (
              <Building2
                className="size-10 text-muted-foreground opacity-60 md:size-12 lg:size-14"
                aria-hidden
              />
            )}
          </div>
          <p className="mt-2 text-center text-xs font-medium text-muted-foreground md:text-sm">
            {subLoading && subCount === null
              ? '…'
              : s.detailSubscribeCount.replace('{n}', String(subCount ?? 0))}
          </p>
        </div>

        <div className="min-w-0 flex-1 pr-12 sm:pr-0">
          <h1 className="typo-h1 text-balance text-foreground">{row.name}</h1>
          {row.city ? (
            <p className="mt-1 text-sm text-muted-foreground md:text-base">{row.city}</p>
          ) : null}
          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            <Badge className="max-w-[min(12rem,calc(100vw-4rem))] truncate px-3 py-1 text-xs font-semibold uppercase tracking-wide sm:max-w-[14rem]">
              {shelterKindLabel(row.kind, s)}
            </Badge>
            <Badge
              variant="secondary"
              className={`max-w-[min(12rem,calc(100vw-4rem))] truncate px-3 py-1 text-xs font-semibold uppercase tracking-wide sm:max-w-[14rem] ${
                row.animal_focus === 'mixed' ? 'bg-transparent' : ''
              }`}
              title={s.detailAnimalFocus}
            >
              {shelterAnimalFocusLabel(row.animal_focus, s)}
            </Badge>
          </div>
        </div>
      </div>

      <div className="absolute right-4 top-4 md:right-6 md:top-6">
        <Button
          type="button"
          variant="secondary"
          className="size-9 shrink-0 p-0 sm:h-9 sm:w-auto sm:px-3 sm:py-2"
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
    </section>
  );
}
