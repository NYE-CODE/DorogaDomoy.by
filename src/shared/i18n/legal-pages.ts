import type { Locale } from './translations';
import { bePrivacyParagraphs, beTermsParagraphs } from './legal-pages-be-paragraphs';

export type LegalSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export type LegalPageContent = {
  title: string;
  back: string;
  updatedAt: string;
  sections: LegalSection[];
  contactParagraph: string;
  contactEmail: string;
};

export type LegalPagesLocale = {
  terms: LegalPageContent;
  privacy: LegalPageContent;
};

const ru: LegalPagesLocale = {
  terms: {
    title: 'Условия использования',
    back: 'Назад',
    updatedAt: 'Дата последнего обновления: 28 февраля 2026 г.',
    contactParagraph:
      'По всем вопросам, связанным с условиями использования, вы можете связаться с администрацией платформы через форму обратной связи или по адресу электронной почты:',
    contactEmail: 'contact@dorogadomoy.by',
    sections: [
      {
        title: '',
        paragraphs: [
          'Добро пожаловать в экосистему помощи животным. Используя наш сервис, вы соглашаетесь соблюдать настоящие условия использования. Пожалуйста, внимательно ознакомьтесь с ними перед регистрацией.',
        ],
      },
      {
        title: '1. Общие положения',
        paragraphs: [
          '1.1. Платформа предназначена исключительно для помощи в поиске пропавших домашних животных и воссоединения их с владельцами.',
          '1.2. Регистрируясь на платформе, вы подтверждаете, что вам исполнилось 18 лет, или вы имеете согласие родителей/опекунов на использование сервиса.',
          '1.3. Вы обязуетесь предоставлять достоверную информацию и поддерживать актуальность ваших контактных данных.',
        ],
      },
      {
        title: '2. Правила публикации объявлений',
        paragraphs: [
          '2.1. Объявления должны содержать только актуальную и достоверную информацию о пропавших или найденных животных.',
          '2.2. Запрещается публиковать объявления о продаже, покупке или передаче животных за вознаграждение.',
          '2.3. Фотографии должны быть качественными и соответствовать описанию животного. Запрещается использовать чужие фотографии или изображения из интернета.',
          '2.4. Запрещается публиковать оскорбительный, дискриминационный или неуместный контент.',
          '2.5. После нахождения животного необходимо удалить или отметить объявление как завершённое.',
        ],
      },
      {
        title: '3. Ответственность пользователей',
        paragraphs: [
          '3.1. Вы несёте полную ответственность за содержание своих объявлений и за общение с другими пользователями.',
          '3.2. Платформа не несёт ответственности за любые споры, конфликты или убытки, возникшие в результате взаимодействия между пользователями.',
          '3.3. Вы обязуетесь не использовать платформу в противозаконных целях или для причинения вреда животным.',
          '3.4. При встрече с незнакомыми людьми для передачи животного соблюдайте меры безопасности и по возможности встречайтесь в общественных местах.',
        ],
      },
      {
        title: '4. Модерация и удаление контента',
        paragraphs: [
          '4.1. Все объявления проходят модерацию перед публикацией.',
          '4.2. Администрация оставляет за собой право отклонить, удалить или отредактировать объявления, нарушающие настоящие правила, без объяснения причин.',
          '4.3. За нарушение правил пользователь может быть заблокирован временно или навсегда.',
          '4.4. Пользователи могут сообщать о нарушениях через функцию жалоб. Все жалобы рассматриваются модераторами.',
        ],
      },
      {
        title: '5. Конфиденциальность',
        paragraphs: [
          '5.1. Ваши персональные данные обрабатываются в соответствии с нашей Политикой конфиденциальности.',
          '5.2. Контактная информация (телефон, Telegram, Viber) будет видна другим пользователям в ваших объявлениях.',
          '5.3. Мы не передаём ваши данные третьим лицам без вашего согласия, за исключением случаев, предусмотренных законом.',
        ],
      },
      {
        title: '6. Ограничение ответственности',
        paragraphs: [
          '6.1. Платформа предоставляется «как есть» без каких-либо гарантий.',
          '6.2. Мы не гарантируем, что сервис будет работать без перебоев или ошибок.',
          '6.3. Мы не несём ответственности за действия пользователей, достоверность информации в объявлениях или за результаты использования платформы.',
          '6.4. Максимальная ответственность платформы ограничена суммой, уплаченной вами за использование сервиса (в настоящее время сервис бесплатен).',
        ],
      },
      {
        title: '7. Запрещённые действия',
        paragraphs: ['Запрещается:'],
        bullets: [
          'Создавать ложные объявления или распространять недостоверную информацию',
          'Использовать платформу для мошенничества или вымогательства',
          'Публиковать спам или рекламу, не связанную с поиском животных',
          'Использовать автоматизированные средства для сбора данных (парсинг, скрейпинг)',
          'Нарушать работу платформы или пытаться получить несанкционированный доступ',
          'Размещать вредоносный код или вирусы',
          'Выдавать себя за других пользователей или сотрудников платформы',
        ],
      },
      {
        title: '8. Изменение условий',
        paragraphs: [
          '8.1. Мы оставляем за собой право изменять настоящие условия использования в любое время.',
          '8.2. Об изменениях будет сообщено через уведомления на платформе или по электронной почте.',
          '8.3. Продолжая использовать платформу после внесения изменений, вы соглашаетесь с новыми условиями.',
        ],
      },
      {
        title: '9. Контакты',
        paragraphs: [],
      },
    ],
  },
  privacy: {
    title: 'Политика конфиденциальности',
    back: 'Назад',
    updatedAt: 'Дата последнего обновления: 28 февраля 2026 г.',
    contactParagraph:
      'По вопросам обработки персональных данных обращайтесь к администрации платформы:',
    contactEmail: 'contact@dorogadomoy.by',
    sections: [
      {
        title: '',
        paragraphs: [
          'Настоящая Политика конфиденциальности описывает, как DorogaDomoy.by собирает, использует и защищает персональные данные пользователей сервиса помощи животным.',
        ],
      },
      {
        title: '1. Какие данные мы обрабатываем',
        paragraphs: [
          'При регистрации и использовании сервиса мы можем обрабатывать: имя, адрес электронной почты, номер телефона, идентификаторы мессенджеров (Telegram, Viber), данные объявлений (описание, фото, местоположение), технические данные (IP-адрес, cookies, данные браузера).',
        ],
      },
      {
        title: '2. Цели обработки',
        paragraphs: [
          'Данные используются для регистрации и авторизации, публикации объявлений, связи между пользователями, модерации контента, улучшения сервиса и выполнения требований законодательства.',
        ],
      },
      {
        title: '3. Публичность контактов',
        paragraphs: [
          'Контактная информация, указанная в объявлении (телефон, Telegram, Viber), видна другим пользователям платформы. Публикуя объявление, вы соглашаетесь на такое раскрытие данных.',
        ],
      },
      {
        title: '4. Передача третьим лицам',
        paragraphs: [
          'Мы не продаём и не передаём ваши данные третьим лицам в маркетинговых целях. Передача возможна поставщикам инфраструктуры (хостинг, почта), по требованию закона или с вашего согласия.',
        ],
      },
      {
        title: '5. Хранение и безопасность',
        paragraphs: [
          'Данные хранятся на защищённых серверах. Мы применяем организационные и технические меры для защиты информации, однако не можем гарантировать абсолютную безопасность передачи данных через интернет.',
        ],
      },
      {
        title: '6. Cookies и аналитика',
        paragraphs: [
          'Сайт использует cookies для работы авторизации, настроек языка и темы. Мы используем сервисы веб-аналитики (Yandex Metrika) для понимания использования сайта. Вы можете ограничить cookies в настройках браузера.',
        ],
      },
      {
        title: '7. Ваши права',
        paragraphs: [
          'Вы можете запросить доступ к своим данным, их исправление или удаление, отозвать согласие на обработку и удалить аккаунт через настройки профиля или обратившись в поддержку.',
        ],
      },
      {
        title: '8. Изменения политики',
        paragraphs: [
          'Мы можем обновлять настоящую Политику. Актуальная версия всегда доступна на этой странице. Дата обновления указана ниже.',
        ],
      },
      {
        title: '9. Контакты',
        paragraphs: [],
      },
    ],
  },
};

