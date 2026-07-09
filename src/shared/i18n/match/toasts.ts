/** Match — `toasts` (ru / be / en). */
export const matchToastsLocales = {
  ru: {
    loadError: 'Не удалось загрузить питомцев',
    favoriteError: 'Не удалось добавить в избранное',
    resetPassed: 'Список пропущенных сброшен',
  },
  be: {
    loadError: 'Не ўдалося загрузіць жывёл',
    favoriteError: 'Не ўдалося дадаць у абранае',
    resetPassed: 'Спіс прапущаных скінуты',
  },
  en: {
    loadError: 'Could not load pets',
    favoriteError: 'Could not add to favorites',
    resetPassed: 'Skipped list cleared',
  },
} as const;
