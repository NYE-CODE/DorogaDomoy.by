import type { CSSProperties } from 'react';

/**
 * Регистр медальона:
 * - lost / found / shelter — сценарные ободки (см. pet-scenario-colors);
 * - medallion — латунь адресника (QR-профили, «церемониальные» места).
 */
export type PetMedallionRegister = 'lost' | 'found' | 'shelter' | 'medallion';

/** 40 / 48 / 96 / 160 px — списки, шапки, профиль, QR-жетон. */
export type PetMedallionSize = 'sm' | 'md' | 'lg' | 'xl';

export interface PetMedallionProps {
  /** URL фото питомца; при отсутствии/ошибке — плейсхолдер. */
  src?: string;
  /** Alt из i18n; для декоративных мест — пустая строка (по умолчанию). */
  alt?: string;
  register: PetMedallionRegister;
  size?: PetMedallionSize;
  /**
   * «Ушко» жетона (кольцо-отверстие сверху). Только церемониальные места:
   * QR-жетон, success-экраны, empty states. Не в списках и не на карте.
   */
  withEar?: boolean;
  className?: string;
  style?: CSSProperties;
}
