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

/** Точка-«заклёпка» жетона — насыщенный цвет сценария. */
const dotClass: Record<StatusBadgeStatus, string> = {
  lost: 'bg-lost',
  found: 'bg-found',
  shelter: 'bg-shelter',
};

/**
 * Статус-жетон объявления: «Пропал» / «Найден» / «Ищет дом».
 * Форма пилюли с заклёпкой + «гравировка» — визуальный язык бирки-адресника.
 * Цвет + обязательный текст (WCAG 1.4.1), контраст пар ≥ 7:1.
 */
function StatusBadge({ status, className, style, children }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        styles.root,
        'rounded-full typo-engraved gap-1.5',
        statusClass[status],
        className,
      )}
      style={style}
    >
      <span aria-hidden="true" className={cn('size-1.5 rounded-full', dotClass[status])} />
      {children}
    </Badge>
  );
}

export { StatusBadge };
export type { StatusBadgeProps, StatusBadgeStatus } from './StatusBadge.types';
