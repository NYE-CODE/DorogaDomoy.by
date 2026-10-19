/** Landing — `hero` (ru / be / en). */
export const landingHeroLocales = {
  ru: {
    badge: 'Платформа для питомцев',
    title: 'Дорога домой для питомцев —',
    titleHighlight: 'по всей Беларуси',
    subtitle:
      'Смотрите объявления на карте или сообщите, если питомец потерялся или найден.',
    primaryCta: 'Открыть карту',
    secondaryCta: 'Потерял или нашёл',
    paths: {
      search: {
        title: 'Карта объявлений',
        desc: 'Смотреть пропавших и найденных рядом',
      },
      create: {
        title: 'Потерял или нашёл',
        desc: 'Опубликовать объявление за минуту',
      },
      shelter: {
        title: 'Питомцы из приютов',
        desc: 'познакомиться и забрать домой',
      },
    },
    imageSearchAlt: 'Питомец на пути домой',
    imageShelterAlt: 'Питомцы из приютов',
  },
  be: {
    badge: 'Платформа для жывёл',
    title: 'Дарога дадому для жывёл —',
    titleHighlight: 'па ўсёй Беларусі',
    subtitle:
      'Глядзіце аб\'явы на карце або паведаміце, калі жывёла згубілася ці знойдзена.',
    primaryCta: 'Адкрыць карту',
    secondaryCta: 'Згубіў або знайшоў',
    paths: {
      search: {
        title: 'Карта аб\'яў',
        desc: 'Глядзець зніклых і знойдзеных побач',
      },
      create: {
        title: 'Згубіў або знайшоў',
        desc: 'Апублікаваць аб\'яву за хвіліну',
      },
      shelter: {
        title: 'Жывёлы з прытулкаў',
        desc: 'пазнаёміцца і забраць дадому',
      },
    },
    imageSearchAlt: 'Жывёла на шляху дадому',
    imageShelterAlt: 'Жывёлы з прытулкаў',
  },
  en: {
    badge: 'Platform for pets',
    title: 'The road home for pets —',
    titleHighlight: 'across Belarus',
    subtitle:
      'Browse listings on the map, or post if a pet is lost or found.',
    primaryCta: 'Open map',
    secondaryCta: 'Lost or found',
    paths: {
      search: {
        title: 'Listings map',
        desc: 'See lost and found nearby',
      },
      create: {
        title: 'Lost or found',
        desc: 'Publish a listing in minutes',
      },
      shelter: {
        title: 'Shelter pets',
        desc: 'meet and take home',
      },
    },
    imageSearchAlt: 'A pet on the way home',
    imageShelterAlt: 'Shelter pets',
  },
} as const;
