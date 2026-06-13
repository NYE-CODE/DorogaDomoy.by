/**
 * Единые классы секций маркетингового лендинга (отступы, типографика, контейнеры).
 * Контейнеры и spacing — из layout-classes.ts (max-width 1200px).
 */

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

/** Спокойный фон «полосы» между секциями на bg-background. */
export const landingBandMuted = 'bg-muted/40';

export {
  landingOutlineHeroCtaClass,
  landingPrimaryCtaClass,
  landingHeaderPrimaryCtaClass,
} from '../../../styles/cta-classes';
