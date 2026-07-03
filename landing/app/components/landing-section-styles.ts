/**
 * Единые классы секций маркетингового лендинга (отступы, типографика, контейнеры).
 * Контейнеры и spacing — из layout-classes.ts (max-width 1200px).
 */

import { interactiveTransitionClass } from '@/shared/styles/interactive-classes';
import { typoEngraved } from '@/shared/styles/typography-classes';
import { cn } from './ui/utils';

export {
  landingSectionY,
  landingHeroY,
  landingContainerWide,
  landingContainerNarrow,
  landingContainerReadable,
  landingSectionHeader,
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

/** Базовая секция: чистый фон, якорь для скролла. */
export const landingSectionBase = 'scroll-mt-24 bg-background';

/** Чередующаяся полоса — легче прежнего landingBandMuted. */
export const landingSectionAlt = 'scroll-mt-24 bg-muted/20';

/** @deprecated используйте landingSectionAlt */
export const landingBandMuted = 'bg-muted/20';

/** Панель в стиле hero: рамка, без тяжёлых теней. */
export const landingPanel = 'overflow-hidden rounded-lg border border-border bg-card';

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

export {
  landingOutlineHeroCtaClass,
  landingPrimaryCtaClass,
  landingHeaderPrimaryCtaClass,
} from '../../../styles/cta-classes';
