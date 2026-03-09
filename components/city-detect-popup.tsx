import { MapPin } from 'lucide-react';
import { useScrollLock } from './ui/use-scroll-lock';

interface CityDetectPopupProps {
  open: boolean;
  detectedCity: string;
  onConfirm: () => void;
  onReject: () => void;
}

export function CityDetectPopup({ open, detectedCity, onConfirm, onReject }: CityDetectPopupProps) {
  useScrollLock(open);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="relative bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-7 h-7 text-blue-600" />
        </div>

        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Ваш город — {detectedCity}?
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Мы покажем объявления из вашего города
        </p>

        <div className="flex gap-3">
          <button
            onClick={onReject}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Нет, другой
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
          >
            Да, верно
          </button>
        </div>
      </div>
    </div>
  );
}
