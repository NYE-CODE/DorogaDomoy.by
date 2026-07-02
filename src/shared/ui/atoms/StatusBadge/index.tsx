import { Badge } from '../Badge';
import { cn } from '@/shared/lib/classNames';
import type { StatusBadgeProps, StatusBadgeStatus } from './StatusBadge.types';
import styles from './StatusBadge.module.css';

/** Пары «пастельный фон / насыщенный текст» — семантические токены статусов (tokens.css, Фаза 2). */
const statusClass: Record<StatusBadgeStatus, string> = {
  lost: 'border-lost-border bg-lost-soft text-lost-foreground',
  found: 'border-found-border bg-found-soft text-found-foreground',
  shelter: 'border-shelter-border bg-shelter-soft text-shelter-foreground',
};

/**
 * Статусный мини-тег объявления: «Пропал» / «Найден» / «Ищет дом».
 * Цвет + обязательный текст (WCAG 1.4.1), контраст пар ≥ 7:1.
 */
function StatusBadge({ status, className, style, children }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(styles.root, 'rounded-lg', statusClass[status], className)}
      style={style}
    >
      {children}
    </Badge>
  );
}

export { StatusBadge };
export type { StatusBadgeProps, StatusBadgeStatus } from './StatusBadge.types';
