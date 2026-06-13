import { forwardRef } from 'react';
import { Badge as PrimitiveBadge, badgeVariants } from '@/shared/ui/_primitives/badge';
import { cn } from '@/shared/lib/classNames';
import type { BadgeProps } from './Badge.types';
import styles from './Badge.module.css';

/**
 * Компактная метка статуса или категории.
 */
const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { className, style, ...props },
  ref,
) {
  return (
    <PrimitiveBadge
      ref={ref}
      className={cn(styles.root, className)}
      style={style}
      {...props}
    />
  );
});

export { Badge, badgeVariants };
export type { BadgeProps, BadgeVariant } from './Badge.types';
