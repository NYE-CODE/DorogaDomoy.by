import { Clock, MapPin } from 'lucide-react';
import { Text } from '@/shared/ui/atoms';
import { PLACEHOLDER_PET_MAP } from '@/shared/lib/placeholder-images';
import { formatRelativeTime, petStatusPhotoPillClass } from '@/shared/lib/pet-helpers';
import { displayPhotoUrl } from '@/shared/lib/display-photo-url';
import { cn } from '@/shared/ui/utils';
import type { PetMapPopupProps } from './PetMapPopup.types';

/**
 * Компактное превью объявления для Leaflet-маркера: фото + статус + мета.
 * Встраивается в существующий MapView (bindPopup/bindTooltip), карту не создаёт.
 */
function PetMapPopup({ pet, title, statusLabel, detailsLabel, onDetails }: PetMapPopupProps) {
  const photo = pet.photos?.[0]
    ? displayPhotoUrl(pet.photos[0], 480)
    : PLACEHOLDER_PET_MAP;

  const body = (
    <>
      <div className="relative overflow-hidden">
        <img
          src={photo}
          alt={`${title}, ${pet.city}`}
          loading="lazy"
          className="h-36 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="absolute left-2.5 top-2.5">
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm',
              petStatusPhotoPillClass[pet.status],
            )}
          >
            {statusLabel}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 p-3.5">
        <Text as="span" variant="label" className="line-clamp-1 text-foreground">
          {title}
        </Text>
        <div className="flex flex-col gap-1.5">
          <span className="inline-flex max-w-full items-center gap-1.5 self-start rounded-md bg-muted/70 px-2.5 py-1 text-xs text-muted-foreground">
            <MapPin size={13} className="shrink-0" aria-hidden />
            <span className="min-w-0 truncate">{pet.city}</span>
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 self-start rounded-md px-2.5 py-1 text-xs',
              pet.status === 'searching' && !pet.isArchived
                ? 'bg-lost-soft font-semibold text-lost-foreground'
                : 'bg-muted/70 text-muted-foreground',
            )}
          >
            <Clock size={13} className="shrink-0" aria-hidden />
            <span>{formatRelativeTime(pet.publishedAt)}</span>
          </span>
        </div>
        {onDetails && detailsLabel ? (
          <span className="mt-0.5 text-xs font-semibold text-primary">
            {detailsLabel} →
          </span>
        ) : null}
      </div>
    </>
  );

  const shellClass = cn(
    'group flex w-[15.5rem] flex-col overflow-hidden rounded-2xl border border-border bg-card text-left shadow-card',
  );

  if (onDetails) {
    return (
      <button
        type="button"
        onClick={onDetails}
        className={cn(
          shellClass,
          'outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
        )}
      >
        {body}
      </button>
    );
  }

  return <div className={shellClass}>{body}</div>;
}

export { PetMapPopup };
export type { PetMapPopupProps } from './PetMapPopup.types';
