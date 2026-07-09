/** Admin panel — `pagination` (ru / be / en). */
export const adminPanelPaginationLocales = {
  ru: {
    prev: 'Назад',
    next: 'Вперёд',
    goToPage: (n: number) => `На страницу ${n}`,
  },
  be: {
    prev: 'Назад',
    next: 'Наперад',
    goToPage: (n: number) => `На старонку ${n}`,
  },
  en: {
    prev: 'Back',
    next: 'Next',
    goToPage: (n: number) => `Go to page ${n}`,
  },
} as const;
