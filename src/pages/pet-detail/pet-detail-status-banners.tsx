import { AlertCircle } from 'lucide-react';
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
    return (
      <div className={petScenarioDetailBannerClass.lost.box}>
        <AlertCircle size={24} className="mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" aria-hidden />
        <div>
          <p className="mb-1 font-semibold text-rose-800 dark:text-rose-200">{t.petDetail.lostBannerTitle}</p>
          <p className="text-muted-foreground text-sm leading-relaxed">{t.petDetail.lostBannerBody}</p>
        </div>
      </div>
    );
  }

  if (pet.status === 'found') {
    return (
      <div className={petScenarioDetailBannerClass.found.box}>
        <AlertCircle size={24} className="mt-0.5 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden />
        <div>
          <p className="mb-1 font-semibold text-sky-900 dark:text-sky-200">{t.petDetail.foundBannerTitle}</p>
          <p className="text-muted-foreground text-sm leading-relaxed">{t.petDetail.foundBannerBody}</p>
        </div>
      </div>
    );
  }

  return null;
}
