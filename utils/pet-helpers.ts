import { PetStatus, AnimalType, PetColor, Gender } from '../types/pet';

export const statusLabels: Record<PetStatus, string> = {
  searching: 'Ищут',
  found: 'Найден',
};

export const statusColors: Record<PetStatus, string> = {
  searching: 'bg-red-100 text-red-700 border-red-200',
  found: 'bg-blue-100 text-blue-700 border-blue-200',
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
export const completedStatuses: PetStatus[] = [];

export const isActiveStatus = (status: PetStatus): boolean => {
  return activeStatuses.includes(status);
};

export const isCompletedStatus = (status: PetStatus): boolean => {
  return completedStatuses.includes(status);
};

export const formatDate = (date: Date): string => {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Сегодня';
  if (diffDays === 1) return 'Вчера';
  if (diffDays < 7) return `${diffDays} дн. назад`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} нед. назад`;
  
  return date.toLocaleDateString('ru-RU');
};