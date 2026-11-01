import type { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from './ui/dialog';
import { cn } from '@/shared/lib/classNames';
import { surfaceCtaOutline, surfaceCtaPrimary } from '@/shared/styles/surface-classes';
import '../landing/styles/theme-scoped.css';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmClass?: string;
  /** Доп. контент между описанием и кнопками (чекбоксы и т.п.) */
  extra?: ReactNode;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  confirmClass,
  extra,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="landing-theme max-w-md gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-card"
        onEscapeKeyDown={handleCancel}
      >
        <div className="border-b border-border/80 bg-card px-5 py-5 sm:px-6">
          <DialogTitle className="typo-h2 font-display text-foreground">{title}</DialogTitle>
          <DialogDescription className="mt-1.5 text-sm text-muted-foreground">
            {description}
          </DialogDescription>
        </div>
        {extra ? <div className="border-b border-border/60 bg-landing px-5 py-4 sm:px-6">{extra}</div> : null}
        <div className="flex flex-col-reverse gap-3 bg-landing px-5 py-5 sm:flex-row sm:px-6">
          <button type="button" onClick={handleCancel} className={cn(surfaceCtaOutline, 'sm:flex-1')}>
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={cn(surfaceCtaPrimary, 'sm:flex-1', confirmClass)}
          >
            {confirmText}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
