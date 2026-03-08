import { X, AlertCircle, User } from 'lucide-react';
import { useScrollLock } from './ui/use-scroll-lock';

interface ContactRequiredModalProps {
  open: boolean;
  onClose: () => void;
  onGoToProfile: () => void;
}

export function ContactRequiredModal({ open, onClose, onGoToProfile }: ContactRequiredModalProps) {
  useScrollLock(open);
  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl transform transition-all animate-in fade-in zoom-in-95 duration-200"
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
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-amber-600" />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3 text-center">
            Добавьте контакты
          </h2>
          <p className="text-gray-600 text-center mb-6">
            Чтобы создавать объявления, необходимо указать хотя бы один способ связи в профиле. 
            Это позволит людям связаться с вами по поводу найденного питомца.
          </p>

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              onClick={onGoToProfile}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 active:scale-[0.98] transition-all font-medium"
            >
              <User className="w-4 h-4" />
              Перейти в профиль
            </button>
            
            <button
              onClick={onClose}
              className="w-full py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
            >
              Отмена
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
