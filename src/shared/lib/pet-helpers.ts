import { PetStatus, AnimalType, PetColor, Gender } from '@/entities/pet/model/types';

export const statusLabels: Record<PetStatus, string> = {
  searching: 'Ищут',
  found: 'Найден',
};

/**
 * Единая палитра статусов: «ищут» — rose; «найден» — sky (без зелёного «успех/дома»).
 * Используйте эти константы вместо разрозненных primary/secondary/green.
 */

/** Бейдж с рамкой (карточка объявления, превью на карте) */
export const petStatusBorderedBadgeClass: Record<PetStatus, string> = {
  searching:
    'border-rose-200/90 bg-rose-50 text-rose-900 dark:border-rose-800/80 dark:bg-rose-950/40 dark:text-rose-100',
  found:
    'border-sky-200/90 bg-sky-50 text-sky-950 dark:border-sky-800/80 dark:bg-sky-950/45 dark:text-sky-100',
};

/** Плашка на фото (компактная карточка, лендинг) — хороший контраст на снимке */
export const petStatusPhotoPillClass: Record<PetStatus, string> = {
  searching: 'bg-rose-600/95 text-white shadow-sm backdrop-blur-sm dark:bg-rose-600 dark:text-white',
  found: 'bg-sky-600/95 text-white shadow-sm backdrop-blur-sm dark:bg-sky-600 dark:text-white',
};

/** Мягкий pill в списках и в блоке «Информация» на странице объявления */
export const petStatusSoftPillClass: Record<PetStatus, string> = {
  searching: 'bg-rose-100 text-rose-900 dark:bg-rose-950/45 dark:text-rose-100',
  found: 'bg-sky-100 text-sky-950 dark:bg-sky-950/45 dark:text-sky-100',
};

/** Фильтр поиска: выбранный чип статуса */
export const petStatusFilterSelectedClass: Record<PetStatus, string> = {
  searching:
    'border-rose-400/55 bg-rose-500/12 text-rose-950 shadow-sm dark:border-rose-600 dark:bg-rose-950/50 dark:text-rose-100',
  found:
    'border-sky-500/45 bg-sky-500/12 text-sky-950 shadow-sm dark:border-sky-600 dark:bg-sky-950/50 dark:text-sky-100',
};

import { tokens } from '@/shared/styles/tokens';

/** Обводка круглого маркера на карте (Leaflet) — из design tokens */
export const PET_STATUS_MARKER_BORDER_HEX: Record<PetStatus, string> = {
  searching: tokens.map.searching,
  found: tokens.map.found,
};

/** @deprecated Используйте petStatusBorderedBadgeClass; оставлен для совместимости импортов */
export const statusColors: Record<PetStatus, string> = petStatusBorderedBadgeClass;

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
