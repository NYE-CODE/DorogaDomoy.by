import { cn } from '@/shared/lib/classNames';
import type { TextAs, TextProps, TextVariant } from './Text.types';
import styles from './Text.module.css';

const variantClass: Record<TextVariant, string> = {
  body: styles.body,
  caption: styles.caption,
  label: styles.label,
  heading1: styles.heading1,
  heading2: styles.heading2,
  heading3: styles.heading3,
  heading4: styles.heading4,
};

/**
 * Типографический текст с предсказуемой шкалой размеров.
 * Не содержит бизнес-логики.
 */
function Text({
  as: Component = 'p',
  variant = 'body',
  className,
  style,
  children,
  ...props
}: TextProps) {
  const Tag = Component as TextAs;

  return (
    <Tag className={cn(variantClass[variant], className)} style={style} {...props}>
      {children}
    </Tag>
  );
}

export { Text };
export type { TextProps, TextVariant, TextAs } from './Text.types';
