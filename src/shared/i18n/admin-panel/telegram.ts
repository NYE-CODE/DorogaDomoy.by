/** Admin panel — `telegram` (ru / be / en). */
export const adminPanelTelegramLocales = {
  ru: {
    title: 'Telegram: анонсы блога',
    intro:
      'Куда отправлять короткие анонсы при публикации статей в блоге. Бот должен быть администратором канала или супергруппы с правом публиковать сообщения.',
    publishTargetTitle: 'Чат для публикации',
    envVarsIntro: 'Если поля пустые, используются переменные окружения',
    envVarsConjunction: 'и',
    envVarsSuffix: '.',
    chatIdLabel: 'Chat ID или @username',
    chatIdPlaceholder: '@my_channel или -1001234567890',
    publicUsernameLabel: 'Публичный username для ссылок (без @)',
    usernamePlaceholder: 'my_channel',
    usernameHint:
      'Нужен для кнопки «Комментарии в Telegram» (ссылка вида t.me/username/msg_id). Для приватных чатов можно оставить пустым.',
    save: 'Сохранить',
  },
  be: {
    title: 'Telegram: анонсы блога',
    intro:
      'Куды адпраўляць кароткія анонсы пры публікацыі артыкулаў. Бот павінен быць адміністратарам канала або супергрупы з правам публікаваць паведамленні.',
    publishTargetTitle: 'Чат для публікацыі',
    envVarsIntro: 'Калі палі пустыя, выкарыстоўваюцца зменныя асяроджання',
    envVarsConjunction: 'і',
    envVarsSuffix: '.',
    chatIdLabel: 'Chat ID або @username',
    chatIdPlaceholder: '@my_channel або -1001234567890',
    publicUsernameLabel: 'Публічны username для спасылак (без @)',
    usernamePlaceholder: 'my_channel',
    usernameHint:
      'Патрэбна для кнопкі «Каментарыі ў Telegram» (спасылка t.me/username/msg_id). Для прыватных чатаў можна пакінуць пустым.',
    save: 'Захаваць',
  },
  en: {
    title: 'Telegram: blog announcements',
    intro:
      'Where to send short announcements when blog posts are published. The bot must be an admin of the channel or supergroup with posting rights.',
    publishTargetTitle: 'Publication target',
    envVarsIntro: 'If the fields are empty, the environment variables',
    envVarsConjunction: 'and',
    envVarsSuffix: ' are used.',
    chatIdLabel: 'Chat ID or @username',
    chatIdPlaceholder: '@my_channel or -1001234567890',
    publicUsernameLabel: 'Public username for links (no @)',
    usernamePlaceholder: 'my_channel',
    usernameHint:
      'Needed for the “Comments in Telegram” button (t.me/username/msg_id). Can be empty for private chats.',
    save: 'Save',
  },
} as const;
