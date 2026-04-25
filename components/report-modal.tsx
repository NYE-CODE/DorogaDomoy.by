import { useState } from 'react';
import { Send, AlertCircle } from 'lucide-react';
import { ReportReason } from '../types/admin';
import { useI18n } from '../context/I18nContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

interface ReportModalProps {
  onClose: () => void;
  onSubmit: (reason: ReportReason, description: string) => void;
}

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
      <DialogContent className="max-w-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{t.report.title}</DialogTitle>
          <DialogDescription className="text-base">
            {t.report.intro}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              {t.report.reasonLabel} <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason | '')}
              className="mt-1 block h-11 w-full rounded-lg border border-border bg-card px-4 text-sm text-foreground shadow-sm transition-[border-color,box-shadow] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
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

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              {t.report.descLabel}
              {isDescRequired && <span className="text-red-500"> *</span>}
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.report.descPlaceholder}
              rows={5}
              maxLength={500}
              className="resize-none"
            />
            <p className="mt-1 text-xs text-muted-foreground">{t.report.descHint}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {description.length}/500 {t.common.characters}
            </p>
          </div>

          <div className="mt-6 border-t border-border pt-6">
            <div className="mb-4 flex items-start gap-3 text-sm text-muted-foreground">
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-primary" />
              <p>{t.report.warning24h}</p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                {t.common.cancel}
              </Button>
              <Button type="submit" disabled={!canSubmit || isSubmitting}>
                <Send size={18} />
                {isSubmitting ? t.report.submitting : t.report.submit}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
