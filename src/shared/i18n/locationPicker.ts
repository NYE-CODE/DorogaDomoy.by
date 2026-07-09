/** locationPicker strings (ru / be / en). */
export const locationPickerLocales = {
  ru: {
    hint: 'Нажмите на карту, перетащите маркер или укажите текущее местоположение',
    myLocation: 'Моё местоположение',
    locating: 'Определение…',
    geoUnsupported: 'Геолокация не поддерживается вашим браузером',
    geoDenied:
      'Доступ к геолокации запрещён. Разрешите доступ в настройках браузера и обновите страницу.',
    geoUnavailable:
      'Местоположение недоступно. Убедитесь, что GPS/Wi‑Fi включены, и попробуйте снова.',
    geoTimeout: 'Превышено время ожидания. Попробуйте выбрать точку на карте вручную.',
    geoFailed: 'Не удалось определить местоположение. Выберите точку на карте вручную.',
    geoNotResponding:
      'Геолокация не отвечает. Разрешите доступ к местоположению в браузере или выберите точку на карте.',
    approximatePosition:
      'Позиция приблизительная. Перетащите маркер для точного указания улицы.',
  
  },
  be: {
    hint: 'Націсніце на карту, перацягніце маркер або пакажыце бягучае месцазнаходжанне',
    myLocation: 'Маё месцазнаходжанне',
    locating: 'Вызначэнне…',
    geoUnsupported: 'Геалакацыя не падтрымліваецца вашым браўзерам',
    geoDenied:
      'Доступ да геалакацыі забаронены. Дазвольце доступ у наладах браўзера і абнавіце старонку.',
    geoUnavailable:
      'Месцазнаходжанне недоступна. Пераканайцеся, што GPS/Wi‑Fi уключаны, і паспрабуйце зноў.',
    geoTimeout: 'Перавышаны час чакання. Паспрабуйце выбраць кропку на карце ўручную.',
    geoFailed: 'Не ўдалося вызначыць месцазнаходжанне. Выберыце кропку на карце ўручную.',
    geoNotResponding:
      'Геалакацыя не адказвае. Дазвольце доступ да месцазнаходжання ў браўзеры або выберыце кропку на карце.',
    approximatePosition:
      'Пазіцыя прыблізная. Перацягніце маркер для дакладнага паказання вуліцы.',
  
  },
  en: {
    hint: 'Click the map, drag the marker, or use your current location',
    myLocation: 'My location',
    locating: 'Locating…',
    geoUnsupported: 'Geolocation is not supported by your browser',
    geoDenied:
      'Location access denied. Allow it in browser settings and refresh the page.',
    geoUnavailable:
      'Location unavailable. Make sure GPS/Wi‑Fi is on and try again.',
    geoTimeout: 'Timed out. Try picking a point on the map manually.',
    geoFailed: 'Could not determine location. Pick a point on the map manually.',
    geoNotResponding:
      'Geolocation is not responding. Allow location access or pick a point on the map.',
    approximatePosition:
      'Location is approximate. Drag the marker to pin the exact spot.',
  
  },
} as const;
