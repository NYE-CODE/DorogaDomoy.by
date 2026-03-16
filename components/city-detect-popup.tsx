import { MapPin } from 'lucide-react';
import { useScrollLock } from './ui/use-scroll-lock';
import { useI18n } from '../context/I18nContext';

interface CityDetectPopupProps {
  open: boolean;
  detectedCity: string;
  onConfirm: () => void;
  onReject: () => void;
}

export function CityDetectPopup({ open, detectedCity, onConfirm, onReject }: CityDetectPopupProps) {
  const { t } = useI18n();
  useScrollLock(open);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="relative bg-card rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-7 h-7 text-primary" />
        </div>

        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          {t.cityDetect.yourCity} {detectedCity}{t.cityDetect.question}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {t.cityDetect.showAds}
        </p>

        <div className="flex gap-3">
          <button
            onClick={onReject}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-accent dark:hover:bg-accent rounded-lg transition-colors"
          >
            {t.cityDetect.no}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
          >
            {t.cityDetect.yes}
          </button>
        </div>
      </div>
    </div>
  );
}
