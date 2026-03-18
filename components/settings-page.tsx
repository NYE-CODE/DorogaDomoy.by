import { Globe, Palette, Check } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useI18n } from "../context/I18nContext";
import type { Locale } from "../i18n/translations";

const languages: { code: Locale; nameKey: "langRu" | "langBe" | "langEn"; flag: string }[] = [
  { code: "ru", nameKey: "langRu", flag: "🇷🇺" },
  { code: "be", nameKey: "langBe", flag: "🇧🇾" },
  { code: "en", nameKey: "langEn", flag: "🇬🇧" },
];

const themes = [
  {
    value: "light" as const,
    nameKey: "themeLight" as const,
    descKey: "themeLightDesc" as const,
    preview: "bg-white border-gray-200",
  },
  {
    value: "dark" as const,
    nameKey: "themeDark" as const,
    descKey: "themeDarkDesc" as const,
    preview: "bg-gray-900 border-gray-700",
  },
];

export function SettingsContent() {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-muted py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">{t.settings.appTitle}</h1>
          <p className="text-muted-foreground">{t.settings.appSubtitle}</p>
        </div>

        <div className="space-y-6">
          {/* Language Settings */}
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Globe size={20} className="text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{t.settings.languageTitle}</h2>
                <p className="text-sm text-muted-foreground">{t.settings.languageHint}</p>
              </div>
            </div>

            <div className="space-y-3">
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => setLocale(language.code)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    locale === language.code
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 bg-card"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{language.flag}</span>
                    <span
                      className={`font-medium text-lg ${
                        locale === language.code ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {t.settings[language.nameKey]}
                    </span>
                  </div>
                  {locale === language.code && (
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <Check size={16} className="text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Settings */}
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#FDB913] rounded-lg flex items-center justify-center">
                <Palette size={20} className="text-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{t.settings.themeTitle}</h2>
                <p className="text-sm text-muted-foreground">{t.settings.themeHint}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {themes.map((themeOption) => (
                <button
                  key={themeOption.value}
                  onClick={() => setTheme(themeOption.value)}
                  className={`relative p-6 rounded-xl border-2 transition-all text-left ${
                    theme === themeOption.value
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 bg-card"
                  }`}
                >
                  {/* Theme Preview */}
                  <div className={`w-full h-24 rounded-lg border-2 mb-4 ${themeOption.preview}`}>
                    <div className="p-3 space-y-2">
                      <div
                        className={`h-2 w-3/4 rounded ${
                          themeOption.value === "light" ? "bg-gray-300" : "bg-gray-600"
                        }`}
                      />
                      <div
                        className={`h-2 w-1/2 rounded ${
                          themeOption.value === "light" ? "bg-gray-200" : "bg-gray-700"
                        }`}
                      />
                      <div className="flex gap-2 mt-3">
                        <div className="h-6 w-6 rounded bg-primary" />
                        <div
                          className={`h-6 flex-1 rounded ${
                            themeOption.value === "light" ? "bg-gray-200" : "bg-gray-700"
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Theme Info */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h3
                        className={`font-bold text-lg ${
                          theme === themeOption.value ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {t.settings[themeOption.nameKey]}
                      </h3>
                      {theme === themeOption.value && (
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <Check size={16} className="text-primary-foreground" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{t.settings[themeOption.descKey]}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
