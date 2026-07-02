import type { CSSProperties, ReactNode } from 'react';

/** Сценарии платформы; синхронизировано с PetScenario (@/shared/lib/pet-scenario-colors). */
export type StatusBadgeStatus = 'lost' | 'found' | 'shelter';

export interface StatusBadgeProps {
  status: StatusBadgeStatus;
  /** Локализованная подпись статуса (из t.*), текст обязателен — статус не кодируется одним цветом. */
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}
