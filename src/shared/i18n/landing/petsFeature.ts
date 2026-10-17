/** Landing — `petsFeature` (ru / be / en). */
export const landingPetsFeatureLocales = {
  ru: {
    title: 'Защитите питомца',
    subtitle:
      'Создайте профиль и получите бесплатный QR-код на ошейник. Если питомец потеряется — нашедший сразу свяжется с вами.',
    imageAlt: 'Собака с ошейником',
    benefitsLabel: 'Преимущества',
    stepsCount: '3 шага',
    features: [
      {
        title: 'Бесплатный QR-код',
        shortLabel: 'QR-код',
        desc: 'Код на ошейник: нашедший сканирует — и видит ваши контакты.',
      },
      {
        title: 'Объявление в один клик',
        shortLabel: 'Объявление',
        desc: 'Если питомец пропал — объявление создаётся из уже сохранённых фото и данных.',
      },
      {
        title: 'Всё в одном месте',
        shortLabel: 'Профиль',
        desc: 'Приметы, медицина и контакты — доступны с любого устройства.',
      },
    ],
    howTitle: 'Как это работает',
    steps: [
      {
        title: 'Создайте профиль',
        desc: 'Фото, кличка, порода и приметы в личном кабинете',
      },
      {
        title: 'Скачайте QR-код',
        desc: 'Распечатайте и закрепите на ошейнике',
      },
      {
        title: 'Будьте спокойны',
        desc: 'Нашедший сразу увидит ваши контакты',
      },
    ],
    ctaButton: 'Добавить питомца бесплатно',
    ctaSub: 'Профиль и QR-код — бесплатно',
  },
  be: {
    title: 'Абараніце жывёлу',
    subtitle:
      'Стварыце профіль і атрымайце бясплатны QR-код на аброю. Калі жывёла згубіцца — той, хто знойдзе, адразу звяжацца з вамі.',
    imageAlt: 'Сабака з аброяй',
    benefitsLabel: 'Перавагі',
    stepsCount: '3 крокі',
    features: [
      {
        title: 'Бясплатны QR-код',
        shortLabel: 'QR-код',
        desc: 'Код на аброю: той, хто знойдзе, скануе — і бачыць вашы кантакты.',
      },
      {
        title: 'Аб\'ява ў адзін клік',
        shortLabel: 'Аб\'ява',
        desc: 'Калі жывёла згубілася — аб\'ява ствараецца з ужо захаваных фота і даных.',
      },
      {
        title: 'Усё ў адным месцы',
        shortLabel: 'Профіль',
        desc: 'Прыкметы, медыцына і кантакты — даступныя з любой прылады.',
      },
    ],
    howTitle: 'Як гэта працуе',
    steps: [
      {
        title: 'Стварыце профіль',
        desc: 'Фота, мянушка, парода і прыкметы ў асабістым кабінеце',
      },
      {
        title: 'Спампуйце QR-код',
        desc: 'Раздрукуйце і замацуйце на аброі',
      },
      {
        title: 'Будзьце спакойныя',
        desc: 'Той, хто знойдзе, адразу ўбачыць вашы кантакты',
      },
    ],
    ctaButton: 'Дадаць жывёлу бясплатна',
    ctaSub: 'Профіль і QR-код — бясплатна',
  },
  en: {
    title: 'Protect your pet',
    subtitle:
      'Create a profile and get a free collar QR code. If your pet gets lost, the finder can reach you right away.',
    imageAlt: 'Dog with a collar',
    benefitsLabel: 'Benefits',
    stepsCount: '3 steps',
    features: [
      {
        title: 'Free QR code',
        shortLabel: 'QR code',
        desc: 'A code on the collar: the finder scans it and sees your contacts.',
      },
      {
        title: 'One-click lost ad',
        shortLabel: 'Lost ad',
        desc: 'If your pet goes missing, the ad is built from saved photos and details.',
      },
      {
        title: 'All in one place',
        shortLabel: 'Profile',
        desc: 'Marks, medical notes, and contacts — available on any device.',
      },
    ],
    howTitle: 'How it works',
    steps: [
      {
        title: 'Create a profile',
        desc: 'Photo, name, breed, and marks in your account',
      },
      {
        title: 'Download the QR code',
        desc: 'Print it and attach it to the collar',
      },
      {
        title: 'Stay calm',
        desc: 'The finder sees your contacts right away',
      },
    ],
    ctaButton: 'Add a pet for free',
    ctaSub: 'Profile and QR code — free',
  },
} as const;
