import type { CSSProperties } from 'react';
import type { StatusBadgeStatus } from '@/shared/ui/atoms';

export interface AdCardHeaderProps {
  /** Локализованный заголовок объявления (кличка / краткое описание). */
  title: string;
  /** Локализованный текст статуса для бейджа (из t.*). */
  statusLabel: string;
  status: StatusBadgeStatus;
  /** Отформатированная локализованная дата (форматирование — на вызывающей стороне). */
  dateText: string;
  /** ISO-значение для <time dateTime>, чтобы дата была машиночитаемой. */
  dateTime?: string;
  /** Уровень заголовка в документе; по умолчанию h3 (карточка в списке). */
  headingAs?: 'h2' | 'h3' | 'h4';
  className?: string;
  style?: CSSProperties;
}
