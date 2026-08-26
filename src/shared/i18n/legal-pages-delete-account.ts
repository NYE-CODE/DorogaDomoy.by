import type { LegalPageContent } from './legal-pages';

const CONTACT = 'contact@dorogadomoy.by';

export const deleteAccountRu: LegalPageContent = {
  kind: 'delete-account',
  title: 'Удаление аккаунта',
  back: 'Назад',
  updatedAt: 'Дата последнего обновления: 26 августа 2026 г.',
  contactParagraph: 'По вопросам удаления аккаунта пишите на',
  contactEmail: CONTACT,
  sections: [
    {
      title: '',
      paragraphs: [
        'На этой странице описано, как удалить аккаунт DorogaDomoy.by — в приложении, на сайте или письмом, без установки приложения и без входа. Удаление нужно, если вы больше не хотите, чтобы мы хранили ваши данные.',
        'Удаление необратимо: восстановить аккаунт и связанные с ним данные будет нельзя.',
      ],
    },
    {
      title: '1. В приложении',
      paragraphs: [
        'Если приложение DorogaDomoy установлено: откройте DorogaDomoy → Профиль → «Удалить аккаунт» → подтвердите действие.',
      ],
    },
    {
      title: '2. На сайте',
      paragraphs: [
        'Если есть доступ к аккаунту: откройте профиль → вкладка «Безопасность» → «Удалить аккаунт» → подтвердите действие. Для этого способа нужен вход.',
      ],
      links: [{ to: '/profile', label: 'https://dorogadomoy.by/profile' }],
    },
    {
      title: '3. Без приложения и без входа',
      paragraphs: [
        'Напишите на contact@dorogadomoy.by. Это основной способ, если приложения нет и войти в аккаунт нельзя.',
        'Тема письма: «Удаление аккаунта».',
        'В письме укажите: email аккаунта (обязательно); имя, если помните; Telegram username, если регистрировались через Telegram.',
      ],
      cta: {
        href: `mailto:${CONTACT}?subject=${encodeURIComponent('Удаление аккаунта')}`,
        label: 'Написать на contact@dorogadomoy.by',
      },
      mailtoForm: {
        emailLabel: 'Email аккаунта',
        emailPlaceholder: 'you@example.com',
        button: 'Открыть письмо',
        hint: 'Кнопка откроет почтовую программу на вашем устройстве. Сайт не удаляет аккаунт по этой форме и не принимает запросы на удаление без входа.',
        mailSubject: 'Удаление аккаунта',
        mailBodyTemplate:
          'Прошу удалить аккаунт на DorogaDomoy.by.\n\nEmail аккаунта: {email}\nИмя (если помню):\nTelegram username (если регистрация через Telegram):\n',
      },
    },
    {
      title: '4. Что будет удалено',
      paragraphs: ['При самоудалении в приложении или на сайте, а также после подтверждённого запроса по почте удаляются:'],
      bullets: [
        'аккаунт: email, имя, контакты, аватар и данные входа (включая привязку Telegram);',
        'объявления, автором которых вы являетесь;',
        'карточки питомцев профиля;',
        'приюты (карточки организаций), которыми вы владеете, и объявления питомцев этих приютов;',
        'избранное;',
        'баллы и история начислений;',
        'токены устройства для push-уведомлений (FCM);',
        'уведомления и их настройки;',
        'коды привязки Telegram;',
        'токены сброса пароля;',
        'жалобы, которые вы отправили;',
        'кампании сборов приютов, созданные вами.',
      ],
    },
    {
      title: '5. Что не удаляется',
      paragraphs: [
        'Публичные посты блога остаются на сайте, но без привязки к автору (поле автора обнуляется).',
        'Технические резервные копии могут храниться ограниченное время до ротации бэкапов. В рабочих базах данные стираются в срок, указанный ниже.',
        'Специальных законных удержаний персональных данных нет: мы не обещаем хранить данные «по закону» сверх технических бэкапов.',
      ],
    },
    {
      title: '6. Срок',
      paragraphs: [
        'В приложении или на сайте (способы 1 и 2) удаление выполняется сразу: сервер отвечает успехом, сессия сбрасывается.',
        'По письму без входа (способ 3) — до 30 календарных дней после письма, по которому можно идентифицировать аккаунт.',
      ],
    },
    {
      title: '7. Идентификация',
      paragraphs: [
        'Без email аккаунта или Telegram, по которому можно однозначно найти учётную запись, запрос могут отклонить — чтобы не удалить чужой аккаунт.',
      ],
    },
    {
      title: '8. Контакты',
      paragraphs: [],
      showContact: true,
      links: [
        { to: '/privacy', label: 'Политика конфиденциальности' },
        { to: '/terms', label: 'Условия использования' },
      ],
    },
  ],
};

