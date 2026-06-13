import type { ComponentProps, ReactNode } from 'react';

export type CardProps = ComponentProps<'div'> & {
  className?: string;
  style?: React.CSSProperties;
};

export interface DropdownProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  triggerClassName?: string;
  children: ReactNode;
}

export interface DropdownItemProps {
  value: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children: ReactNode;
}
