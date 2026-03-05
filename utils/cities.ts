// Города с координатами для центрирования карты
export interface City {
  name: string;
  coordinates: [number, number]; // [lat, lng]
  zoom?: number;
}

export const DEFAULT_CITY: City = { name: 'Минск', coordinates: [53.9006, 27.5590], zoom: 11 };

export const cities: City[] = [
  { name: 'Минск', coordinates: [53.9006, 27.5590], zoom: 11 },
  { name: 'Гомель', coordinates: [52.4345, 30.9754], zoom: 12 },
  { name: 'Могилёв', coordinates: [53.9007, 30.3313], zoom: 12 },
  { name: 'Витебск', coordinates: [55.1904, 30.2049], zoom: 12 },
  { name: 'Гродно', coordinates: [53.6693, 23.8131], zoom: 12 },
  { name: 'Брест', coordinates: [52.0976, 23.7340], zoom: 12 },
  { name: 'Бобруйск', coordinates: [53.1384, 29.2214], zoom: 13 },
  { name: 'Барановичи', coordinates: [53.1327, 26.0139], zoom: 13 },
  { name: 'Борисов', coordinates: [54.2279, 28.5050], zoom: 13 },
  { name: 'Пинск', coordinates: [52.1115, 26.1032], zoom: 13 },
  { name: 'Орша', coordinates: [54.5081, 30.4172], zoom: 13 },
  { name: 'Мозырь', coordinates: [52.0488, 29.2456], zoom: 13 },
  { name: 'Солигорск', coordinates: [52.7906, 27.5407], zoom: 13 },
  { name: 'Молодечно', coordinates: [54.3103, 26.8535], zoom: 13 },
  { name: 'Лида', coordinates: [53.8833, 25.2997], zoom: 13 },
  { name: 'Полоцк', coordinates: [55.4879, 28.7856], zoom: 13 },
  { name: 'Новополоцк', coordinates: [55.5318, 28.6583], zoom: 13 },
  { name: 'Жлобин', coordinates: [52.8918, 30.0240], zoom: 13 },
  { name: 'Светлогорск', coordinates: [52.6270, 29.7388], zoom: 13 },
  { name: 'Жодино', coordinates: [54.0981, 28.3392], zoom: 13 },
  { name: 'Речица', coordinates: [52.3618, 30.3918], zoom: 13 },
  { name: 'Слуцк', coordinates: [53.0275, 27.5597], zoom: 13 },
  { name: 'Кобрин', coordinates: [52.2139, 24.3564], zoom: 13 },
  { name: 'Слоним', coordinates: [53.0868, 25.3167], zoom: 13 },
  { name: 'Волковыск', coordinates: [53.1567, 24.4417], zoom: 13 },
  { name: 'Калинковичи', coordinates: [52.1284, 29.3270], zoom: 13 },
  { name: 'Смолевичи', coordinates: [54.0267, 28.0747], zoom: 13 },
  { name: 'Рогачёв', coordinates: [53.0889, 30.0483], zoom: 13 },
  { name: 'Осиповичи', coordinates: [53.3011, 28.6356], zoom: 13 },
  { name: 'Горки', coordinates: [54.2817, 30.9833], zoom: 13 },
  { name: 'Новогрудок', coordinates: [53.5942, 25.8268], zoom: 13 },
  { name: 'Марьина Горка', coordinates: [53.5100, 28.1500], zoom: 13 },
];

// Функция для поиска города по имени (нечувствительна к регистру)
export function findCity(cityName: string): City | undefined {
  const normalizedSearch = cityName.toLowerCase().trim();
  return cities.find(city => city.name.toLowerCase() === normalizedSearch);
}

// Функция для поиска похожих городов (для автодополнения)
export function searchCities(query: string, limit: number = 5): City[] {
  if (!query.trim()) return [];
  
  const normalizedQuery = query.toLowerCase().trim();
  
  return cities
    .filter(city => city.name.toLowerCase().includes(normalizedQuery))
    .slice(0, limit);
}
