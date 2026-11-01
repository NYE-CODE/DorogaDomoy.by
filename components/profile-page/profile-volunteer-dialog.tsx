import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../ui/dialog';
import { cn } from '@/shared/lib/classNames';
import { surfaceCtaOutline, surfaceCtaPrimary } from '@/shared/styles/surface-classes';
import '../../landing/styles/theme-scoped.css';

export interface ProfileVolunteerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  body: string;
  cancelLabel: string;
  confirmLabel: string;
  onConfirm: () => void;
}

export function ProfileVolunteerDialog({
  open,
  onOpenChange,
  title,
  body,
  cancelLabel,
  confirmLabel,
  onConfirm,
}: ProfileVolunteerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="landing-theme max-w-md gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-card"
      >
        <div className="border-b border-border/80 bg-card px-5 py-5 sm:px-6">
          <DialogTitle className="typo-h2 font-display text-foreground">{title}</DialogTitle>
          <DialogDescription className="mt-1.5 text-left text-sm text-muted-foreground">
            {body}
          </DialogDescription>
        </div>
        <div className="flex flex-col-reverse gap-3 bg-landing px-5 py-5 sm:flex-row sm:px-6">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className={cn(surfaceCtaOutline, 'sm:flex-1')}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            className={cn(surfaceCtaPrimary, 'sm:flex-1')}
          >
            {confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
