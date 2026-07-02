import { PetStatus, AnimalType, PetColor, Gender } from '@/entities/pet/model/types';
import {
  petScenarioBorderedBadgeClass,
  petScenarioFilterSelectedClass,
  petScenarioFromStatus,
  petScenarioPhotoPillClass,
  petScenarioSoftPillClass,
  PET_SCENARIO_MARKER_HEX,
} from '@/shared/lib/pet-scenario-colors';

export const statusLabels: Record<PetStatus, string> = {
  searching: 'Ищут',
  found: 'Найден',
};

/**
 * Статусы lost/found — классы из {@link pet-scenario-colors}.
 * Приют: `petScenarioSoftPillClass.shelter` и др.
 */

/** Бейдж с рамкой (карточка объявления, превью на карте) */
export const petStatusBorderedBadgeClass: Record<PetStatus, string> = {
  searching: petScenarioBorderedBadgeClass.lost,
  found: petScenarioBorderedBadgeClass.found,
};

/** Плашка на фото (компактная карточка, лендинг) */
export const petStatusPhotoPillClass: Record<PetStatus, string> = {
  searching: petScenarioPhotoPillClass.lost,
  found: petScenarioPhotoPillClass.found,
};

/** Мягкий pill в списках и в блоке «Информация» на странице объявления */
export const petStatusSoftPillClass: Record<PetStatus, string> = {
  searching: petScenarioSoftPillClass.lost,
  found: petScenarioSoftPillClass.found,
};

/** Фильтр поиска: выбранный чип статуса */
export const petStatusFilterSelectedClass: Record<PetStatus, string> = {
  searching: petScenarioFilterSelectedClass.lost,
  found: petScenarioFilterSelectedClass.found,
};

/** Обводка круглого маркера на карте (Leaflet) */
export const PET_STATUS_MARKER_BORDER_HEX: Record<PetStatus, string> = {
  searching: PET_SCENARIO_MARKER_HEX.lost,
  found: PET_SCENARIO_MARKER_HEX.found,
};

/** @deprecated Используйте petStatusBorderedBadgeClass */
export const statusColors: Record<PetStatus, string> = petStatusBorderedBadgeClass;

export { petScenarioFromStatus };

export const animalTypeLabels: Record<AnimalType, string> = {
  cat: 'Кот',
  dog: 'Собака',
  other: 'Другое',
};

export const colorLabels: Record<PetColor, string> = {
  black: 'Чёрный',
  white: 'Белый',
  gray: 'Серый',
  brown: 'Коричневый',
  red: 'Рыжий',
  mixed: 'Смешанный',
  spotted: 'Пятнистый',
  striped: 'Полосатый',
};

export const genderLabels: Record<Gender, string> = {
  male: 'Самец',
  female: 'Самка',
  unknown: 'Неизвестно',
};

export const activeStatuses: PetStatus[] = ['searching', 'found'];

export { formatDate, formatCalendarDate, formatRelativeTime } from './formatDate';

export {
  petScenarioAccentClass,
  petScenarioBorderedBadgeClass,
  petScenarioPhotoPillClass,
  petScenarioSoftPillClass,
  petScenarioFilterSelectedClass,
  petScenarioFormToggleActiveClass,
  petScenarioDetailBannerClass,
  petScenarioFlyerColors,
  petScenarioStatsIconClass,
  PET_SCENARIO_MARKER_HEX,
  petScenarioFromPetScope,
  petScenarioFromPet,
  type PetScenario,
  type LostFoundScenario,
} from '@/shared/lib/pet-scenario-colors';
