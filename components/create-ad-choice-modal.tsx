import { Search, MapPin, X } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useScrollLock } from './ui/use-scroll-lock';
import type { PetStatus } from '../types/pet';

interface CreateAdChoiceModalProps {
  onClose: () => void;
  onChoose: (status: PetStatus) => void;
}

export function CreateAdChoiceModal({ onClose, onChoose }: CreateAdChoiceModalProps) {
  const { t } = useI18n();
  useScrollLock(true);

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t.petForm.createAdChoiceTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-accent dark:hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="px-6 pb-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => onChoose('searching')}
            className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 hover:border-red-300 dark:hover:border-red-700 transition-colors text-left"
          >
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center shrink-0">
              <Search className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {t.petForm.createChoiceLost}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                {t.petForm.createChoiceLostHint}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onChoose('found')}
            className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/30 transition-colors text-left"
          >
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {t.petForm.createChoiceFound}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                {t.petForm.createChoiceFoundHint}
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
