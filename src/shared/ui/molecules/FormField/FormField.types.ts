import type { ComponentProps, ReactNode } from 'react';
import type { InputProps } from '@/shared/ui/atoms/Input';

export interface FormFieldProps extends Omit<InputProps, 'id'> {
  id: string;
  label: ReactNode;
  error?: ReactNode;
  hint?: ReactNode;
  required?: boolean;
  labelClassName?: string;
  errorClassName?: string;
  className?: string;
  style?: React.CSSProperties;
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
}

export type FormFieldInputProps = ComponentProps<'input'>;
