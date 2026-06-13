/**
 * CTA-кнопки — обёртки над Button variants (h-12, text-base).
 * Используйте `<Button size="cta">` или эти классы с `<Button className={…}>`.
 */
import { buttonVariants } from '@/shared/ui/_primitives/button';
import { cn } from '@/shared/ui/utils';

/** Primary CTA (рядом с outline — border-2 transparent для выравнивания высоты). */
export const appPrimaryCtaClass = cn(
  buttonVariants({ variant: 'default', size: 'cta' }),
  'border-2 border-transparent',
);

/** Outline CTA рядом с primary. */
export const appOutlineCtaClass = cn(
  buttonVariants({ variant: 'outline', size: 'cta' }),
  'border-2 border-foreground',
);

/** Шапка лендинга: primary без прозрачной обводки. */
export const landingHeaderPrimaryCtaClass = buttonVariants({
  variant: 'default',
  size: 'cta',
});

/** Telegram / Viber — та же высота, цвет задаётся отдельно. */
export const appMessengerCtaSizingClass = buttonVariants({ size: 'cta' });

export const landingPrimaryCtaClass = appPrimaryCtaClass;
export const landingOutlineHeroCtaClass = appOutlineCtaClass;
