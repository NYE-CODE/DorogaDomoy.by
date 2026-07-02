import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../ui/dialog';
import { cn } from '../ui/utils';

interface AdminModalShellProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidthClass?: string;
}

/** Доступная оболочка модалок админки (Radix Dialog + focus trap). */
export function AdminModalShell({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidthClass = 'max-w-md',
}: AdminModalShellProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          'gap-0 overflow-hidden rounded-md p-0',
          maxWidthClass,
          'max-h-[90vh] flex flex-col',
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="min-w-0 pr-2">
            <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
            {description ? (
              <DialogDescription className="mt-0.5 text-sm">{description}</DialogDescription>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 hover:bg-accent"
            aria-label="Закрыть"
          >
            <X className="size-5 text-muted-foreground" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {footer ? (
          <div className="flex shrink-0 justify-end gap-2 border-t border-border px-6 py-4">
            {footer}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
