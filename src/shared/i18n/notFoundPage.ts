/** notFoundPage strings (ru / be / en). */
export const notFoundPageLocales = {
  ru: {
    title: 'Страница не найдена',
    description:
      'Такой страницы нет — возможно, ссылка устарела или адрес введён с опечаткой.',
    toMain: 'К поиску объявлений',
    toLanding: 'На лендинг',
    reportPrefix: 'Если ссылка должна открываться, ',
    reportLink: 'сообщите об этом',
    reportSuffix: ' в Telegram.',
  },
  be: {
    title: 'Старонка не знойдзена',
    description:
      'Такой старонкі няма — магчыма, спасылка састарэла або адрас уведзены з памылкай.',
    toMain: 'Да пошуку аб\'яваў',
    toLanding: 'На лендынг',
    reportPrefix: 'Калі спасылка павінна адкрывацца, ',
    reportLink: 'паведамце пра гэта',
    reportSuffix: ' у Telegram.',
  },
  en: {
    title: 'Page not found',
    description: 'This page does not exist — the link may be outdated or the URL has a typo.',
    toMain: 'Browse ads',
    toLanding: 'Landing page',
    reportPrefix: 'If this link should work, ',
    reportLink: 'let us know',
    reportSuffix: ' on Telegram.',
  },
} as const;
