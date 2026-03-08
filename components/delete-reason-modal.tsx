import { X } from 'lucide-react';
import { useState } from 'react';
import { useScrollLock } from './ui/use-scroll-lock';

interface DeleteReasonModalProps {
  onClose: () => void;
  onConfirm: (reason: string) => void;
  petDescription?: string;
}

const deleteReasons = [
  { id: 'returned', label: 'Питомец вернулся домой / найден хозяин' },
  { id: 'adopted', label: 'Питомец пристроен в новую семью' },
  { id: 'transferred', label: 'Питомец передан в приют' },
  { id: 'mistake', label: 'Объявление создано по ошибке' },
  { id: 'duplicate', label: 'Дубликат объявления' },
  { id: 'other', label: 'Другая причина' },
];

export function DeleteReasonModal({ onClose, onConfirm, petDescription }: DeleteReasonModalProps) {
  useScrollLock(true);
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
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gray-200 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Удаление объявления
            </h2>
            {petDescription && (
              <p className="text-sm text-gray-600 mt-1">{petDescription}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-700 mb-4">
            Пожалуйста, укажите причину:
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-blue-800">
              <strong>Хорошие новости?</strong> Объявления с позитивным исходом (питомец вернулся домой, пристроен или передан в приют) будут перемещены в архив. Технические причины приведут к полному удалению.
            </p>
          </div>

          <div className="space-y-2">
            {deleteReasons.map((reason) => (
              <label
                key={reason.id}
                className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedReason === reason.id
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="deleteReason"
                  value={reason.id}
                  checked={selectedReason === reason.id}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="mt-0.5 w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-900">{reason.label}</span>
              </label>
            ))}
          </div>

          {selectedReason === 'other' && (
            <div className="mt-4">
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Опишите причину удаления..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 p-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Удалить объявление
          </button>
        </div>
      </div>
    </div>
  );
}