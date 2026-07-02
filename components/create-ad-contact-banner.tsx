import { AlertCircle, User } from 'lucide-react';
import { Link } from 'react-router';
import { useI18n } from '../context/I18nContext';
import { Button } from './ui/button';

interface CreateAdContactBannerProps {
  onAddContacts?: () => void;
}

export function CreateAdContactBanner({ onAddContacts }: CreateAdContactBannerProps) {
  const { t } = useI18n();
  const b = t.createAd.contactBanner;

  return (
    <div
      role="status"
      className="mb-6 flex flex-col gap-3 rounded-md border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
        <div>
          <p className="text-sm font-medium text-foreground">{b.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{b.description}</p>
        </div>
      </div>
      {onAddContacts ? (
        <Button type="button" size="sm" className="shrink-0" onClick={onAddContacts}>
          <User className="size-4" />
          {b.action}
        </Button>
      ) : (
        <Button type="button" size="sm" className="shrink-0" asChild>
          <Link to="/profile">
            <User className="size-4" />
            {b.action}
          </Link>
        </Button>
      )}
    </div>
  );
}
