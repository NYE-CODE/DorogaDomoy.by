import { cn } from '@/shared/lib/classNames';
import type { IconProps, IconSize } from './Icon.types';
import styles from './Icon.module.css';

const sizeClass: Record<IconSize, string> = {
  xs: styles.xs,
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
};

/**
 * Обёртка над Lucide-иконкой с единым size API.
 * Декоративные иконки: aria-hidden. Смысловые — передайте aria-label.
 */
function Icon({
  icon: LucideComponent,
  size = 'sm',
  className,
  style,
  'aria-hidden': ariaHidden = true,
  'aria-label': ariaLabel,
}: IconProps) {
  return (
    <LucideComponent
      className={cn(styles.root, sizeClass[size], className)}
      style={style}
      aria-hidden={ariaHidden}
      aria-label={ariaLabel}
    />
  );
}

export { Icon };
export type { IconProps, IconSize } from './Icon.types';
