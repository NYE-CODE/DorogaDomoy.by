import { useState } from 'react';
import { X, Send, AlertCircle } from 'lucide-react';
import { ReportReason } from '../types/admin';
import { useI18n } from '../context/I18nContext';
import { useScrollLock } from './ui/use-scroll-lock';

interface ReportModalProps {
  onClose: () => void;
  onSubmit: (reason: ReportReason, description: string) => void;
}

export function ReportModal({ onClose, onSubmit }: ReportModalProps) {
  useScrollLock(true);
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
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-2xl max-w-2xl w-full mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-black dark:text-white">{t.report.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X size={28} />
          </button>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-8">
          {t.report.intro}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t.report.reasonLabel} <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason | '')}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF9800] focus:border-[#FF9800] bg-white dark:bg-gray-800 dark:text-white"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t.report.descLabel}
              {isDescRequired && <span className="text-red-500"> *</span>}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.report.descPlaceholder}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF9800] focus:border-[#FF9800] bg-white dark:bg-gray-800 dark:text-white resize-none"
              rows={5}
              maxLength={500}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t.report.descHint}
            </p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {description.length}/500 {t.common.characters}
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-3 mb-4 text-sm text-gray-600 dark:text-gray-400">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5 text-[#FF9800]" />
              <p>{t.report.warning24h}</p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-12 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium text-lg"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 h-12 bg-[#FF9800] text-white rounded-lg hover:bg-[#F57C00] transition-colors font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={20} />
                {isSubmitting ? t.report.submitting : t.report.submit}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
