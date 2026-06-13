import type { ReactNode, CSSProperties } from 'react';

export interface DropdownProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  triggerClassName?: string;
  children: ReactNode;
}

export interface DropdownItemProps {
  value: string;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}
