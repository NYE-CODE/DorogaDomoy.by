import { AlertCircle, Heart } from 'lucide-react';
import type { Pet } from '@/entities/pet/model/types';
import { petScenarioDetailBannerClass } from '@/shared/lib/pet-helpers';
import type { PetDetailT } from './pet-detail-archive-badge';

export function PetDetailStatusBanners({
  pet,
  isShelterPet,
  t,
}: {
  pet: Pet;
  isShelterPet: boolean;
  t: PetDetailT;
}) {
  if (isShelterPet || pet.isArchived) return null;

  if (pet.status === 'searching') {
    const c = petScenarioDetailBannerClass.lost;
    return (
      <div className={c.box} role="status">
        <AlertCircle className={c.icon} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className={c.title}>{t.petDetail.lostBannerTitle}</p>
          <p className="text-sm leading-relaxed text-lost-foreground/80">
            {t.petDetail.lostBannerBody}
          </p>
        </div>
        <Heart className="hidden size-5 shrink-0 text-lost/50 sm:block" aria-hidden />
      </div>
    );
  }

  if (pet.status === 'found') {
    const c = petScenarioDetailBannerClass.found;
    return (
      <div className={c.box} role="status">
        <AlertCircle className={c.icon} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className={c.title}>{t.petDetail.foundBannerTitle}</p>
          <p className="text-sm leading-relaxed text-found-foreground/80">
            {t.petDetail.foundBannerBody}
          </p>
        </div>
      </div>
    );
  }

  return null;
}
