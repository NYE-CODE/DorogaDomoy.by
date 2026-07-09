/** favorites strings (ru / be / en). */
export const favoritesLocales = {
  ru: {
    title: 'Избранное',
    subtitle:
      'Сохраняйте объявления, чтобы не потерять их. Без входа список хранится только в этом браузере.',
    guestHint:
      'Войдите в аккаунт — избранное синхронизируется на сервер и будет доступно с любого устройства.',
    emptyTitle: 'Пока пусто',
    emptyDescription: 'Нажмите сердечко на карточке или на странице объявления, чтобы добавить сюда.',
    emptyTabDescription: 'В этой вкладке пока нет избранных питомцев.',
    emptySearchTab: 'Во вкладке «Из поиска» пока нет избранных.',
    emptyShelterTab: 'Во вкладке «Из приютов» пока нет избранных.',
    openSearch: 'К поиску объявлений',
    tabSearchPets: 'Из поиска',
    tabShelterPets: 'Из приютов',
    added: 'Добавлено в избранное',
    removed: 'Убрано из избранного',
    limitReached: 'Не больше 200 объявлений в избранном без аккаунта. Удалите часть или войдите.',
    countLabel: 'Сохранено: {n}',
    ariaAdd: 'Добавить в избранное',
    ariaRemove: 'Убрать из избранного',
  
  },
  be: {
    title: 'Абранае',
    subtitle:
      'Захоўвайце аб\'явы, каб не страціць. Без уваходу спіс толькі ў гэтым браўзеры.',
    guestHint:
      'Увайдзіце ў акаўнт — абранае захаваецца на серверы і будзе даступна з любой прылады.',
    emptyTitle: 'Пакуль пуста',
    emptyDescription: 'Націсніце сэрца на картцы або на старонцы аб\'явы.',
    emptyTabDescription: 'У гэтай укладцы пакуль няма абраных гадаванцаў.',
    emptySearchTab: 'Ва ўкладцы «З пошуку» пакуль няма абранага.',
    emptyShelterTab: 'Ва ўкладцы «З прытулкаў» пакуль няма абранага.',
    openSearch: 'Да пошуку аб\'яў',
    tabSearchPets: 'З пошуку',
    tabShelterPets: 'З прытулкаў',
    added: 'Дададзена ў абранае',
    removed: 'Выдалена з абранага',
    limitReached: 'Не больш за 200 без акаўнта. Выдаліце частку або ўвайдзіце.',
    countLabel: 'Захавана: {n}',
    ariaAdd: 'Дадаць у абранае',
    ariaRemove: 'Выдаліць з абранага',
  
  },
  en: {
    title: 'Favorites',
    subtitle:
      'Save ads you want to revisit. Without an account, the list is stored only in this browser.',
    guestHint:
      'Sign in to sync favorites to your account and access them on any device.',
    emptyTitle: 'Nothing saved yet',
    emptyDescription: 'Tap the heart on a card or on the pet page to add it here.',
    emptyTabDescription: 'There are no favorites in this tab yet.',
    emptySearchTab: 'No favorites in “From search” yet.',
    emptyShelterTab: 'No favorites in “From shelters” yet.',
    openSearch: 'Browse ads',
    tabSearchPets: 'From search',
    tabShelterPets: 'From shelters',
    added: 'Added to favorites',
    removed: 'Removed from favorites',
    limitReached: 'At most 200 favorites without an account. Remove some or sign in.',
    countLabel: 'Saved: {n}',
    ariaAdd: 'Add to favorites',
    ariaRemove: 'Remove from favorites',
  
  },
} as const;
