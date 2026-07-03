import { ArrowRight } from 'lucide-react';
import { ActionButton, StatusBadge, Text } from '@/shared/ui/atoms';
import { petScenarioFromPet } from '@/shared/lib/pet-scenario-colors';
import { PLACEHOLDER_PET_MAP } from '@/shared/lib/placeholder-images';
import type { PetMapPopupProps } from './PetMapPopup.types';

/**
 * Компактное превью объявления для Leaflet-маркера: фото + статус + «Подробнее».
 * Встраивается в существующий MapView (bindPopup/bindTooltip), карту не создаёт.
 * Без Leaflet-импортов, чтобы не тянуть карту в общий бандл.
 */
function PetMapPopup({ pet, title, statusLabel, detailsLabel, onDetails }: PetMapPopupProps) {
  return (
    <div className="flex w-48 flex-col gap-2">
      <img
        src={pet.photos?.[0] || PLACEHOLDER_PET_MAP}
        alt={`${title}, ${pet.city}`}
        loading="lazy"
        className="aspect-[4/3] w-full rounded-lg object-cover"
      />

      <div className="flex items-start justify-between gap-2">
        <Text as="span" variant="label" className="min-w-0 truncate">
          {title}
        </Text>
        <StatusBadge status={petScenarioFromPet(pet)} className="shrink-0">
          {statusLabel}
        </StatusBadge>
      </div>

      <Text as="span" variant="caption" className="truncate">
        {pet.city}
      </Text>

      {onDetails && (
        <ActionButton
          variant="primary"
          icon={ArrowRight}
          label={detailsLabel}
          onClick={onDetails}
          className="w-full"
        />
      )}
    </div>
  );
}

export { PetMapPopup };
export type { PetMapPopupProps } from './PetMapPopup.types';
