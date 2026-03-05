// Города с координатами для центрирования карты
export interface City {
  name: string;
  coordinates: [number, number]; // [lat, lng]
  zoom?: number;
}

export const DEFAULT_CITY: City = { name: 'Минск', coordinates: [53.9006, 27.5590], zoom: 11 };

export const cities: City[] = [
  // Беларусь (по умолчанию)
  { name: 'Минск', coordinates: [53.9006, 27.5590], zoom: 11 },
  { name: 'Гомель', coordinates: [52.4345, 30.9754], zoom: 12 },
  { name: 'Могилев', coordinates: [53.9007, 30.3313], zoom: 12 },
  { name: 'Витебск', coordinates: [55.1904, 30.2049], zoom: 12 },
  { name: 'Гродно', coordinates: [53.6693, 23.8131], zoom: 12 },
  { name: 'Брест', coordinates: [52.0976, 23.7340], zoom: 12 },

  // Украина
  { name: 'Киев', coordinates: [50.4501, 30.5234], zoom: 12 },
  { name: 'Харьков', coordinates: [49.9935, 36.2304], zoom: 12 },
  { name: 'Одесса', coordinates: [46.4825, 30.7233], zoom: 12 },
  { name: 'Днепр', coordinates: [48.4647, 35.0462], zoom: 12 },
  { name: 'Львов', coordinates: [49.8397, 24.0297], zoom: 12 },
  { name: 'Запорожье', coordinates: [47.8388, 35.1396], zoom: 12 },
  { name: 'Кривой Рог', coordinates: [47.9105, 33.3918], zoom: 12 },
  { name: 'Николаев', coordinates: [46.9659, 32.0056], zoom: 12 },
  { name: 'Мариуполь', coordinates: [47.0951, 37.5494], zoom: 12 },
  { name: 'Винница', coordinates: [49.2328, 28.4810], zoom: 12 },
  { name: 'Херсон', coordinates: [46.6354, 32.6169], zoom: 12 },
  { name: 'Полтава', coordinates: [49.5883, 34.5514], zoom: 12 },
  { name: 'Чернигов', coordinates: [51.4982, 31.2893], zoom: 12 },
  { name: 'Черкассы', coordinates: [49.4444, 32.0598], zoom: 12 },
  { name: 'Житомир', coordinates: [50.2649, 28.6587], zoom: 12 },
  { name: 'Сумы', coordinates: [50.9077, 34.7981], zoom: 12 },
  { name: 'Хмельницкий', coordinates: [49.4229, 26.9871], zoom: 12 },
  { name: 'Черновцы', coordinates: [48.2921, 25.9358], zoom: 12 },
  { name: 'Ровно', coordinates: [50.6199, 26.2516], zoom: 12 },
  { name: 'Ивано-Франковск', coordinates: [48.9226, 24.7111], zoom: 12 },
  { name: 'Тернополь', coordinates: [49.5535, 25.5948], zoom: 12 },
  { name: 'Луцк', coordinates: [50.7472, 25.3254], zoom: 12 },
  { name: 'Ужгород', coordinates: [48.6208, 22.2879], zoom: 12 },
  { name: 'Белая Церковь', coordinates: [49.8106, 30.1176], zoom: 12 },
  { name: 'Кропивницкий', coordinates: [48.5079, 32.2623], zoom: 12 },
  { name: 'Кременчуг', coordinates: [49.0661, 33.4173], zoom: 12 },
  { name: 'Бровары', coordinates: [50.5112, 30.7896], zoom: 13 },
  { name: 'Ирпень', coordinates: [50.5200, 30.2503], zoom: 13 },
  { name: 'Буча', coordinates: [50.5422, 30.2147], zoom: 13 },
  { name: 'Борисполь', coordinates: [50.3521, 30.9575], zoom: 13 },
  
  // Россия
  { name: 'Москва', coordinates: [55.7558, 37.6173], zoom: 11 },
  { name: 'Санкт-Петербург', coordinates: [59.9343, 30.3351], zoom: 11 },
  { name: 'Новосибирск', coordinates: [55.0084, 82.9357], zoom: 11 },
  { name: 'Екатеринбург', coordinates: [56.8389, 60.6057], zoom: 11 },
  { name: 'Казань', coordinates: [55.8304, 49.0661], zoom: 11 },
  { name: 'Нижний Новгород', coordinates: [56.2965, 43.9361], zoom: 11 },
  { name: 'Челябинск', coordinates: [55.1644, 61.4368], zoom: 11 },
  { name: 'Самара', coordinates: [53.1959, 50.1002], zoom: 11 },
  { name: 'Омск', coordinates: [54.9885, 73.3242], zoom: 11 },
  { name: 'Ростов-на-Дону', coordinates: [47.2357, 39.7015], zoom: 11 },
  { name: 'Уфа', coordinates: [54.7388, 55.9721], zoom: 11 },
  { name: 'Красноярск', coordinates: [56.0153, 92.8932], zoom: 11 },
  { name: 'Воронеж', coordinates: [51.6720, 39.1843], zoom: 11 },
  { name: 'Пермь', coordinates: [58.0105, 56.2502], zoom: 11 },
  { name: 'Волгоград', coordinates: [48.7080, 44.5133], zoom: 11 },
  
  // Казахстан
  { name: 'Алматы', coordinates: [43.2220, 76.8512], zoom: 11 },
  { name: 'Астана', coordinates: [51.1694, 71.4491], zoom: 11 },
  { name: 'Шымкент', coordinates: [42.3000, 69.5900], zoom: 11 },
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
