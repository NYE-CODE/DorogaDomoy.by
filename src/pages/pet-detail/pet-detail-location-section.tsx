import { lazy, Suspense } from 'react';
import { MapPin } from 'lucide-react';
import type { Pet } from '@/entities/pet/model/types';
import type { SightingItem } from '@/shared/api/client';
import { externalMapWebUrl } from '@/shared/lib/external-map-links';
import { cn } from '@/shared/ui/utils';
import { appPrimaryCtaClass } from '@/shared/styles/cta-classes';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import type { PetDetailT } from './pet-detail-archive-badge';

const SinglePetMap = lazy(() =>
  import('./pet-detail-map').then((m) => ({ default: m.SinglePetMap })),
);

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
  const hasPoint = pet.location.lat !== 0 || pet.location.lng !== 0;

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
          <p className="text-center text-sm text-muted-foreground">
            {t.petDetail.sightingHintForVisitors.replace(/^\s*\u{1F441}\s*/u, '')}
          </p>
        </div>
      )}
      <div className="h-96 bg-muted/30">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              {t.common.loading}
            </div>
          }
        >
          <SinglePetMap pet={pet} sightings={sightings} seenLabel={t.sightings.seenLabel} />
        </Suspense>
      </div>
      {hasPoint ? (
        <div className="border-t border-border p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" className="w-full">
                <MapPin aria-hidden />
                {t.petDetail.openInMaps}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-[var(--radix-dropdown-menu-trigger-width)]">
              <DropdownMenuItem asChild>
                <a
                  href={externalMapWebUrl('yandex', pet.location.lat, pet.location.lng)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t.petDetail.openInYandexMaps}
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a
                  href={externalMapWebUrl('google', pet.location.lat, pet.location.lng)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t.petDetail.openInGoogleMaps}
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : null}
    </div>
  );
}
