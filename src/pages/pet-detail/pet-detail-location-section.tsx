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
    <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
      <div className="border-b border-border px-5 py-5 sm:px-6">
        <div className="mb-1 flex items-center gap-2.5">
          <MapPin size={22} className="text-primary" aria-hidden />
          <h2 className="font-display text-lg font-semibold text-foreground sm:text-xl">
            {t.pet.location}
          </h2>
        </div>
        <p className="pl-8 text-sm text-muted-foreground sm:text-base">{pet.city}</p>
      </div>

      {canAddSighting && pet.status === 'searching' && !pet.isArchived && (
        <div className="border-b border-border bg-primary/5 px-5 py-5 sm:px-6">
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

      <div className="relative h-80 bg-landing-muted sm:h-96">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              {t.common.loading}
            </div>
          }
        >
          <SinglePetMap pet={pet} sightings={sightings} seenLabel={t.sightings.seenLabel} />
        </Suspense>
        {hasPoint ? (
          <div className="absolute bottom-4 right-4 z-[5]">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-full border border-border bg-card shadow-search"
                >
                  <MapPin className="size-4" aria-hidden />
                  {t.petDetail.openInMaps}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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
    </section>
  );
}
