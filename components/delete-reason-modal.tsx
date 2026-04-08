import { X } from 'lucide-react';
import { useState } from 'react';
import { useI18n } from '../context/I18nContext';
import { useScrollLock } from './ui/use-scroll-lock';

interface DeleteReasonModalProps {
  onClose: () => void;
  onConfirm: (reason: string) => void;
  petDescription?: string;
}

export function DeleteReasonModal({ onClose, onConfirm, petDescription }: DeleteReasonModalProps) {
  useScrollLock(true);
  const { t } = useI18n();

  const deleteReasons = [
    { id: 'returned', label: t.deleteReason.reasons.returned },
    { id: 'adopted', label: t.deleteReason.reasons.adopted },
    { id: 'transferred', label: t.deleteReason.reasons.transferred },
    { id: 'mistake', label: t.deleteReason.reasons.mistake },
    { id: 'duplicate', label: t.deleteReason.reasons.duplicate },
    { id: 'other', label: t.deleteReason.reasons.other },
  ];
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');

  const handleConfirm = () => {
    if (!selectedReason) return;
    
    const finalReason = selectedReason === 'other' && customReason 
      ? customReason 
      : deleteReasons.find(r => r.id === selectedReason)?.label || selectedReason;
    
    onConfirm(finalReason);
  };

  const canConfirm = selectedReason && (selectedReason !== 'other' || customReason.trim().length > 0);

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[70]"
      onClick={onClose}
    >
      <div 
        className="bg-card rounded-xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t.deleteReason.title}
            </h2>
            {petDescription && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{petDescription}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent dark:hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
            {t.deleteReason.prompt}
          </p>
          
          <div className="bg-muted border border-border rounded-lg p-3 mb-4">
            <p className="text-xs text-foreground">
              <strong>{t.deleteReason.goodNews}</strong> {t.deleteReason.goodNewsHint}
            </p>
          </div>

          <div className="space-y-2">
            {deleteReasons.map((reason) => (
              <label
                key={reason.id}
                className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedReason === reason.id
                    ? 'bg-primary/10 border-primary/30'
                    : 'bg-card border-gray-200 dark:border-gray-700 hover:bg-accent dark:hover:bg-accent'
                }`}
              >
                <input
                  type="radio"
                  name="deleteReason"
                  value={reason.id}
                  checked={selectedReason === reason.id}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="mt-0.5 w-4 h-4 text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-900 dark:text-white">{reason.label}</span>
              </label>
            ))}
          </div>

          {selectedReason === 'other' && (
            <div className="mt-4">
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder={t.deleteReason.descPlaceholder}
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                autoFocus
              />
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-accent dark:hover:bg-accent rounded-lg transition-colors"
          >
            {t.common.cancel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t.deleteReason.deleteAd}
          </button>
        </div>
      </div>
    </div>
  );
}