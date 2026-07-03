import { StatusBadge, Text } from '@/shared/ui/atoms';
import { cn } from '@/shared/lib/classNames';
import type { AdCardHeaderProps } from './AdCardHeader.types';

/**
 * Шапка объявления: заголовок + статус + дата.
 * Заголовок и бейдж — в одной строке (статус считывается сразу),
 * дата — приглушённым тоном ниже, чтобы не конкурировать с сутью.
 */
function AdCardHeader({
  title,
  status,
  statusLabel,
  dateText,
  dateTime,
  headingAs = 'h3',
  className,
  style,
}: AdCardHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-1', className)} style={style}>
      <div className="flex items-start justify-between gap-2">
        <Text as={headingAs} variant="heading3" className="min-w-0 truncate">
          {title}
        </Text>
        <StatusBadge status={status} className="shrink-0">
          {statusLabel}
        </StatusBadge>
      </div>
      <Text as="span" variant="caption">
        <time dateTime={dateTime}>{dateText}</time>
      </Text>
    </header>
  );
}

export { AdCardHeader };
export type { AdCardHeaderProps } from './AdCardHeader.types';
