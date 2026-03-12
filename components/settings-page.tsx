import { ArrowLeft, Palette, Languages, Monitor } from 'lucide-react';

interface SettingsPageProps {
  onBack: () => void;
}

export function SettingsPage({ onBack }: SettingsPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Настройки</h1>
              <p className="text-sm text-gray-500">Внешний вид и язык</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Monitor className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Скоро здесь появятся настройки</h2>
            <p className="text-sm text-gray-500 max-w-md">
              Тема оформления, язык интерфейса и другие параметры. Следите за обновлениями.
            </p>
            <div className="flex gap-4 mt-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg text-sm text-gray-500">
                <Palette className="w-4 h-4" /> Темная тема
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg text-sm text-gray-500">
                <Languages className="w-4 h-4" /> Язык
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