const be: LegalPagesLocale = {
  terms: {
    ...ru.terms,
    title: 'Умовы выкарыстання',
    back: 'Назад',
    updatedAt: 'Дата апошняга абнаўлення: 28 лютага 2026 г.',
    contactParagraph:
      'Па ўсіх пытаннях, звязаных з умовамі выкарыстання, звяртайцеся да адміністрацыі платформы:',
    sections: ru.terms.sections.map((s, i) => ({
      ...s,
      title: s.title
        .replace('1. Общие положения', '1. Агульныя паложжы')
        .replace('2. Правила публикации объявлений', '2. Правілы публікацыі аб\'яў')
        .replace('3. Ответственность пользователей', '3. Адказнасць карыстальнікаў')
        .replace('4. Модерация и удаление контента', '4. Мадэрацыя і выдаленне кантэнту')
        .replace('5. Конфиденциальность', '5. Канфідэнцыйнасць')
        .replace('6. Ограничение ответственности', '6. Абмежаванне адказнасці')
        .replace('7. Запрещённые действия', '7. Забароненыя дзеянні')
        .replace('8. Изменение условий', '8. Змена умоў')
        .replace('9. Контакты', '9. Кантакты'),
      paragraphs: beTermsParagraphs[i] ?? s.paragraphs,
      bullets:
        i === 7
          ? [
              'Ствараць ілжывыя аб\'явы або распаўсюджваць недостоверную інфармацыю',
              'Выкарыстоўваць платформу для махлярства або вымог',
              'Публікаваць спам або рэкламу, не звязаную з пошукам жывёл',
              'Выкарыстоўваць аўтаматызаваныя сродкі для збору дадзеных',
              'Парушаць работу платформы або спрабаваць атрымаць несанкцыянаваны доступ',
              'Размяшчаць шкодны код або вірусы',
              'Выдаваць сябе за іншых карыстальнікаў або супрацоўнікаў платформы',
            ]
          : s.bullets,
    })),
  },
  privacy: {
    ...ru.privacy,
    title: 'Палітыка канфідэнцыйнасці',
    back: 'Назад',
    updatedAt: 'Дата апошняга абнаўлення: 28 лютага 2026 г.',
    contactParagraph: 'Па пытаннях апрацоўкі персанальных дадзеных звяртайцеся да адміністрацыі платформы:',
    sections: ru.privacy.sections.map((s, i) => ({
      ...s,
      title: s.title
        .replace('1. Какие данные мы обрабатываем', '1. Якія дадзеныя мы апрацоўваем')
        .replace('2. Цели обработки', '2. Мэты апрацоўкі')
        .replace('3. Публичность контактов', '3. Публічнасць кантактаў')
        .replace('4. Передача третьим лицам', '4. Перадача трэцім асобам')
        .replace('5. Хранение и безопасность', '5. Захоўванне і бяспека')
        .replace('6. Cookies и аналитика', '6. Cookies і аналітыка')
        .replace('7. Ваши права', '7. Вашы правы')
        .replace('8. Изменения политики', '8. Змены палітыкі')
        .replace('9. Контакты', '9. Кантакты'),
      paragraphs: bePrivacyParagraphs[i] ?? s.paragraphs,
    })),
  },
};

