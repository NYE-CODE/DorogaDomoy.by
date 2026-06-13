import type { ComponentProps, ReactNode } from 'react';

export interface ModalProps extends ComponentProps<'div'> {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export interface ModalContentProps extends ComponentProps<'div'> {
  showCloseButton?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: ReactNode;
}

export interface ModalHeaderProps {
  title?: ReactNode;
  description?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}
