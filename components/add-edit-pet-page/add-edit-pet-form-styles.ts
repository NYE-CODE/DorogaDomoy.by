import { cn } from '@/shared/lib/classNames';
import { surfaceFieldLabel } from '@/shared/styles/surface-classes';

/** Подпись поля — как в фильтрах поиска. */
export const profilePetFieldLabel = surfaceFieldLabel;

export const profilePetField = 'space-y-1.5';

/** Input / select — высота и радиус как у фильтров. */
export const profilePetInput = cn(
  'h-11 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground',
  'placeholder:text-muted-foreground outline-none',
  'ring-offset-background transition-shadow',
  'focus-visible:ring-2 focus-visible:ring-ring',
);

export const profilePetTextarea = cn(
  'min-h-[5.5rem] w-full resize-none rounded-lg border border-border bg-card px-3 py-3 text-sm text-foreground',
  'placeholder:text-muted-foreground outline-none',
  'ring-offset-background transition-shadow',
  'focus-visible:ring-2 focus-visible:ring-ring',
);

/**
 * Сегментированный выбор (вид / пол / да-нет) —
 * track как тип животного в фильтрах поиска.
 */
export const profilePetSegmentTrack =
  'grid gap-0.5 rounded-md border border-border bg-muted/60 p-0.5';

export function profilePetSegmentClass(active: boolean) {
  return cn(
    'flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium transition-all',
    active
      ? 'bg-card text-foreground shadow-sm'
      : 'text-muted-foreground hover:bg-background/80 hover:text-foreground',
  );
}

/**
 * Теги мультивыбора (окрас) и одновыбора с сеткой (характер) —
 * как чипы окраса в фильтрах.
 */
export function profilePetTagClass(active: boolean) {
  return cn(
    'min-h-11 min-w-0 rounded-lg border px-2.5 py-2 text-center text-sm leading-snug transition-all',
    active
      ? 'border-primary/45 bg-primary/12 text-primary shadow-sm'
      : 'border-border bg-card text-foreground hover:bg-muted/80',
  );
}
