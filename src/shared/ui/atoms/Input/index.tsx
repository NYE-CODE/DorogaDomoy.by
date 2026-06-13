import { Input as PrimitiveInput } from '@/shared/ui/_primitives/input';
import { cn } from '@/shared/lib/classNames';
import type { InputProps } from './Input.types';
import styles from './Input.module.css';

/** Текстовое поле ввода с focus/disabled состояниями. */
function Input({ className, style, ...props }: InputProps) {
  return (
    <PrimitiveInput
      className={cn(styles.root, className)}
      style={style}
      {...props}
    />
  );
}

export { Input };
export type { InputProps } from './Input.types';
