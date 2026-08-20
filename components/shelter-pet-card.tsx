import { useId } from 'react';
import { CircleHelp, Heart, MapPin, Mars, PawPrint, Venus } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import type { Pet } from '../types/pet';
import { cn } from './ui/utils';
import { typoH4 } from '@/shared/styles/typography-classes';
import { activateOnKeyboard, interactiveCardClass } from '@/shared/styles/interaction-classes';
import { FavoriteHeartButton } from './favorite-heart-button';

interface ShelterPetCardProps {
  pet: Pet;
  onClick?: () => void;
  compact?: boolean;
}

export function ShelterPetCard({ pet, onClick, compact = false }: ShelterPetCardProps) {
  const { t } = useI18n();
  const treatmentClipId = useId();

  const gender = pet.gender ? t.pet.gender[pet.gender] : '—';
  const age = pet.approximateAge?.trim() || '—';
  const sp = t.shelterPet;
  const healthLabel: Record<string, string> = {
    disabled: sp.healthDisabled,
    treatment: sp.healthTreatment,
    good: sp.healthGood,
    excellent: sp.healthExcellent,
  };
  const coatLabel: Record<string, string> = {
    smooth: sp.coatSmooth,
    semi: sp.coatSemi,
    fluffy: sp.coatFluffy,
  };
  const health = pet.healthStatus ? (healthLabel[pet.healthStatus] ?? pet.healthStatus) : '—';
  const name = pet.name?.trim() || pet.breed || t.pet.animalType[pet.animalType];
  const GenderIcon = pet.gender === 'male' ? Mars : pet.gender === 'female' ? Venus : CircleHelp;
  const genderClass =
    pet.gender === 'male'
      ? 'text-sky-500'
      : pet.gender === 'female'
        ? 'text-pink-500'
        : 'text-muted-foreground';
  const healthState = pet.healthStatus;

  const renderHealthIcon = () => {
    switch (healthState) {
      case 'excellent':
        return <Heart className="size-5 fill-current text-rose-800" aria-hidden />;
      case 'good':
        return <Heart className="size-5 fill-current text-red-500" aria-hidden />;
      case 'treatment':
        return (
          <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
            <defs>
              <clipPath id={treatmentClipId}>
                <rect x="0" y="12" width="24" height="12" />
              </clipPath>
            </defs>
            <path
              d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 1-4.5 2.5C10.5 4 9.26 3 7.5 3A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
              fill="none"
              stroke="rgb(252 165 165)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 1-4.5 2.5C10.5 4 9.26 3 7.5 3A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
              fill="rgb(239 68 68)"
              clipPath={`url(#${treatmentClipId})`}
            />
          </svg>
        );
      case 'disabled':
        return <Heart className="size-5 fill-current text-amber-300" aria-hidden />;
      default:
        return <Heart className="size-5 text-muted-foreground/50" aria-hidden />;
    }
  };

  if (compact) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={activateOnKeyboard(onClick)}
        className={cn(
          interactiveCardClass,
          'group relative flex items-start gap-3 overflow-hidden rounded-md border border-border bg-card p-3 shadow-sm',
          // Голос «приют»: на hover карточка отвечает тёплой изумрудной рамкой-приглашением
          'hover:-translate-y-0.5 hover:border-shelter-border',
        )}
      >
        <div className="absolute right-2 top-2 z-10">
          <FavoriteHeartButton petId={pet.id} size="sm" className="!p-1.5" />
        </div>
        <div className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
          {pet.photos?.[0] ? (
            <img src={pet.photos[0]} alt={t.shelterPet.photoAlt.replace('{name}', name).replace('{n}', '1')} className="size-full object-cover object-center" />
          ) : (
            <PawPrint className="size-10 text-muted-foreground opacity-35" aria-hidden />
          )}
        </div>
        <div className="min-w-0 flex-1 pr-8">
          <h3 className={cn(typoH4, 'line-clamp-1')}>{name}</h3>
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
            {t.pet.breedLabel}: {pet.breed?.trim() || t.pet.notSpecified} · {t.pet.ageLabel}: {age}
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
            <GenderIcon className={cn('size-4', genderClass)} aria-hidden />
            <span>{gender}</span>
            <span className="text-border">·</span>
            <span>{health}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={activateOnKeyboard(onClick)}
      className={cn(
        interactiveCardClass,
        'group flex h-full flex-col overflow-hidden rounded-md border border-border bg-card p-4 shadow-sm',
        'hover:-translate-y-0.5 hover:border-shelter-border',
      )}
    >
      <div className="relative mb-3 flex aspect-square w-full items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
        <div className="absolute right-2 top-2 z-10">
          <FavoriteHeartButton petId={pet.id} size="sm" className="!p-1.5" />
        </div>
        {pet.photos?.[0] ? (
          <img src={pet.photos[0]} alt="" className="size-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]" />
        ) : (
          <PawPrint className="size-16 text-muted-foreground opacity-35" aria-hidden />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <div className="flex items-start justify-between gap-2">
          {/* Голос «приют»: имя — главное в карточке, тёплое, без плакатного капса */}
          <h3 className="line-clamp-2 min-w-0 text-xl font-bold leading-snug text-foreground sm:text-2xl">
            {name}
          </h3>
          <div className="inline-flex shrink-0 items-center gap-2">
            <span
              className="inline-flex items-center"
              title={`${t.pet.genderLabel}: ${gender}`}
              aria-label={`${t.pet.genderLabel}: ${gender}`}
            >
              <GenderIcon className={cn('size-5', genderClass)} aria-hidden />
            </span>
            <span
              className="inline-flex items-center text-rose-500"
              title={`${t.shelterPet.healthLabel}: ${health}`}
              aria-label={`${t.shelterPet.healthLabel}: ${health}`}
            >
              {renderHealthIcon()}
            </span>
          </div>
        </div>
        <p className="line-clamp-1 text-sm text-muted-foreground">
          {t.pet.breedLabel}: {pet.breed?.trim() || t.pet.notSpecified} · {t.pet.ageLabel}: {age}
        </p>
        <div className="mt-1 flex flex-col gap-1.5">
          <span className="flex max-w-full items-center gap-1 self-start rounded-md bg-muted/80 px-[10px] py-[4px] text-xs text-muted-foreground">
            <MapPin size={12} className="shrink-0 opacity-80" aria-hidden />
            <span className="min-w-0 truncate">{pet.city || '—'}</span>
          </span>
        </div>
        <div className="mt-auto" />
      </div>
    </div>
  );
}
