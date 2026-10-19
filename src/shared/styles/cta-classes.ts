/**
 * CTA-кнопки приложения — обёртки над Button variants (h-12, text-base).
 * Лендинг: `landing/app/components/landing-cta.tsx` (`LandingCta`).
 */
import { buttonVariants } from '@/shared/ui/_primitives/button';
import { cn } from '@/shared/ui/utils';

/** Primary CTA (рядом с outline — border transparent для выравнивания высоты). */
export const appPrimaryCtaClass = cn(
  buttonVariants({ variant: 'default', size: 'cta' }),
  'border border-transparent',
);

/** Outline CTA рядом с primary (app). */
export const appOutlineCtaClass = cn(
  buttonVariants({ variant: 'outline', size: 'cta' }),
  'border border-foreground',
);

/** Telegram / Viber — та же высота, цвет задаётся отдельно. */
export const appMessengerCtaSizingClass = buttonVariants({ size: 'cta' });
