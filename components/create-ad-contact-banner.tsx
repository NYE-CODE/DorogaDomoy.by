import { AlertCircle, User } from 'lucide-react';
import { Link } from 'react-router';
import { useI18n } from '../context/I18nContext';
import { buildProfileContactsTo } from '@/shared/lib/profile-contacts-link';
import { cn } from '@/shared/lib/classNames';
import { surfaceCtaPrimary } from '@/shared/styles/surface-classes';

interface CreateAdContactBannerProps {
  /** Куда вернуть пользователя после добавления контактов в профиле. */
  returnPath?: string;
}

export function CreateAdContactBanner({ returnPath }: CreateAdContactBannerProps) {
  const { t } = useI18n();
  const b = t.createAd.contactBanner;

  return (
    <div
      role="status"
      className="mb-6 flex flex-col gap-4 rounded-2xl border border-primary/25 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
    >
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
        <div>
          <p className="text-sm font-medium text-foreground">{b.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{b.description}</p>
        </div>
      </div>
      <Link
        to={buildProfileContactsTo(returnPath)}
        className={cn(surfaceCtaPrimary, 'w-full shrink-0 sm:w-auto sm:px-6')}
      >
        <User className="size-4" aria-hidden />
        {b.action}
      </Link>
    </div>
  );
}
