/** My pets — list & actions (ru / be / en). */
export const myPetsListLocales = {
  ru: {
title: 'Мои питомцы',
    subtitle: 'Управляйте профилями и QR-кодами ваших питомцев',
    addPet: 'Добавить питомца',
    loadErrorTitle: 'Не удалось загрузить питомцев',
    loadErrorDesc: 'Проверьте соединение и попробуйте снова.',
    retryLoad: 'Повторить',
    emptyTitle: 'У вас пока нет питомцев',
    emptyDesc:
      'Добавьте профиль вашего питомца, чтобы получить QR-код для ошейника и быстро создавать объявления',
    addFirst: 'Добавить первого питомца',
    menuQr: 'Посмотреть QR-код',
    menuEdit: 'Редактировать',
    menuCreateAd: 'Создать объявление',
    menuDelete: 'Удалить',
    deletePetTitle: 'Удалить питомца?',
    deletePetMessage:
      'Профиль «{name}», фото и QR-код будут удалены. Восстановить данные будет нельзя.',
    deletePetConfirm: 'Удалить',
    deletePetArchiveAds:
      'У вас может быть активное объявление, связанное с этим питомцем — архивировать его тоже',
    toastPetDeleted: 'Питомец удалён',
    toastPetDeletedWithAds: 'Питомец удалён, связанные объявления архивированы',
    toastPetDeleteError: 'Не удалось удалить питомца',
    createAdPrefillError: 'Не удалось загрузить данные питомца для объявления',
    createAdPrefillForbidden: 'Объявление можно создать только из профиля своего питомца',
    cardMenuAria: 'Действия с карточкой питомца',
    stubTitle: 'Раздел в разработке',
    stubDescription:
      'Скоро здесь можно будет добавить питомца, посмотреть QR-код и редактировать профиль.',
    stubBack: 'К списку питомцев'
  },
  be: {
title: 'Мае хатнія жывёлы',
    subtitle: 'Кіруйце профілямі і QR-кодамі вашых жывёл',
    addPet: 'Дадаць жывёлу',
    loadErrorTitle: 'Не ўдалося загрузіць жывёл',
    loadErrorDesc: 'Праверце злучэнне і паспрабуйце яшчэ раз.',
    retryLoad: 'Паўтарыць',
    emptyTitle: 'У вас пакуль няма жывёл у спісе',
    emptyDesc:
      'Дадайце профіль жывёлы, каб атрымаць QR-код для аброі і хутка ствараць аб\'явы',
    addFirst: 'Дадаць першую жывёлу',
    menuQr: 'Паглядзець QR-код',
    menuEdit: 'Рэдагаваць',
    menuCreateAd: 'Стварыць аб\'яву',
    menuDelete: 'Выдаліць',
    deletePetTitle: 'Выдаліць жывёлу?',
    deletePetMessage:
      'Профіль «{name}», фота і QR-код будуць выдалены. Аднавіць даныя будзе немагчыма.',
    deletePetConfirm: 'Выдаліць',
    deletePetArchiveAds:
      'У вас можа быць актыўная аб\'ява, звязаная з гэтай жывёлай — архіваваць яе таксама',
    toastPetDeleted: 'Жывёла выдалена',
    toastPetDeletedWithAds: 'Жывёла выдалена, звязаныя аб\'явы архіваваны',
    toastPetDeleteError: 'Не ўдалося выдаліць жывёлу',
    createAdPrefillError: 'Не ўдалося загрузіць даныя жывёлы для аб\'явы',
    createAdPrefillForbidden: 'Аб\'яву можна стварыць толькі з профілю сваёй жывёлы',
    cardMenuAria: 'Дзеянні з карткай жывёлы',
    stubTitle: 'Раздзел у распрацоўцы',
    stubDescription:
      'Хутка тут можна будзе дадаць жывёлу, паглядзець QR-код і адрэдагаваць профіль.',
    stubBack: 'Да спісу жывёл'
  },
  en: {
title: 'My pets',
    subtitle: 'Manage profiles and QR codes for your pets',
    addPet: 'Add pet',
    loadErrorTitle: 'Could not load pets',
    loadErrorDesc: 'Check your connection and try again.',
    retryLoad: 'Retry',
    emptyTitle: 'You have no pets yet',
    emptyDesc:
      'Add your pet’s profile to get a collar QR code and create ads faster',
    addFirst: 'Add your first pet',
    menuQr: 'View QR code',
    menuEdit: 'Edit',
    menuCreateAd: 'Create ad',
    menuDelete: 'Delete',
    deletePetTitle: 'Delete this pet?',
    deletePetMessage:
      'The profile “{name}”, photos, and QR code will be removed. This cannot be undone.',
    deletePetConfirm: 'Delete',
    deletePetArchiveAds:
      'You may have an active listing linked to this pet — archive it as well',
    toastPetDeleted: 'Pet removed',
    toastPetDeletedWithAds: 'Pet removed; linked listings archived',
    toastPetDeleteError: 'Could not delete the pet',
    createAdPrefillError: 'Could not load pet data for the ad',
    createAdPrefillForbidden: 'You can only create an ad from your own pet profile',
    cardMenuAria: 'Pet card actions',
    stubTitle: 'Coming soon',
    stubDescription:
      'Soon you’ll be able to add a pet, view the QR code, and edit the profile here.',
    stubBack: 'Back to pet list'
  },
} as const;
