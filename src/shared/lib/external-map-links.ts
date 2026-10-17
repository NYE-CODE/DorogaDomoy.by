export type ExternalMapApp = 'yandex' | 'google';

function formatMapCoord(value: number): string {
  return value.toFixed(6);
}

/** Opens the point in Yandex or Google Maps. Yandex `pt` is longitude,latitude. */
export function externalMapWebUrl(app: ExternalMapApp, lat: number, lng: number): string {
  const latStr = formatMapCoord(lat);
  const lngStr = formatMapCoord(lng);
  if (app === 'yandex') {
    const params = new URLSearchParams({
      pt: `${lngStr},${latStr}`,
      z: '16',
      l: 'map',
    });
    return `https://yandex.ru/maps/?${params.toString()}`;
  }
  const params = new URLSearchParams({
    api: '1',
    query: `${latStr},${lngStr}`,
  });
  return `https://www.google.com/maps/search/?${params.toString()}`;
}
