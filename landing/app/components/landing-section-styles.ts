/**
 * Единые классы секций маркетингового лендинга (отступы, типографика, контейнеры).
 * Используйте импорты отсюда, чтобы секции не расходились по виду.
 */

/** Вертикальные отступы типовой контент-секции (не hero). */
export const landingSectionY = "py-16 md:py-20";

/** Hero чуть выше по воздуху, чем остальные блоки. */
export const landingHeroY = "py-16 md:py-24";

/** Основная сетка контента на всю ширину каркаса. */
export const landingContainerWide = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8";

/** Узкий контейнер для плотных блоков (QR, часть лендинговых секций). */
export const landingContainerNarrow = "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8";

/** FAQ и подобное — фокус на читаемости текста. */
export const landingContainerReadable = "max-w-3xl mx-auto px-4 sm:px-6 lg:px-8";

/** Обёртка заголовка секции по центру. */
export const landingSectionHeader = "text-center mb-10 md:mb-12";

/** Заголовок h2 секции. */
export const landingH2 = "text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-3";

/** Подзаголовок под h2 (без max-width). */
export const landingLead =
  "text-base md:text-lg text-muted-foreground leading-relaxed";

/** Подзаголовок по центру, стандартная ширина. */
export const landingLeadCenter = `${landingLead} max-w-2xl mx-auto`;

/** Длинный подзаголовок по центру. */
export const landingLeadWideCenter = `${landingLead} max-w-3xl mx-auto`;

/** Спокойный фон «полосы» между секциями на bg-background. */
export const landingBandMuted = "bg-muted/40";

export {
  landingOutlineHeroCtaClass,
  landingPrimaryCtaClass,
  landingHeaderPrimaryCtaClass,
} from '../../../styles/cta-classes';
