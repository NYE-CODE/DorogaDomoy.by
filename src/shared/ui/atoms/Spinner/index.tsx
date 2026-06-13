import { cn } from '@/shared/lib/classNames';
import type { SpinnerProps, SpinnerSize } from './Spinner.types';
import styles from './Spinner.module.css';

const sizeClass: Record<SpinnerSize, string> = {
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
};

/**
 * Индикатор загрузки без привязки к layout страницы.
 */
function Spinner({ size = 'md', label = 'Загрузка…', className, style }: SpinnerProps) {
  return (
    <span className={cn(styles.root, className)} style={style} role="status" aria-live="polite">
      <span className={cn(styles.ring, sizeClass[size])} aria-hidden />
      <span className={styles.srOnly}>{label}</span>
    </span>
  );
}

export { Spinner };
export type { SpinnerProps, SpinnerSize } from './Spinner.types';
