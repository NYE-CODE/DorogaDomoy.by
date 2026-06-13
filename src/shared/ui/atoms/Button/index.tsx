import { Button as PrimitiveButton, buttonVariants } from '@/shared/ui/_primitives/button';
import { cn } from '@/shared/lib/classNames';
import type { ButtonProps } from './Button.types';
import styles from './Button.module.css';

/**
 * Кнопка действия. Три основных варианта: default (primary), outline (secondary), ghost.
 * Размер cta (h-12) — для hero/landing и ключевых действий на странице.
 */
function Button({ className, style, ...props }: ButtonProps) {
  return (
    <PrimitiveButton
      className={cn(styles.root, className)}
      style={style}
      {...props}
    />
  );
}

export { Button, buttonVariants };
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button.types';
