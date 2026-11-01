import { Check, Globe, Palette } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import type { Locale } from '../i18n/translations';
import { cn } from '@/shared/lib/classNames';
import { pageContainerNarrow } from '@/shared/styles/layout-classes';
import { surfacePanel } from '@/shared/styles/surface-classes';

const languages: { code: Locale; nameKey: 'langRu' | 'langBe' | 'langEn'; flag: string }[] = [
  { code: 'ru', nameKey: 'langRu', flag: 'RU' },
  { code: 'be', nameKey: 'langBe', flag: 'BY' },
  { code: 'en', nameKey: 'langEn', flag: 'EN' },
];

const themes = [
  {
    value: 'light' as const,
    nameKey: 'themeLight' as const,
    descKey: 'themeLightDesc' as const,
    preview: 'bg-card border-border',
    bar: 'bg-muted',
    barSoft: 'bg-landing-muted',
  },
  {
    value: 'dark' as const,
    nameKey: 'themeDark' as const,
    descKey: 'themeDarkDesc' as const,
    preview: 'bg-landing-dark border-border',
    bar: 'bg-on-landing-dark/30',
    barSoft: 'bg-on-landing-dark/15',
  },
];

const choiceRow = (active: boolean) =>
  cn(
    'flex w-full items-center justify-between rounded-xl border px-4 py-3.5 text-left transition-all',
    active
      ? 'border-primary/45 bg-primary/12 shadow-sm'
      : 'border-border bg-card hover:bg-muted/80',
  );

export function SettingsContent() {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="py-6 sm:py-8">
      <div className={cn(pageContainerNarrow, 'mx-auto px-4')}>
        <div className="mb-8 space-y-2">
          <h1 className="typo-h2 font-display text-foreground">{t.settings.appTitle}</h1>
          <p className="max-w-xl text-muted-foreground">{t.settings.appSubtitle}</p>
        </div>

        <div className="space-y-5">
          <section className={cn(surfacePanel, 'p-5 sm:p-6')}>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Globe size={20} aria-hidden />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground">
                  {t.settings.languageTitle}
                </h2>
                <p className="text-sm text-muted-foreground">{t.settings.languageHint}</p>
              </div>
            </div>

            <div className="space-y-2">
              {languages.map((language) => {
                const active = locale === language.code;
                return (
                  <button
                    key={language.code}
                    type="button"
                    onClick={() => setLocale(language.code)}
                    className={choiceRow(active)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="typo-engraved flex h-9 w-11 shrink-0 items-center justify-center rounded-md border border-medallion-border bg-medallion-soft text-medallion-foreground">
                        {language.flag}
                      </span>
                      <span
                        className={cn(
                          'text-base font-medium',
                          active ? 'text-primary' : 'text-foreground',
                        )}
                      >
                        {t.settings[language.nameKey]}
                      </span>
                    </div>
                    {active ? (
                      <span className="flex size-6 items-center justify-center rounded-full bg-primary text-landing-dark">
                        <Check size={14} aria-hidden />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>

          <section className={cn(surfacePanel, 'p-5 sm:p-6')}>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Palette size={20} aria-hidden />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground">
                  {t.settings.themeTitle}
                </h2>
                <p className="text-sm text-muted-foreground">{t.settings.themeHint}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {themes.map((themeOption) => {
                const active = theme === themeOption.value;
                return (
                  <button
                    key={themeOption.value}
                    type="button"
                    onClick={() => setTheme(themeOption.value)}
                    className={cn(choiceRow(active), 'flex-col items-stretch p-4')}
                  >
                    <div className={cn('mb-4 h-24 w-full rounded-xl border-2', themeOption.preview)}>
                      <div className="space-y-2 p-3">
                        <div className={cn('h-2 w-3/4 rounded', themeOption.bar)} />
                        <div className={cn('h-2 w-1/2 rounded', themeOption.barSoft)} />
                        <div className="mt-3 flex gap-2">
                          <div className="size-6 rounded bg-primary" />
                          <div className={cn('h-6 flex-1 rounded', themeOption.barSoft)} />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start justify-between gap-2 text-left">
                      <div>
                        <h3
                          className={cn(
                            'font-display text-base font-semibold',
                            active ? 'text-primary' : 'text-foreground',
                          )}
                        >
                          {t.settings[themeOption.nameKey]}
                        </h3>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {t.settings[themeOption.descKey]}
                        </p>
                      </div>
                      {active ? (
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-landing-dark">
                          <Check size={14} aria-hidden />
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
