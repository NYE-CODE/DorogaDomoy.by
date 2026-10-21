import { Link } from 'react-router';
import { MapPin } from 'lucide-react';
import { FavoriteHeartButton } from './favorite-heart-button';
import { useI18n } from '../context/I18nContext';
import type { Pet } from '../types/pet';
import { cn } from './ui/utils';
import { displayPhotoUrl } from '@/shared/lib/display-photo-url';
import { petScenarioPhotoPillClass } from '@/shared/lib/pet-scenario-colors';
import { surfacePanel } from '@/shared/styles/surface-classes';

const DEFAULT_PHOTO =
  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop';

export type LandingShelterPetCardProps = {
  pet: Pet;
  to: string;
  onNavigate?: () => void;
  className?: string;
};

/** Карточка «питомец из приюта» — тот же визуал, что в секции лендинга. */
export function LandingShelterPetCard({
  pet,
  to,
  onNavigate,
  className,
}: LandingShelterPetCardProps) {
  const { t } = useI18n();
  const copy = t.landing.shelterPets;

  const name = pet.name?.trim() || pet.breed || t.pet.animalType[pet.animalType];
  const age = pet.approximateAge?.trim();
  const breed = pet.breed?.trim() || copy.breedDefault;
  const meta = [breed, age].filter(Boolean).join(' · ');
  const photo = pet.photos?.[0] ? displayPhotoUrl(pet.photos[0], 640) : DEFAULT_PHOTO;

  return (
    <div className={cn(surfacePanel, 'group relative h-full', className)}>
      <Link
        to={to}
        onClick={onNavigate}
        className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div className="relative overflow-hidden">
          <img
            src={photo}
            alt={name}
            className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute left-3 top-3">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-1 text-[0.65rem] font-semibold',
                petScenarioPhotoPillClass.shelter,
              )}
            >
              {copy.badge}
            </span>
          </div>
        </div>
        <div className="p-4 md:p-5">
          <h3 className="mb-1 line-clamp-1 font-display text-lg font-semibold leading-tight text-foreground sm:text-xl">
            {name}
          </h3>
          <p className="mb-3 line-clamp-1 text-sm leading-relaxed text-muted-foreground">{meta}</p>
          <div className="inline-flex max-w-full items-center gap-1.5 rounded-md bg-landing-muted/70 px-2.5 py-1 text-xs text-muted-foreground">
            <MapPin size={14} className="shrink-0" aria-hidden />
            <span className="min-w-0 truncate">{pet.city || '—'}</span>
          </div>
        </div>
      </Link>
      <div className="pointer-events-none absolute left-0 right-0 top-0 z-[5] h-52">
        <div className="pointer-events-auto absolute bottom-3 right-3 z-[6]">
          <FavoriteHeartButton petId={pet.id} size="sm" />
        </div>
      </div>
    </div>
  );
}
