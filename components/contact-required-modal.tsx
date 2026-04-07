import { X, AlertCircle, User } from 'lucide-react';
import { useScrollLock } from './ui/use-scroll-lock';
import { useI18n } from '../context/I18nContext';

interface ContactRequiredModalProps {
  open: boolean;
  onClose: () => void;
  onGoToProfile: () => void;
}

export function ContactRequiredModal({ open, onClose, onGoToProfile }: ContactRequiredModalProps) {
  const { t } = useI18n();
  useScrollLock(open);
  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-card rounded-2xl w-full max-w-md overflow-hidden shadow-2xl transform transition-all animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with icon */}
        <div className="relative h-32 bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 bg-white dark:bg-card rounded-full flex items-center justify-center shadow-sm">
            <AlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 text-center">
            {t.contactRequired.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
            {t.contactRequired.description}
          </p>

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              onClick={onGoToProfile}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-lg hover:bg-primary/90 active:scale-[0.98] transition-all font-medium"
            >
              <User className="w-4 h-4" />
              {t.contactRequired.goToProfile}
            </button>
            
            <button
              onClick={onClose}
              className="w-full py-3 text-gray-700 dark:text-gray-300 hover:bg-accent dark:hover:bg-accent rounded-lg transition-colors font-medium"
            >
              {t.common.cancel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
