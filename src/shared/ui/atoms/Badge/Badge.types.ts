import type { VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import type { badgeVariants } from '@/shared/ui/_primitives/badge';

export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

export interface BadgeProps
  extends ComponentProps<'span'>,
    VariantProps<typeof badgeVariants> {
  asChild?: boolean;
  className?: string;
  style?: React.CSSProperties;
}
