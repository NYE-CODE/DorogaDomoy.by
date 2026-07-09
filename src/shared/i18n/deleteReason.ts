/** deleteReason strings (ru / be / en). */
export const deleteReasonLocales = {
  ru: {
    title: 'Удаление объявления',
    prompt: 'Пожалуйста, укажите причину:',
    goodNews: 'Хорошие новости?',
    goodNewsHint: 'Объявления с позитивным исходом (питомец вернулся домой, пристроен или передан в приют) будут перемещены в архив. Технические причины приведут к полному удалению.',
    deleteAd: 'Удалить объявление',
    descPlaceholder: 'Опишите причину удаления...',
    reasons: {
      returned: 'Питомец вернулся домой / найден хозяин',
      adopted: 'Питомец пристроен в новую семью',
      transferred: 'Питомец передан в приют',
      mistake: 'Объявление создано по ошибке',
      duplicate: 'Дубликат объявления',
      other: 'Другая причина',
    },
  
  },
  be: {
    title: 'Выдаленне аб\'явы',
    prompt: 'Калі ласка, пакажыце прычыну:',
    goodNews: 'Добрыя навіны?',
    goodNewsHint: 'Аб\'явы з станоўчым зыходам (жывёла вярнулася дадому, уладкавана або перададзена ў прытулак) будуць перамешчаны ў архіў. Тэхнічныя прычыны прывядуць да поўнага выдалення.',
    deleteAd: 'Выдаліць аб\'яву',
    descPlaceholder: 'Апішыце прычыну выдалення...',
    reasons: {
      returned: 'Жывёла вярнулася дадому / знойдзены гаспадар',
      adopted: 'Жывёла ўладкавана ў новую сям\'ю',
      transferred: 'Жывёла перададзена ў прытулак',
      mistake: 'Аб\'ява створана памылкова',
      duplicate: 'Дублікат аб\'явы',
      other: 'Іншая прычына',
    },
  
  },
  en: {
    title: 'Delete ad',
    prompt: 'Please specify the reason:',
    goodNews: 'Good news?',
    goodNewsHint: 'Ads with positive outcomes (pet returned home, rehomed, or transferred to shelter) will be moved to archive. Technical reasons will lead to full deletion.',
    deleteAd: 'Delete ad',
    descPlaceholder: 'Describe the deletion reason...',
    reasons: {
      returned: 'Pet returned home / owner found',
      adopted: 'Pet rehomed to a new family',
      transferred: 'Pet transferred to shelter',
      mistake: 'Ad created by mistake',
      duplicate: 'Duplicate ad',
      other: 'Other reason',
    },
  
  },
} as const;
