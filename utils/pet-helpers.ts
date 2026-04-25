import { PetStatus, AnimalType, PetColor, Gender } from '../types/pet';

export const statusLabels: Record<PetStatus, string> = {
  searching: 'Ищут',
  found: 'Найден',
};

export const statusColors: Record<PetStatus, string> = {
  searching: 'bg-primary/10 text-primary border-primary/30 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
  found: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
};

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

export const formatDate = (date: Date): string => {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Сегодня';
  if (diffDays === 1) return 'Вчера';
  if (diffDays < 7) return `${diffDays} дн. назад`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} нед. назад`;

  return date.toLocaleDateString('ru-BY');
};

/** Полная календарная дата (без «вчера / N дн. назад») — чтобы не дублировать относительное время. */
export const formatCalendarDate = (date: Date, locale = 'ru-BY'): string =>
  date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

/** Для лендинга: "2 ч. назад", "1 день назад" */
export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'только что';
  if (diffMins < 60) return `${diffMins} мин. назад`;
  if (diffHours < 24) return `${diffHours} ч. назад`;
  if (diffDays === 1) return '1 день назад';
  if (diffDays < 7) return `${diffDays} дн. назад`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} нед. назад`;
  return date.toLocaleDateString('ru-BY');
};