const en: LegalPagesLocale = {
  terms: {
    title: 'Terms of use',
    back: 'Back',
    updatedAt: 'Last updated: 28 February 2026',
    contactParagraph:
      'For questions about these terms of use, contact platform administration:',
    contactEmail: 'contact@dorogadomoy.by',
    sections: [
      {
        title: '',
        paragraphs: [
          'Welcome to our animal welfare ecosystem. By using our service, you agree to these terms of use. Please read them carefully before registering.',
        ],
      },
      {
        title: '1. General provisions',
        paragraphs: [
          '1.1. The platform is intended solely to help find lost pets and reunite them with owners.',
          '1.2. By registering, you confirm that you are 18 or older, or have parental/guardian consent.',
          '1.3. You agree to provide accurate information and keep your contact details up to date.',
        ],
      },
      {
        title: '2. Listing rules',
        paragraphs: [
          '2.1. Listings must contain only accurate information about lost or found animals.',
          '2.2. Listings for sale, purchase, or transfer of animals for payment are prohibited.',
          '2.3. Photos must be quality and match the description. Do not use others\' photos or images from the internet.',
          '2.4. Offensive, discriminatory, or inappropriate content is prohibited.',
          '2.5. After an animal is found, delete or mark the listing as completed.',
        ],
      },
      {
        title: '3. User responsibility',
        paragraphs: [
          '3.1. You are fully responsible for your listings and communication with other users.',
          '3.2. The platform is not liable for disputes, conflicts, or losses between users.',
          '3.3. You must not use the platform for illegal purposes or to harm animals.',
          '3.4. When meeting strangers to transfer an animal, follow safety measures and prefer public places.',
        ],
      },
      {
        title: '4. Moderation and content removal',
        paragraphs: [
          '4.1. All listings are moderated before publication.',
          '4.2. Administration may reject, remove, or edit listings that violate these rules without explanation.',
          '4.3. Violations may result in temporary or permanent account suspension.',
          '4.4. Users may report violations via the report feature. All reports are reviewed by moderators.',
        ],
      },
      {
        title: '5. Privacy',
        paragraphs: [
          '5.1. Your personal data is processed according to our Privacy Policy.',
          '5.2. Contact information (phone, Telegram, Viber) is visible to other users in your listings.',
          '5.3. We do not share your data with third parties without consent, except as required by law.',
        ],
      },
      {
        title: '6. Limitation of liability',
        paragraphs: [
          '6.1. The platform is provided "as is" without warranties.',
          '6.2. We do not guarantee uninterrupted or error-free service.',
          '6.3. We are not liable for user actions, listing accuracy, or outcomes of using the platform.',
          '6.4. Maximum platform liability is limited to fees paid by you (the service is currently free).',
        ],
      },
      {
        title: '7. Prohibited actions',
        paragraphs: ['The following is prohibited:'],
        bullets: [
          'Creating false listings or spreading misinformation',
          'Using the platform for fraud or extortion',
          'Posting spam or unrelated advertising',
          'Using automated tools to scrape data',
          'Disrupting the platform or attempting unauthorized access',
          'Posting malicious code or viruses',
          'Impersonating other users or platform staff',
        ],
      },
      {
        title: '8. Changes to terms',
        paragraphs: [
          '8.1. We may change these terms at any time.',
          '8.2. Changes will be announced via platform notifications or email.',
          '8.3. Continued use after changes means you accept the new terms.',
        ],
      },
      { title: '9. Contacts', paragraphs: [] },
    ],
  },
  privacy: {
    title: 'Privacy policy',
    back: 'Back',
    updatedAt: 'Last updated: 28 February 2026',
    contactParagraph: 'For personal data processing questions, contact platform administration:',
    contactEmail: 'contact@dorogadomoy.by',
    sections: [
      {
        title: '',
        paragraphs: [
          'This Privacy Policy describes how DorogaDomoy.by collects, uses, and protects users\' personal data.',
        ],
      },
      {
        title: '1. Data we process',
        paragraphs: [
          'When you register and use the service, we may process: name, email, phone number, messenger IDs (Telegram, Viber), listing data (description, photos, location), and technical data (IP address, cookies, browser data).',
        ],
      },
      {
        title: '2. Purposes of processing',
        paragraphs: [
          'Data is used for registration and authentication, publishing listings, user communication, content moderation, service improvement, and legal compliance.',
        ],
      },
      {
        title: '3. Public contact details',
        paragraphs: [
          'Contact information in listings (phone, Telegram, Viber) is visible to other users. By publishing a listing, you consent to this disclosure.',
        ],
      },
      {
        title: '4. Third-party sharing',
        paragraphs: [
          'We do not sell or share your data for marketing. Sharing may occur with infrastructure providers (hosting, email), when required by law, or with your consent.',
        ],
      },
      {
        title: '5. Storage and security',
        paragraphs: [
          'Data is stored on secured servers. We apply organizational and technical measures to protect information, but cannot guarantee absolute security over the internet.',
        ],
      },
      {
        title: '6. Cookies and analytics',
        paragraphs: [
          'The site uses cookies for auth, language, and theme settings. We use web analytics (Yandex Metrika) to understand site usage. You can restrict cookies in your browser settings.',
        ],
      },
      {
        title: '7. Your rights',
        paragraphs: [
          'You may request access, correction, or deletion of your data, withdraw consent, and delete your account via profile settings or by contacting support.',
        ],
      },
      {
        title: '8. Policy changes',
        paragraphs: [
          'We may update this Policy. The current version is always available on this page. The update date is shown below.',
        ],
      },
      { title: '9. Contacts', paragraphs: [] },
    ],
  },
};

export const legalPages: Record<Locale, LegalPagesLocale> = { ru, be, en };

export function getLegalPage(locale: Locale, kind: 'terms' | 'privacy'): LegalPageContent {
  return legalPages[locale][kind];
}
