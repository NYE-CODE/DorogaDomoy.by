import { Palette, Languages, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';

export function SettingsContent() {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 md:px-6 py-8 space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Palette className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">{t.settings.theme}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{theme === 'light' ? t.settings.themeLight : t.settings.themeDark}</p>
              </div>
            </div>
            <div className="flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
              <button
                onClick={() => setTheme('light')}
                className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                  theme === 'light'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                <Sun className="w-4 h-4" />
                {t.settings.themeLight}
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                  theme === 'dark'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                <Moon className="w-4 h-4" />
                {t.settings.themeDark}
              </button>
            </div>
          </div>

          <div className="h-px bg-gray-200 dark:bg-gray-700" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Languages className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">{t.settings.language}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{locale === 'ru' ? t.settings.langRu : t.settings.langBe}</p>
              </div>
            </div>
            <div className="flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
              <button
                onClick={() => setLocale('ru')}
                className={`px-4 py-2 text-sm transition-colors ${
                  locale === 'ru'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                {t.settings.langRu}
              </button>
              <button
                onClick={() => setLocale('be')}
                className={`px-4 py-2 text-sm transition-colors ${
                  locale === 'be'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                {t.settings.langBe}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
