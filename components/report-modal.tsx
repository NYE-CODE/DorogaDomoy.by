import { useState } from 'react';
import { AlertCircle, Send, X } from 'lucide-react';
import { ReportReason } from '../types/admin';
import { useI18n } from '../context/I18nContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from './ui/dialog';
import { cn } from '@/shared/lib/classNames';
import {
  surfaceCtaOutline,
  surfaceCtaPrimary,
  surfaceFieldLabel,
  surfaceIconButton,
  surfaceInput,
} from '@/shared/styles/surface-classes';
import '../landing/styles/theme-scoped.css';

interface ReportModalProps {
  onClose: () => void;
  onSubmit: (reason: ReportReason, description: string) => void;
}

const fieldInput = cn(surfaceInput, 'h-11 rounded-lg py-0 text-sm');
const fieldTextarea = cn(surfaceInput, 'min-h-[7.5rem] resize-none rounded-lg py-3 text-sm');

export function ReportModal({ onClose, onSubmit }: ReportModalProps) {
  const { t } = useI18n();
  const [reason, setReason] = useState<ReportReason | ''>('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDescRequired = reason === 'other';
  const canSubmit =
    reason !== '' &&
    (!isDescRequired || description.trim().length > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || !canSubmit) return;

    setIsSubmitting(true);
    const desc = description.trim() || t.report.reasons[reason as ReportReason];
    await onSubmit(reason as ReportReason, desc);
    setIsSubmitting(false);
  };

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="landing-theme max-w-lg gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-card sm:max-w-lg"
      >
        <div className="border-b border-border/80 bg-card px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <DialogTitle className="typo-h2 font-display text-foreground">
                {t.report.title}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-muted-foreground">
                {t.report.intro}
              </DialogDescription>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={surfaceIconButton}
              aria-label={t.common.close}
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 bg-landing px-5 py-6 sm:px-6">
          <div className="space-y-1.5">
            <label htmlFor="report-reason" className={surfaceFieldLabel}>
              {t.report.reasonLabel} <span className="text-destructive">*</span>
            </label>
            <select
              id="report-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason | '')}
              className={fieldInput}
              required
            >
              <option value="">{t.report.reasonPlaceholder}</option>
              {(Object.keys(t.report.reasons) as ReportReason[]).map((key) => (
                <option key={key} value={key}>
                  {t.report.reasons[key]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="report-desc" className={surfaceFieldLabel}>
              {t.report.descLabel}
              {isDescRequired ? <span className="text-destructive"> *</span> : null}
            </label>
            <textarea
              id="report-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.report.descPlaceholder}
              rows={5}
              maxLength={500}
              className={fieldTextarea}
            />
            <p className="text-xs text-muted-foreground">{t.report.descHint}</p>
            <p className="text-xs text-muted-foreground">
              {description.length}/500 {t.common.characters}
            </p>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-border bg-card px-3 py-3 text-sm text-muted-foreground">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden />
            <p>{t.report.warning24h}</p>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <button type="button" onClick={onClose} className={cn(surfaceCtaOutline, 'sm:flex-1')}>
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className={cn(surfaceCtaPrimary, 'sm:flex-1')}
            >
              {isSubmitting ? (
                <span
                  className="size-5 animate-spin rounded-full border-2 border-landing-dark/30 border-t-landing-dark"
                  aria-hidden
                />
              ) : (
                <>
                  <Send size={18} aria-hidden />
                  {t.report.submit}
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
