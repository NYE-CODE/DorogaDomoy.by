/**
 * Единые классы секций маркетингового лендинга (отступы, типографика, контейнеры).
 * Контейнеры и spacing — из layout-classes.ts (max-width 1200px).
 */

import { interactiveTransitionClass } from '@/shared/styles/interactive-classes';
import { typoEngraved } from '@/shared/styles/typography-classes';
import { cn } from './ui/utils';

export {
  landingSectionY,
  landingSectionYTight,
  landingHeroY,
  landingContainerWide,
  landingContainerNarrow,
  landingContainerReadable,
  pageContainer as landingPageContainer,
} from '@/shared/styles/layout-classes';

/** Заголовок h2 секции лендинга. */
export const landingH2 = 'typo-h2 mb-3';

/** Подзаголовок под h2 (без max-width). */
export const landingLead = 'typo-lead';

/** Подзаголовок по центру, стандартная ширина. */
export const landingLeadCenter = `${landingLead} max-w-2xl mx-auto`;

/** Длинный подзаголовок по центру. */
export const landingLeadWideCenter = `${landingLead} max-w-3xl mx-auto`;

/**
 * Шапка секции по центру.
 * Отступ до контента единый для всех секций (не page-header-block — он слишком плотный).
 */
export const landingSectionHeader = 'mb-10 text-center sm:mb-12';

/** Шапка секции слева (shelter, pets-feature). */
export const landingSectionHeaderLeft = 'mb-10 sm:mb-12';

/** h3 в шагах / карточках / списках. */
export const landingH3 =
  'text-base font-semibold leading-snug text-foreground sm:text-lg';

/** Вторичный текст под заголовком шага / карточки. */
export const landingMuted = 'text-sm leading-relaxed text-muted-foreground';

/** Номер шага — бренд-оранж (how-it-works). */
export const landingStepNum =
  'font-display text-sm font-semibold tabular-nums tracking-wide text-primary';

/** Номер шага — латунь адресника (pets-feature). */
export const landingStepNumMedallion =
  'font-display text-sm font-semibold tabular-nums tracking-wide text-medallion';

/** Базовая секция: чистый фон, якорь для скролла. */
export const landingSectionBase = 'scroll-mt-24 bg-background';

/** Чередующаяся полоса — тёплый landing muted. */
export const landingSectionAlt = 'scroll-mt-24 bg-landing-muted/80';

/** @deprecated используйте landingSectionAlt */
export const landingBandMuted = 'bg-landing-muted/80';

/**
 * Тёмный лесной блок (карта, футер). Цвет ≠ scenario-shelter.
 * Текст: on-landing-dark / on-landing-dark-muted.
 */
export const landingSectionDark =
  'scroll-mt-24 bg-landing-dark text-on-landing-dark';

/** Панель / карточка лендинга: мягкий радиус и shadow-card. */
export const landingPanel =
  'overflow-hidden rounded-2xl border border-border bg-card shadow-card';

/** Search bar / крупный input-кластер на hero. */
export const landingSearchShell =
  'overflow-hidden rounded-3xl border border-border bg-card shadow-search';

/** Ячейка навигации / списка (три пути, табы, шаги). */
export const landingCell = cn(
  interactiveTransitionClass,
  'hover:bg-muted/40',
);

/** Kicker над заголовком (как badge в hero). */
export const landingKicker = cn(
  typoEngraved,
  'inline-flex rounded-full border border-medallion-border bg-medallion-soft px-3 py-1 text-medallion-foreground',
);

/** Тонкая полоса сценарного акцента — как три пути в hero. */
export const landingPathAccentBorder = {
  lost: 'border-l-lost sm:border-l-0 sm:border-t-lost',
  found: 'border-l-found sm:border-l-0 sm:border-t-found',
  shelter: 'border-l-shelter sm:border-l-0 sm:border-t-shelter',
  primary: 'border-l-primary sm:border-l-0 sm:border-t-primary',
  medallion: 'border-l-medallion sm:border-l-0 sm:border-t-medallion',
} as const;

/** Иконка в нейтральном чипе. */
export const landingIconChip =
  'flex size-10 shrink-0 items-center justify-center rounded-lg bg-medallion-soft text-medallion';

export const landingIconChipPrimary =
  'flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary';
