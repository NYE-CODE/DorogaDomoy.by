import { Sparkles } from 'lucide-react';
import type { Pet } from '../../../types/pet';
import type { MatchResult } from '../../../utils/pet-match';
import { matchReasonChipClass } from '@/shared/styles/match-styles';
import { cn } from '../../ui/utils';
import { ShelterPetTraits } from '../../ShelterPetTraits';

export interface MatchPetDetailsBodyProps {
  pet: Pet;
  match: MatchResult;
  detailItems: [string, string][];
  className?: string;
}

export function MatchPetDetailsBody({
  pet,
  match,
  detailItems,
  className,
}: MatchPetDetailsBodyProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {match.reasons.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {match.reasons.map((r) => (
            <span key={r} className={matchReasonChipClass}>
              <Sparkles size={11} aria-hidden />
              {r}
            </span>
          ))}
        </div>
      )}

      {pet.description?.trim() ? (
        <p className="text-sm leading-relaxed text-foreground/90 lg:text-base lg:leading-7">{pet.description}</p>
      ) : null}

      <div className="grid grid-cols-2 gap-2 lg:gap-2.5">
        {detailItems.map(([label, value]) => (
          <div key={label} className="rounded-md border border-border/60 bg-muted/35 px-3 py-2 lg:px-3.5 lg:py-2.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      <ShelterPetTraits pet={pet} />
    </div>
  );
}
