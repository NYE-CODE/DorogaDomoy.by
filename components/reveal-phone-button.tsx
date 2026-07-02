import { useState } from 'react';
import { Phone } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/ui/utils';
import { appPrimaryCtaClass } from '@/shared/styles/cta-classes';

type RevealPhoneButtonProps = {
  phone: string;
  className?: string;
};

function normalizeTelHref(phone: string): string {
  return `tel:${phone.replace(/[\s-]/g, '')}`;
}

export function RevealPhoneButton({ phone, className }: RevealPhoneButtonProps) {
  const { t } = useI18n();
  const [revealed, setRevealed] = useState(false);
  const trimmed = phone.trim();

  if (!trimmed) return null;

  if (revealed) {
    return (
      <Button className={cn(appPrimaryCtaClass, 'w-full', className)} asChild>
        <a href={normalizeTelHref(trimmed)}>
          <Phone className="size-5" aria-hidden />
          {trimmed}
        </a>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      className={cn(appPrimaryCtaClass, 'w-full', className)}
      onClick={() => setRevealed(true)}
    >
      <Phone className="size-5" aria-hidden />
      {t.petDetail.showPhoneNumber}
    </Button>
  );
}
