import { createContext, useContext, useEffect, useState } from 'react';
import { translations, type Locale } from '../i18n/translations';

const STORAGE_KEY = 'dorogadomoy-locale';

type Translations = (typeof translations)['ru'];

interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === 'undefined') return 'ru';
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored === 'ru' || stored === 'be' || stored === 'en') return stored;
    return 'ru';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale === 'be' ? 'be' : locale === 'en' ? 'en' : 'ru';
  }, [locale]);

  const setLocale = (l: Locale) => setLocaleState(l);
  const t = translations[locale];

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
