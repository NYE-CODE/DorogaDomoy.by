export interface City {
  name: string;
  coordinates: [number, number];
  zoom?: number;
}

export interface Oblast {
  name: string;
  cities: City[];
}

export const DEFAULT_CITY: City = { name: 'Минск', coordinates: [53.9006, 27.5590], zoom: 11 };

export const oblasts: Oblast[] = [
  {
    name: 'Минск',
    cities: [
      { name: 'Минск', coordinates: [53.9006, 27.5590], zoom: 11 },
    ],
  },
  {
    name: 'Брестская область',
    cities: [
      { name: 'Барановичи', coordinates: [53.1327, 26.0139], zoom: 13 },
      { name: 'Берёза', coordinates: [52.5317, 24.9783], zoom: 13 },
      { name: 'Брест', coordinates: [52.0976, 23.7340], zoom: 12 },
      { name: 'Ганцевичи', coordinates: [52.7583, 26.4333], zoom: 13 },
      { name: 'Дрогичин', coordinates: [52.1833, 25.1500], zoom: 13 },
      { name: 'Жабинка', coordinates: [52.2000, 24.0167], zoom: 13 },
      { name: 'Иваново', coordinates: [52.1500, 25.5333], zoom: 13 },
      { name: 'Кобрин', coordinates: [52.2139, 24.3564], zoom: 13 },
      { name: 'Лунинец', coordinates: [52.2500, 26.8000], zoom: 13 },
      { name: 'Пинск', coordinates: [52.1115, 26.1032], zoom: 13 },
      { name: 'Столин', coordinates: [51.8833, 26.8500], zoom: 13 },
    ],
  },
  {
    name: 'Витебская область',
    cities: [
      { name: 'Витебск', coordinates: [55.1904, 30.2049], zoom: 12 },
      { name: 'Глубокое', coordinates: [55.1333, 27.6833], zoom: 13 },
      { name: 'Лепель', coordinates: [54.8833, 28.7000], zoom: 13 },
      { name: 'Новополоцк', coordinates: [55.5318, 28.6583], zoom: 13 },
      { name: 'Орша', coordinates: [54.5081, 30.4172], zoom: 13 },
      { name: 'Полоцк', coordinates: [55.4879, 28.7856], zoom: 13 },
      { name: 'Поставы', coordinates: [55.1167, 26.8333], zoom: 13 },
    ],
  },
  {
    name: 'Гомельская область',
    cities: [
      { name: 'Гомель', coordinates: [52.4345, 30.9754], zoom: 12 },
      { name: 'Добруш', coordinates: [52.4083, 31.3250], zoom: 13 },
      { name: 'Жлобин', coordinates: [52.8918, 30.0240], zoom: 13 },
      { name: 'Калинковичи', coordinates: [52.1284, 29.3270], zoom: 13 },
      { name: 'Мозырь', coordinates: [52.0488, 29.2456], zoom: 13 },
      { name: 'Петриков', coordinates: [52.1167, 28.4833], zoom: 13 },
      { name: 'Речица', coordinates: [52.3618, 30.3918], zoom: 13 },
      { name: 'Рогачёв', coordinates: [53.0889, 30.0483], zoom: 13 },
      { name: 'Светлогорск', coordinates: [52.6270, 29.7388], zoom: 13 },
    ],
  },
  {
    name: 'Гродненская область',
    cities: [
      { name: 'Берестовица', coordinates: [53.1833, 24.0167], zoom: 13 },
      { name: 'Волковыск', coordinates: [53.1567, 24.4417], zoom: 13 },
      { name: 'Вороново', coordinates: [54.1500, 25.3167], zoom: 13 },
      { name: 'Гродно', coordinates: [53.6693, 23.8131], zoom: 12 },
      { name: 'Дятлово', coordinates: [53.4667, 25.4000], zoom: 13 },
      { name: 'Ивье', coordinates: [53.9333, 25.7667], zoom: 13 },
      { name: 'Лида', coordinates: [53.8833, 25.2997], zoom: 13 },
      { name: 'Мосты', coordinates: [53.4167, 24.5333], zoom: 13 },
      { name: 'Новогрудок', coordinates: [53.5942, 25.8268], zoom: 13 },
      { name: 'Островец', coordinates: [54.6167, 25.9500], zoom: 13 },
      { name: 'Ошмяны', coordinates: [54.4167, 25.9333], zoom: 13 },
      { name: 'Свислочь', coordinates: [53.0333, 24.1000], zoom: 13 },
      { name: 'Скидель', coordinates: [53.5833, 24.2500], zoom: 13 },
      { name: 'Слоним', coordinates: [53.0868, 25.3167], zoom: 13 },
      { name: 'Сморгонь', coordinates: [54.4833, 26.4000], zoom: 13 },
      { name: 'Щучин', coordinates: [53.6000, 24.7500], zoom: 13 },
    ],
  },
  {
    name: 'Минская область',
    cities: [
      { name: 'Борисов', coordinates: [54.2279, 28.5050], zoom: 13 },
      { name: 'Вилейка', coordinates: [54.4917, 26.9167], zoom: 13 },
      { name: 'Дзержинск', coordinates: [53.6833, 27.1333], zoom: 13 },
      { name: 'Жодино', coordinates: [54.0981, 28.3392], zoom: 13 },
      { name: 'Заславль', coordinates: [53.9833, 27.2833], zoom: 13 },
      { name: 'Логойск', coordinates: [54.2000, 27.8500], zoom: 13 },
      { name: 'Марьина Горка', coordinates: [53.5100, 28.1500], zoom: 13 },
      { name: 'Молодечно', coordinates: [54.3103, 26.8535], zoom: 13 },
      { name: 'Несвиж', coordinates: [53.2167, 26.6833], zoom: 13 },
      { name: 'Слуцк', coordinates: [53.0275, 27.5597], zoom: 13 },
      { name: 'Смолевичи', coordinates: [54.0267, 28.0747], zoom: 13 },
      { name: 'Солигорск', coordinates: [52.7906, 27.5407], zoom: 13 },
      { name: 'Столбцы', coordinates: [53.4833, 26.7333], zoom: 13 },
      { name: 'Фаниполь', coordinates: [53.7500, 27.3333], zoom: 13 },
    ],
  },
  {
    name: 'Могилёвская область',
    cities: [
      { name: 'Бобруйск', coordinates: [53.1384, 29.2214], zoom: 13 },
      { name: 'Быхов', coordinates: [53.5167, 30.2500], zoom: 13 },
      { name: 'Горки', coordinates: [54.2817, 30.9833], zoom: 13 },
      { name: 'Климовичи', coordinates: [53.6083, 31.9583], zoom: 13 },
      { name: 'Кричев', coordinates: [53.7083, 31.7167], zoom: 13 },
      { name: 'Могилёв', coordinates: [53.9007, 30.3313], zoom: 12 },
      { name: 'Осиповичи', coordinates: [53.3011, 28.6356], zoom: 13 },
      { name: 'Шклов', coordinates: [54.2167, 30.2833], zoom: 13 },
    ],
  },
];

const cities: City[] = oblasts.flatMap(o => o.cities);

/** Нормализация для поиска: ё→е, trim, toLowerCase */
function normalizeForSearch(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/ё/g, 'е');
}

export function searchCities(query: string, limit: number = 50): City[] {
  const normalizedQuery = normalizeForSearch(query);
  if (!normalizedQuery) return [];
  return cities
    .filter(city => normalizeForSearch(city.name).includes(normalizedQuery))
    .slice(0, limit);
}

export function findCityByName(name: string): City | undefined {
  const n = normalizeForSearch(name);
  return cities.find(c => normalizeForSearch(c.name) === n);
}

export function findClosestCity(lat: number, lng: number): City {
  let closest = DEFAULT_CITY;
  let minDist = Infinity;
  for (const city of cities) {
    const dlat = city.coordinates[0] - lat;
    const dlng = city.coordinates[1] - lng;
    const dist = dlat * dlat + dlng * dlng;
    if (dist < minDist) {
      minDist = dist;
      closest = city;
    }
  }
  return closest;
}
