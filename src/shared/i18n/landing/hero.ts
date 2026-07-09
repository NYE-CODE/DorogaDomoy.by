/** Landing — `hero` (ru / be / en). */
export const landingHeroLocales = {
  ru: {
    badge: 'Платформа для питомцев',
    title: 'Поиск, помощь и новый дом —',
    titleHighlight: 'в одном месте',
    subtitle:
      'Карта объявлений по всей Беларуси, быстрая публикация и каталог питомцев из приютов.',
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
    title: 'Пошук, дапамога і новы дом —',
    titleHighlight: 'ў адным месцы',
    subtitle:
      'Карта аб\'яў па ўсёй Беларусі, хуткая публікацыя і каталог жывёл з прытулкаў.',
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
    title: 'Search, help, and a new home —',
    titleHighlight: 'all in one place',
    subtitle:
      'Map of listings across Belarus, quick publishing, and a catalog of shelter pets.',
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
