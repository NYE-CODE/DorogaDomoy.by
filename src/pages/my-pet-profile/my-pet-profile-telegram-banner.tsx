import { Link } from 'react-router';
import { MessageCircle } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/card';
import { cn } from '@/shared/ui/utils';
import { appPrimaryCtaClass } from '@/shared/styles/cta-classes';

export interface MyPetProfileTelegramBannerProps {
  title: string;
  hint: string;
  ctaLabel: string;
}

export function MyPetProfileTelegramBanner({
  title,
  hint,
  ctaLabel,
}: MyPetProfileTelegramBannerProps) {
  return (
    <Card className="border-amber-200/80 bg-amber-50/90 shadow-sm dark:border-amber-800/40 dark:bg-amber-950/35">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15">
            <MessageCircle className="text-primary" size={20} />
          </div>
          <div>
            <h2 className="mb-1 text-base font-semibold text-foreground">{title}</h2>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">{hint}</p>
          </div>
        </div>
        <Link
          to="/profile?tab=notifications"
          className={cn(appPrimaryCtaClass, 'inline-flex shrink-0 gap-2')}
        >
          <MessageCircle size={18} />
          {ctaLabel}
        </Link>
      </CardContent>
    </Card>
  );
}
