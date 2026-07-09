import { MapPin } from 'lucide-react';
import type { Pet } from '@/entities/pet/model/types';
import type { SightingItem } from '@/shared/api/client';
import { cn } from '@/shared/ui/utils';
import { appPrimaryCtaClass } from '@/shared/styles/cta-classes';
import { Button } from '@/shared/ui/button';
import { SinglePetMap } from './pet-detail-map';
import type { PetDetailT } from './pet-detail-archive-badge';

export interface PetDetailLocationSectionProps {
  pet: Pet;
  t: PetDetailT;
  sightings: SightingItem[];
  canAddSighting: boolean;
  onOpenSightingForm: () => void;
}

export function PetDetailLocationSection({
  pet,
  t,
  sightings,
  canAddSighting,
  onOpenSightingForm,
}: PetDetailLocationSectionProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="border-b border-border p-6">
        <div className="mb-2 flex items-center gap-3">
          <MapPin size={24} className="text-primary" aria-hidden />
          <h2 className="typo-h2">{t.pet.location}</h2>
        </div>
        <p className="ml-9 text-muted-foreground">{pet.city}</p>
      </div>
      {canAddSighting && pet.status === 'searching' && !pet.isArchived && (
        <div className="border-b border-border bg-primary/5 p-6 dark:bg-primary/10">
          <Button
            type="button"
            className={cn(appPrimaryCtaClass, 'mb-3 w-full')}
            onClick={onOpenSightingForm}
          >
            {t.petDetail.sawSimilar}
          </Button>
          <p className="text-center text-sm text-muted-foreground">{t.petDetail.sightingHintForVisitors.replace(/^\s*\u{1F441}\s*/u, '')}</p>
        </div>
      )}
      <div className="h-96">
        <SinglePetMap pet={pet} sightings={sightings} seenLabel={t.sightings.seenLabel} />
      </div>
    </div>
  );
}
