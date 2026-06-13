import * as React from 'react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/_primitives/dialog';
import { cn } from '@/shared/lib/classNames';
import type { ModalContentProps, ModalHeaderProps, ModalProps } from './Modal.types';
import styles from './Modal.module.css';

/** Корень модального окна (Radix Dialog). */
function Modal(props: ModalProps) {
  return <Dialog {...props} />;
}

/** Триггер открытия модалки. */
const ModalTrigger = DialogTrigger;
const ModalClose = DialogClose;
const ModalPortal = DialogPortal;

const ModalOverlay = React.forwardRef<
  React.ElementRef<typeof DialogOverlay>,
  React.ComponentPropsWithoutRef<typeof DialogOverlay>
>(({ className, style, ...props }, ref) => (
  <DialogOverlay ref={ref} className={cn(styles.overlay, className)} style={style} {...props} />
));
ModalOverlay.displayName = 'ModalOverlay';

/** Основная панель модалки. */
function ModalContent({
  className,
  style,
  showCloseButton = true,
  children,
  ...props
}: ModalContentProps) {
  return (
    <DialogContent
      className={cn(styles.content, className)}
      style={style}
      showCloseButton={showCloseButton}
      {...props}
    >
      {children}
    </DialogContent>
  );
}

/** Заголовок и описание модалки. */
function ModalHeader({ title, description, className, style }: ModalHeaderProps) {
  return (
    <DialogHeader className={className} style={style}>
      {title ? <DialogTitle>{title}</DialogTitle> : null}
      {description ? <DialogDescription>{description}</DialogDescription> : null}
    </DialogHeader>
  );
}

export {
  Modal,
  ModalTrigger,
  ModalClose,
  ModalPortal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  DialogFooter as ModalFooter,
};

export type { ModalProps, ModalContentProps, ModalHeaderProps } from './Modal.types';

// Re-export для обратной совместимости с Dialog API
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/_primitives/dialog';
