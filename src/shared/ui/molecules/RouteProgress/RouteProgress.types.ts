import type { CSSProperties } from 'react';

export interface RouteProgressProps {
  /** Всего шагов (последний шаг — «дом»). */
  totalSteps: number;
  /** Текущий шаг, 1-based. */
  currentStep: number;
  /** Локализованная подпись прогресса (aria-label), например t.petForm.stepOf. */
  label: string;
  className?: string;
  style?: CSSProperties;
}
