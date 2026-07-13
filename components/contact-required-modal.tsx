import { AlertCircle, User } from 'lucide-react';
import { Link } from 'react-router';
import { useI18n } from '../context/I18nContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { buildProfileContactsTo } from '@/shared/lib/profile-contacts-link';

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
      <DialogContent className="max-w-md overflow-hidden rounded-lg p-0" showCloseButton={Boolean(onClose)}>
        <div className="flex flex-col">
          <div className="flex justify-center bg-primary/10 px-6 py-8">
            <div className="flex size-16 items-center justify-center rounded-full bg-background border border-primary/20">
              <AlertCircle className="size-8 text-primary" />
            </div>
          </div>
          <div className="p-6">
            <DialogHeader className="text-center sm:text-center">
              <DialogTitle className="text-xl">{t.contactRequired.title}</DialogTitle>
              <DialogDescription className="text-base">
                {t.contactRequired.description}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 space-y-3">
              <Button className="h-11 w-full" asChild>
                <Link
                  to={buildProfileContactsTo(returnPath)}
                  onClick={() => {
                    onClose?.();
                    onGoToProfile?.();
                  }}
                >
                  <User className="size-4" />
                  {t.contactRequired.goToProfile}
                </Link>
              </Button>
              {onClose ? (
                <Button type="button" variant="outline" onClick={onClose} className="h-11 w-full">
                  {t.contactRequired.later}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
