import { AlertCircle, User } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';

interface ContactRequiredModalProps {
  open: boolean;
  onClose: () => void;
  onGoToProfile: () => void;
}

export function ContactRequiredModal({ open, onClose, onGoToProfile }: ContactRequiredModalProps) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md overflow-hidden rounded-2xl p-0" showCloseButton={false}>
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
              <Button onClick={onGoToProfile} className="h-11 w-full">
                <User className="size-4" />
                {t.contactRequired.goToProfile}
              </Button>
              <Button variant="ghost" onClick={onClose} className="h-11 w-full">
                {t.common.cancel}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
