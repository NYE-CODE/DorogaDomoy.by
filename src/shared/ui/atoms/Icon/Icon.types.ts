import type { LucideIcon } from 'lucide-react';
import type { CSSProperties } from 'react';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg';

export interface IconProps {
  icon: LucideIcon;
  size?: IconSize;
  className?: string;
  style?: CSSProperties;
  'aria-hidden'?: boolean;
  'aria-label'?: string;
}
