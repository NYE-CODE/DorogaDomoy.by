/**
 * Геокодирование через Nominatim (OpenStreetMap).
 * Бесплатно, без API-ключа.
 */

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';
const HEADERS: HeadersInit = {
  'Accept-Language': 'ru',
  'User-Agent': 'DorogaDomoy.by/1.0',
};

/** Областные центры Беларуси — не показываем область */
const BY_OBLAST_CENTERS = new Set(['минск', 'гомель', 'могилев', 'могилёв', 'витебск', 'гродно', 'брест']);

/** Районные центры — не показываем район; + областные центры (у них район = городской) */
const BY_DISTRICT_CITIES = new Set([
  ...BY_OBLAST_CENTERS,
  'лида', 'новогрудок', 'слоним', 'волковыск', 'сморгонь', 'береза', 'кобрин', 'пинск',
  'барановичи', 'лунинец', 'малорита', 'орша', 'полоцк', 'новополоцк', 'глубокое',
  'поставы', 'лепель', 'бобруйск', 'мозырь', 'светлогорск', 'речица', 'молодечно',
  'вилейка', 'солигорск', 'слуцк', 'несвиж', 'клецк', 'крупки'
]);

interface NominatimAddress {
  house_number?: string;
  road?: string;
  street?: string;
  suburb?: string;
  neighbourhood?: string;
  village?: string;
  town?: string;
  city?: string;
  municipality?: string;
  county?: string;
  state_district?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

function formatShortAddress(addr: NominatimAddress): string {
  const get = (k: keyof NominatimAddress) => (addr[k] || '').trim();
  const locality = get('city') || get('town') || get('village') || get('municipality') || get('suburb');
  const district = get('state_district') || get('county') || get('municipality');
  const oblast = get('state');
  const road = get('road') || get('street');
  const house = get('house_number');

  const parts: string[] = [];
  const locLower = locality.toLowerCase().replace(/\s+/g, ' ').trim();

  if (oblast && !BY_OBLAST_CENTERS.has(locLower)) {
    parts.push(oblast);
  }
  if (district && locality && !BY_DISTRICT_CITIES.has(locLower) && district !== locality) {
    parts.push(district);
  }
  if (locality) parts.push(locality);
  if (road) {
    const street = /^(улица|ул\.?)\s/i.test(road) ? road : `ул. ${road}`;
    parts.push(house ? `${street}, ${house}` : street);
  } else if (house) {
    parts.push(house);
  }

  return parts.filter(Boolean).join(', ');
}

export async function geocode(address: string): Promise<{ lat: number; lng: number; displayName: string } | null> {
  if (!address.trim()) return null;
  try {
    const res = await fetch(
      `${NOMINATIM_URL}/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
      { headers: HEADERS }
    );
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const [first] = data;
    return {
      lat: parseFloat(first.lat),
      lng: parseFloat(first.lon),
      displayName: first.display_name || address,
    };
  } catch {
    return null;
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `${NOMINATIM_URL}/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: HEADERS }
    );
    const data = await res.json();
    const addr = data?.address as NominatimAddress | undefined;
    if (addr) {
      const short = formatShortAddress(addr);
      if (short) return short;
    }
    return data?.display_name ?? null;
  } catch {
    return null;
  }
}
