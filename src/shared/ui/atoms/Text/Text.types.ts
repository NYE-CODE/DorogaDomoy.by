import type { ComponentProps, ElementType } from 'react';

export type TextVariant =
  | 'body'
  | 'caption'
  | 'label'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'heading4';

export type TextAs = 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'label';

export interface TextProps extends ComponentProps<'p'> {
  as?: TextAs;
  variant?: TextVariant;
  className?: string;
  style?: React.CSSProperties;
}

export type TextComponent = ElementType;
