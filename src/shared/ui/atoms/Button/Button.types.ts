import type { VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import type { buttonVariants } from '@/shared/ui/_primitives/button';

export type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>;
export type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>['size']>;

export interface ButtonProps
  extends ComponentProps<'button'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  className?: string;
  style?: React.CSSProperties;
}
