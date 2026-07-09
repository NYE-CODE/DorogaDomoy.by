import { Link } from 'react-router';
import { Clock, MapPin } from 'lucide-react';
import type { Pet } from '@/entities/pet/model/types';
import { RewardBadge } from '../../../components/reward-badge';
import { dateLocaleForUi } from '@/shared/lib/profile-pet-text';
import { petStatusPhotoPillClass } from '@/shared/lib/pet-helpers';
import { cn } from '@/shared/ui/utils';
import { surfacePanelClass } from '@/shared/styles/surface-classes';
import { typoH3 } from '@/shared/styles/typography-classes';
import { USER_PROFILE_DEFAULT_PET_PHOTO } from './user-profile-constants';
import { getUserProfileAdStatusTitle } from './user-profile-helpers';

export interface UserProfileAdsSectionProps {
  title: string;
  emptyLabel: string;
  activePets: Pet[];
  locale: string;
  petForm: Record<string, string>;
  petColors: Record<string, string>;
  lostBadge: string;
  foundBadge: string;
}

export function UserProfileAdsSection({
  title,
  emptyLabel,
  activePets,
  locale,
  petForm,
  petColors,
  lostBadge,
  foundBadge,
}: UserProfileAdsSectionProps) {
  return (
    <div className={surfacePanelClass}>
      <div className="border-b border-border px-6 py-4">
        <h2 className={typoH3}>{title}</h2>
      </div>

      <div className="p-4 sm:p-6">
        {activePets.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">{emptyLabel}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
            {activePets.map((pet) => {
              const photoUrl = pet.photos[0] || USER_PROFILE_DEFAULT_PET_PHOTO;
              const colorsStr =
                pet.colors.length > 0
                  ? pet.colors.map((c) => petColors[c as keyof typeof petColors]).join(', ')
                  : '';
              return (
                <Link
                  key={pet.id}
                  to={`/pet/${pet.id}`}
                  className="group block overflow-hidden rounded-lg bg-white shadow-lg transition-all duration-300 hover:shadow-2xl dark:bg-transparent"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={photoUrl}
                      alt={getUserProfileAdStatusTitle(pet, petForm)}
                      className="h-64 w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div
                      className={cn(
                        'absolute right-4 top-4 rounded-full px-4 py-2 text-sm font-bold',
                        petStatusPhotoPillClass[pet.status],
                      )}
                    >
                      {pet.status === 'searching' ? lostBadge : foundBadge}
                    </div>
                    <div className="absolute left-4 top-4">
                      <RewardBadge pet={pet} />
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className={`${typoH3} mb-2`}>{getUserProfileAdStatusTitle(pet, petForm)}</h3>
                    {colorsStr ? <p className="mb-4 text-muted-foreground">{colorsStr}</p> : null}
                    <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin size={16} />
                      <span>{pet.city}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock size={16} />
                      <span>
                        {pet.publishedAt.toLocaleDateString(dateLocaleForUi(locale), {
                          day: 'numeric',
                          month: 'long',
                        })}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
