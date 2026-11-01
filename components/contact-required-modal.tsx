import { Phone, User, X } from 'lucide-react';
import { Link } from 'react-router';
import { useI18n } from '../context/I18nContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from './ui/dialog';
import { buildProfileContactsTo } from '@/shared/lib/profile-contacts-link';
import { cn } from '@/shared/lib/classNames';
import {
  surfaceCtaOutline,
  surfaceCtaPrimary,
  surfaceIconButton,
} from '@/shared/styles/surface-classes';
import '../landing/styles/theme-scoped.css';

interface ContactRequiredModalProps {
  open: boolean;
  returnPath?: string;
  onGoToProfile?: () => void;
  onClose?: () => void;
}

export function ContactRequiredModal({
  open,
  returnPath,
  onGoToProfile,
  onClose,
}: ContactRequiredModalProps) {
  const { t } = useI18n();

  const handleOpenChange = (next: boolean) => {
    if (!next) onClose?.();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          'landing-theme w-full max-w-md gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-card',
        )}
      >
        <div className="border-b border-border/80 bg-card px-5 pb-4 pt-5 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Phone className="size-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <DialogTitle className="typo-h2 font-display text-foreground">
                  {t.contactRequired.title}
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm text-muted-foreground">
                  {t.contactRequired.description}
                </DialogDescription>
              </div>
            </div>
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className={surfaceIconButton}
                aria-label={t.common.close}
              >
                <X className="size-5" aria-hidden />
              </button>
            ) : null}
          </div>
        </div>

        <div className="space-y-3 bg-landing px-5 py-6 sm:px-6">
          <Link
            to={buildProfileContactsTo(returnPath)}
            onClick={() => {
              onClose?.();
              onGoToProfile?.();
            }}
            className={surfaceCtaPrimary}
          >
            <User className="size-4 shrink-0" aria-hidden />
            {t.contactRequired.goToProfile}
          </Link>
          {onClose ? (
            <button type="button" onClick={onClose} className={surfaceCtaOutline}>
              {t.contactRequired.later}
            </button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
