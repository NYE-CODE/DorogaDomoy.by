import type { ComponentProps } from 'react';

export interface InputProps extends ComponentProps<'input'> {
  className?: string;
  style?: React.CSSProperties;
}
