import type { CSSProperties, ReactNode } from 'react';

export interface HeaderOrganismProps {
  logo?: ReactNode;
  navigation?: ReactNode;
  actions?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export interface SidebarOrganismProps {
  header?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export interface DataTableOrganismProps {
  toolbar?: ReactNode;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export interface FormOrganismProps extends React.FormHTMLAttributes<HTMLFormElement> {
  title?: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}
