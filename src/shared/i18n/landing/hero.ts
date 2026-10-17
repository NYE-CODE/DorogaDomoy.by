/** Landing — `hero` (ru / be / en). */
export const landingHeroLocales = {
  ru: {
    badge: 'Платформа для питомцев',
    title: 'Дорога домой для питомцев —',
    titleHighlight: 'по всей Беларуси',
    subtitle:
      'Карта объявлений, быстрая публикация и питомцы из приютов — чтобы скорее найти путь домой.',
    primaryCta: 'Открыть карту',
    secondaryCta: 'Создать объявление',
    paths: {
      search: {
        title: 'Карта объявлений',
        desc: 'Искать или сообщить о питомце',
      },
      create: {
        title: 'Потерялся или нашли',
        desc: 'Опубликовать объявление за минуту',
      },
      shelter: {
        title: 'Питомцы из приютов',
        desc: 'Познакомиться и забрать домой',
      },
    },
    imageSearchAlt: 'Поиск питомцев на карте',
    imageShelterAlt: 'Питомцы из приютов',
  },
  be: {
    badge: 'Платформа для жывёл',
    title: 'Дарога дадому для жывёл —',
    titleHighlight: 'па ўсёй Беларусі',
    subtitle:
      'Карта аб\'яў, хуткая публікацыя і жывёлы з прытулкаў — каб хутчэй знайсці шлях дадому.',
    primaryCta: 'Адкрыць карту',
    secondaryCta: 'Стварыць аб\'яву',
    paths: {
      search: {
        title: 'Карта аб\'яў',
        desc: 'Шукаць або паведаміць пра жывёлу',
      },
      create: {
        title: 'Згубіўся ці знайшлі',
        desc: 'Апублікаваць аб\'яву за хвіліну',
      },
      shelter: {
        title: 'Жывёлы з прытулкаў',
        desc: 'Пазнаёміцца і забраць дадому',
      },
    },
    imageSearchAlt: 'Пошук жывёл на карце',
    imageShelterAlt: 'Жывёлы з прытулкаў',
  },
  en: {
    badge: 'Platform for pets',
    title: 'The road home for pets —',
    titleHighlight: 'across Belarus',
    subtitle:
      'A listings map, quick publishing, and shelter pets — so the way home is closer.',
    primaryCta: 'Open map',
    secondaryCta: 'Create listing',
    paths: {
      search: {
        title: 'Listings map',
        desc: 'Search or report a pet',
      },
      create: {
        title: 'Lost or found',
        desc: 'Publish a listing in minutes',
      },
      shelter: {
        title: 'Shelter pets',
        desc: 'Meet and adopt',
      },
    },
    imageSearchAlt: 'Pet search on the map',
    imageShelterAlt: 'Shelter pets',
  },
} as const;
