/** Единые классы полей форм — синхронизированы с `@/shared/ui/input`. */
import { cn } from '@/shared/ui/utils';

const inputBase =
  'w-full min-w-0 rounded-lg border border-input bg-input-background px-3 py-2.5 text-base text-foreground outline-none transition-[color,box-shadow,border-color] placeholder:text-muted-foreground hover:border-primary/50 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm';

/** Стандартное поле (совпадает с Input primitive). */
export const formInputClass = inputBase;

export const formInputErrorClass = 'border-destructive focus-visible:ring-destructive/30';

export const formTextareaClass = cn(inputBase, 'min-h-[5rem] resize-none');

export const formNativeSelectClass = inputBase;

export const formFocusRingClass = 'outline-none focus-visible:ring-2 focus-visible:ring-ring/50';

/** Legacy page-формы с чуть большим padding. */
export const formPageInputClass = cn(inputBase, 'px-4 py-3');

export const formPageBorderMutedClass = 'border-border';
