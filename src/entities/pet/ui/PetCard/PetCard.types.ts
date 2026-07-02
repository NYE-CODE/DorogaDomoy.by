import type { CSSProperties } from 'react';
import type { Pet } from '../../model/types';

export interface PetCardProps {
  pet: Pet;
  /**
   * Открывает существующий сценарий листовки (модалка выбора + окно печати A4
   * на странице объявления). Кнопка не рендерится, если колбэк не передан.
   */
  onDownloadFlyer?: (pet: Pet) => void;
  className?: string;
  style?: CSSProperties;
}
