/**
 * Общие поверхности app-страниц в визуальном языке лендинга / поиска.
 * Токены: bg-landing, shadow-card, rounded-2xl/3xl, landing-dark.
 */

import { cn } from '@/shared/ui/utils';
import {
  focusRingClass,
  interactiveTransitionClass,
} from '@/shared/styles/interactive-classes';

/** Фон страницы (поиск, создание объявления). */
export const surfacePage = 'bg-landing';

/** Карточка / панель контента. */
export const surfacePanel =
  'overflow-hidden rounded-2xl border border-border bg-card shadow-card';

/** Мягкий колодец как sidebar фильтров. */
export const surfaceMutedWell = 'overflow-hidden rounded-3xl bg-landing-muted/80';

/** Шапка шагов визарда. */
export const surfaceStepBar =
  'border-b border-border/80 bg-card/90 backdrop-blur-sm';

/** Крупная choice-карточка (сценарий lost/found). */
export const surfaceChoiceCard = cn(
  interactiveTransitionClass,
  focusRingClass,
  'group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center',
  'hover:border-primary/35 hover:shadow-card',
);

export const surfaceChoiceIconBase =
  'flex size-14 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-[1.04]';

export const surfaceChoiceIconLost = cn(
  surfaceChoiceIconBase,
  'bg-lost-soft text-lost',
);

export const surfaceChoiceIconFound = cn(
  surfaceChoiceIconBase,
  'bg-found-soft text-found',
);

export const surfaceChoiceIconBrand = cn(
  surfaceChoiceIconBase,
  'bg-primary/10 text-primary',
);

export const surfaceChoiceIconMuted = cn(
  surfaceChoiceIconBase,
  'bg-landing-muted text-muted-foreground',
);

/** Чип выбора (порода/цвет/тип) — активный как фильтры поиска. */
export const surfaceChip = cn(
  interactiveTransitionClass,
  focusRingClass,
  'inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium',
);

export const surfaceChipActive =
  'bg-landing-dark text-on-landing-dark shadow-sm';

export const surfaceChipIdle =
  'bg-landing-muted/80 text-muted-foreground hover:bg-landing-muted hover:text-foreground';

/** Primary CTA — pill как LandingCta. */
export const surfaceCtaPrimary = cn(
  interactiveTransitionClass,
  focusRingClass,
  'inline-flex h-12 min-h-12 w-full items-center justify-center gap-2 rounded-full',
  'bg-primary px-7 text-base font-semibold text-landing-dark shadow-sm',
  'hover:bg-primary-hover',
  'disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none',
);

export const surfaceCtaOutline = cn(
  interactiveTransitionClass,
  focusRingClass,
  'inline-flex h-12 min-h-12 w-full items-center justify-center gap-2 rounded-full',
  'border border-border bg-card px-7 text-base font-semibold text-foreground',
  'hover:bg-landing-muted/80',
);

/** Круглая icon-кнопка назад / закрыть. */
export const surfaceIconButton = cn(
  interactiveTransitionClass,
  focusRingClass,
  'inline-flex size-10 shrink-0 items-center justify-center rounded-full',
  'text-muted-foreground hover:bg-landing-muted hover:text-foreground',
);

/** Подпись поля формы. */
export const surfaceFieldLabel =
  'mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground';

/** Текстовый input / textarea на page-форме. */
export const surfaceInput = cn(
  'w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground',
  'placeholder:text-muted-foreground',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent',
);

/** Радио / выбор контактов. */
export const surfaceSelectRow = cn(
  interactiveTransitionClass,
  'flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-card p-4',
  'hover:bg-landing-muted/50',
);

/** Зона загрузки фото. */
export const surfaceUploadZone = cn(
  interactiveTransitionClass,
  'flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border',
  'bg-landing-muted/40 hover:border-primary/50 hover:bg-landing-muted/70',
);

/** Пустое состояние. */
export const surfaceEmpty = cn(
  'rounded-2xl border border-dashed border-border bg-landing-muted/40 px-4 py-8 text-center',
);
