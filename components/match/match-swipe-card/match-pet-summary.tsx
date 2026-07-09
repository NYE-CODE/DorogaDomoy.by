import { MapPin } from 'lucide-react';
import type { Pet } from '../../../types/pet';
import { cn } from '../../ui/utils';

export interface MatchPetSummaryProps {
  name: string;
  meta: string;
  pet: Pet;
  energy: string | null;
  activityLabel: string;
  compact?: boolean;
}

export function MatchPetSummary({
  name,
  meta,
  pet,
  energy,
  activityLabel,
  compact,
}: MatchPetSummaryProps) {
  return (
    <>
      <h2
        className={cn(
          'font-extrabold uppercase tracking-wide text-foreground',
          compact ? 'text-base leading-none' : 'text-xl leading-tight lg:text-2xl lg:normal-case lg:tracking-tight',
        )}
      >
        {name}
      </h2>
      <p className={cn('text-muted-foreground', compact ? 'mt-1 line-clamp-1 text-xs' : 'mt-1 text-sm')}>{meta}</p>
      {(pet.city || energy) && (
        <p className={cn('text-muted-foreground', compact ? 'mt-1 line-clamp-1 text-xs' : 'mt-2 text-sm')}>
          {pet.city ? (
            <span className="inline-flex items-center gap-1">
              <MapPin size={compact ? 11 : 14} className="shrink-0 text-primary" aria-hidden />
              {pet.city}
            </span>
          ) : null}
          {pet.city && energy ? <span className="mx-1.5 text-border">·</span> : null}
          {energy ? (
            <span>
              {activityLabel}: <span className="font-medium text-foreground">{energy}</span>
            </span>
          ) : null}
        </p>
      )}
    </>
  );
}