export const deleteAccountBe: LegalPageContent = {
  kind: 'delete-account',
  title: 'Выдаленне акаўнта',
  back: 'Назад',
  updatedAt: 'Дата апошняга абнаўлення: 26 жніўня 2026 г.',
  contactParagraph: 'Па пытаннях выдалення акаўнта пішыце на',
  contactEmail: CONTACT,
  sections: [
    {
      title: '',
      paragraphs: [
        'На гэтай старонцы апісана, як выдаліць акаўнт DorogaDomoy.by — у прыкладанні, на сайце або лістом, без усталявання прыкладання і без уваходу. Выдаленне патрэбна, калі вы больш не хочаце, каб мы захоўвалі вашы даныя.',
        'Выдаленне незваротнае: аднавіць акаўнт і звязаныя з ім даныя будзе нельга.',
      ],
    },
    {
      title: '1. У прыкладанні',
      paragraphs: [
        'Калі прыкладанне DorogaDomoy усталявана: адкрыйце DorogaDomoy → Профіль → «Выдаліць акаўнт» → пацвердзіце дзеянне.',
      ],
    },
    {
      title: '2. На сайце',
      paragraphs: [
        'Калі ёсць доступ да акаўнта: адкрыйце профіль → укладка «Бяспека» → «Выдаліць акаўнт» → пацвердзіце дзеянне. Для гэтага спосабу патрэбен уваход.',
      ],
      links: [{ to: '/profile', label: 'https://dorogadomoy.by/profile' }],
    },
    {
      title: '3. Без прыкладання і без уваходу',
      paragraphs: [
        'Напішыце на contact@dorogadomoy.by. Гэта асноўны спосаб, калі прыкладання няма і ўвайсці ў акаўнт нельга.',
        'Тэма ліста: «Выдаленне акаўнта».',
        'У лісце пазначце: email акаўнта (абавязкова); імя, калі памятаеце; Telegram username, калі рэгістраваліся праз Telegram.',
      ],
      cta: {
        href: `mailto:${CONTACT}?subject=${encodeURIComponent('Выдаленне акаўнта')}`,
        label: 'Напісаць на contact@dorogadomoy.by',
      },
      mailtoForm: {
        emailLabel: 'Email акаўнта',
        emailPlaceholder: 'you@example.com',
        button: 'Адкрыць ліст',
        hint: 'Кнопка адкрые паштовую праграму на вашай прыладзе. Сайт не выдаляе акаўнт па гэтай форме і не прымае запыты на выдаленне без уваходу.',
        mailSubject: 'Выдаленне акаўнта',
        mailBodyTemplate:
          'Прашу выдаліць акаўнт на DorogaDomoy.by.\n\nEmail акаўнта: {email}\nІмя (калі памятаю):\nTelegram username (калі рэгістрацыя праз Telegram):\n',
      },
    },
    {
      title: '4. Што будзе выдалена',
      paragraphs: ['Пры самавыдаленні ў прыкладанні або на сайце, а таксама пасля пацверджанага запыту па пошце выдаляюцца:'],
      bullets: [
        'акаўнт: email, імя, кантакты, аватар і даныя ўваходу (у тым ліку прывязка Telegram);',
        'аб\'явы, аўтарам якіх вы з\'яўляецеся;',
        'карткі гадаванцаў профілю;',
        'прытулкі (карткі арганізацый), якімі вы валодаеце, і аб\'явы гадаванцаў гэтых прытулкаў;',
        'абранае;',
        'балы і гісторыя налічэнняў;',
        'токены прылады для push-апавяшчэнняў (FCM);',
        'апавяшчэнні і іх налады;',
        'коды прывязкі Telegram;',
        'токены скідвання пароля;',
        'скаргі, якія вы адправілі;',
        'кампаніі збораў прытулкаў, створаныя вамі.',
      ],
    },
    {
      title: '5. Што не выдаляецца',
      paragraphs: [
        'Публічныя пасты блога застаюцца на сайце, але без прывязкі да аўтара (поле аўтара абнуляецца).',
        'Тэхнічныя рэзервовыя копіі могуць захоўвацца абмежаваны час да ратацыі бэкапаў. У працоўных базах даныя сціраюцца ў тэрмін, указаны ніжэй.',
        'Спецыяльных законных утрыманняў персанальных даных няма: мы не абяцаем захоўваць даныя «па законе» звыш тэхнічных бэкапаў.',
      ],
    },
    {
      title: '6. Тэрмін',
      paragraphs: [
        'У прыкладанні або на сайце (спосабы 1 і 2) выдаленне выконваецца адразу: сервер адказвае поспехам, сесія скідваецца.',
        'Па лісце без уваходу (спосаб 3) — да 30 каляндарных дзён пасля ліста, па якім можна ідэнтыфікаваць акаўнт.',
      ],
    },
    {
      title: '7. Ідэнтыфікацыя',
      paragraphs: [
        'Без email акаўнта або Telegram, па якім можна адназначна знайсці ўліковы запіс, запыт могуць адхіліць — каб не выдаліць чужы акаўнт.',
      ],
    },
    {
      title: '8. Кантакты',
      paragraphs: [],
      showContact: true,
      links: [
        { to: '/privacy', label: 'Палітыка канфідэнцыйнасці' },
        { to: '/terms', label: 'Умовы выкарыстання' },
      ],
    },
  ],
};

