/**
 * Единый компактный размер кнопок CTA (h-12, text-base): шапка лендинга, Hero,
 * блоки лендинга и экраны приложения.
 */

/** Шапка лендинга: одна primary без «пары» outline — без прозрачной обводки. */
export const landingHeaderPrimaryCtaClass =
  'inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-base font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90';

/**
 * Основная CTA в сетке (рядом с outline): border-2 transparent,
 * чтобы высота совпадала с соседней кнопкой с border-2.
 */
export const appPrimaryCtaClass =
  'inline-flex h-12 items-center justify-center gap-2 rounded-lg border-2 border-transparent bg-primary px-6 text-base font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90';

/** Outline рядом с primary. */
export const appOutlineCtaClass =
  'inline-flex h-12 items-center justify-center gap-2 rounded-lg border-2 border-foreground bg-background px-6 text-base font-medium text-foreground transition-colors hover:bg-muted';

/** Telegram / Viber — та же высота. */
export const appMessengerCtaSizingClass =
  'inline-flex h-12 items-center justify-center gap-2 rounded-lg px-6 text-base font-medium shadow-sm';

/** Лендинг (Hero, announcements, pets-feature): тот же размер, что приложение. */
export const landingPrimaryCtaClass = appPrimaryCtaClass;

/** Вторая кнопка в Hero («на карте») и пр. — как app outline. */
export const landingOutlineHeroCtaClass = appOutlineCtaClass;
