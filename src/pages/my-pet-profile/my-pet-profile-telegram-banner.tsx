import { Link } from 'react-router';
import { MessageCircle } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/card';
import { cn } from '@/shared/ui/utils';
import { surfaceCtaPrimary } from '@/shared/styles/surface-classes';

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
    <Card className="overflow-hidden rounded-2xl border-primary/25 bg-primary/10 shadow-card">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15">
            <MessageCircle className="text-primary" size={20} />
          </div>
          <div>
            <h2 className="mb-1 font-display text-base font-semibold text-foreground">{title}</h2>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">{hint}</p>
          </div>
        </div>
        <Link
          to="/profile?tab=notifications"
          className={cn(surfaceCtaPrimary, 'w-full shrink-0 sm:w-auto sm:min-w-[10rem] px-6')}
        >
          <MessageCircle size={18} />
          {ctaLabel}
        </Link>
      </CardContent>
    </Card>
  );
}