export const deleteAccountEn: LegalPageContent = {
  kind: 'delete-account',
  title: 'Delete account',
  back: 'Back',
  updatedAt: 'Last updated: 26 August 2026',
  contactParagraph: 'For account deletion questions, write to',
  contactEmail: CONTACT,
  sections: [
    {
      title: '',
      paragraphs: [
        'This page explains how to delete a DorogaDomoy.by account — in the app, on the website, or by email, without installing the app and without signing in. Use it if you no longer want us to keep your data.',
        'Deletion is irreversible: the account and related data cannot be restored.',
      ],
    },
    {
      title: '1. In the app',
      paragraphs: [
        'If the DorogaDomoy app is installed: open DorogaDomoy → Profile → “Delete account” → confirm.',
      ],
    },
    {
      title: '2. On the website',
      paragraphs: [
        'If you can access the account: open your profile → Security tab → “Delete account” → confirm. This method requires signing in.',
      ],
      links: [{ to: '/profile', label: 'https://dorogadomoy.by/profile' }],
    },
    {
      title: '3. Without the app and without signing in',
      paragraphs: [
        'Email contact@dorogadomoy.by. This is the main method if you do not have the app and cannot sign in.',
        'Subject: “Account deletion”.',
        'Include: the account email (required); your name if you remember it; Telegram username if you registered via Telegram.',
      ],
      cta: {
        href: `mailto:${CONTACT}?subject=${encodeURIComponent('Account deletion')}`,
        label: 'Email contact@dorogadomoy.by',
      },
      mailtoForm: {
        emailLabel: 'Account email',
        emailPlaceholder: 'you@example.com',
        button: 'Open email',
        hint: 'The button opens the mail app on your device. This site does not delete an account from this form and does not accept unauthenticated deletion requests.',
        mailSubject: 'Account deletion',
        mailBodyTemplate:
          'Please delete my DorogaDomoy.by account.\n\nAccount email: {email}\nName (if I remember):\nTelegram username (if I registered via Telegram):\n',
      },
    },
    {
      title: '4. What is deleted',
      paragraphs: [
        'Self-service deletion in the app or on the website, and a confirmed email request, remove:',
      ],
      bullets: [
        'the account: email, name, contacts, avatar, and sign-in data (including Telegram linking);',
        'listings you authored;',
        'profile pet cards;',
        'shelters (organization cards) you own, and pet listings of those shelters;',
        'favorites;',
        'points and points history;',
        'device tokens for push notifications (FCM);',
        'notifications and notification settings;',
        'Telegram linking codes;',
        'password-reset tokens;',
        'reports you submitted;',
        'shelter fundraising campaigns you created.',
      ],
    },
    {
      title: '5. What is not deleted',
      paragraphs: [
        'Public blog posts stay on the site, but without an author link (the author field is cleared).',
        'Technical backups may be kept for a limited time until backup rotation. Data in live databases is erased within the timeframe below.',
        'There are no special legal retention holds: we do not keep personal data “by law” beyond technical backups.',
      ],
    },
    {
      title: '6. Timeframe',
      paragraphs: [
        'In the app or on the website (methods 1 and 2), deletion happens immediately: the server confirms success and the session is cleared.',
        'By email without signing in (method 3): within 30 calendar days after a message that lets us identify the account.',
      ],
    },
    {
      title: '7. Identification',
      paragraphs: [
        'Without the account email or a Telegram identity that uniquely matches a user, we may reject the request so we do not delete someone else’s account.',
      ],
    },
    {
      title: '8. Contacts',
      paragraphs: [],
      showContact: true,
      links: [
        { to: '/privacy', label: 'Privacy policy' },
        { to: '/terms', label: 'Terms of use' },
      ],
    },
  ],
};
