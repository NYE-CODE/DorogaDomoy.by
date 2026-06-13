import {
  Card as PrimitiveCard,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui/_primitives/card';
import { cn } from '@/shared/lib/classNames';
import type { CardProps } from './Card.types';
import styles from './Card.module.css';

/** Контейнер контента с header/footer слотами. */
function Card({ className, style, ...props }: CardProps) {
  return <PrimitiveCard className={cn(styles.root, className)} style={style} {...props} />;
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
};
export type { CardProps } from './Card.types';
