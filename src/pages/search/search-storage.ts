export type SearchView = 'main' | 'terms';

export function readSearchView(): SearchView {
  try {
    const saved = sessionStorage.getItem('pet_finder_view');
    if (saved && ['main', 'terms'].includes(saved)) {
      return saved as SearchView;
    }
  } catch (err: unknown) {
    console.warn('[SearchPage] read pet_finder_view from sessionStorage failed', err);
  }
  return 'main';
}

export function writeSearchView(v: SearchView) {
  try {
    sessionStorage.setItem('pet_finder_view', v);
  } catch (err: unknown) {
    console.warn('[SearchPage] write pet_finder_view to sessionStorage failed', err);
  }
}

export function getSavedUserLocation(): { lat: number; lng: number; city?: string } | null {
  try {
    const saved = localStorage.getItem('pet_finder_user_location');
    if (!saved) return null;
    const data = JSON.parse(saved);
    const { lat, lng } = data;
    if (typeof lat === 'number' && typeof lng === 'number') {
      return { lat, lng, city: (data.city || '').trim() };
    }
  } catch (err: unknown) {
    console.warn('[SearchPage] getSavedLocation parse failed', err);
  }
  return null;
}

export function saveUserLocation(loc: { lat: number; lng: number }, city?: string) {
  try {
    const toSave: { lat: number; lng: number; city?: string } = { lat: loc.lat, lng: loc.lng };
    if (city) toSave.city = city;
    localStorage.setItem('pet_finder_user_location', JSON.stringify(toSave));
  } catch (err: unknown) {
    console.warn('[SearchPage] saveUserLocation storage failed', err);
  }
}

export function isCityConfirmed(): boolean {
  try {
    return localStorage.getItem('pet_finder_city_confirmed') === 'true';
  } catch (err: unknown) {
    console.warn('[SearchPage] read pet_finder_city_confirmed failed', err);
    return false;
  }
}

export const BELARUS_CENTER: [number, number] = [53.7098, 27.9534];
export const BELARUS_ZOOM = 7;

export function initialMapCenter(savedLoc: ReturnType<typeof getSavedUserLocation>, cityConfirmed: boolean): [number, number] {
  if (savedLoc) return [savedLoc.lat, savedLoc.lng];
  return cityConfirmed ? BELARUS_CENTER : [53.9006, 27.559];
}

export function initialMapZoom(savedLoc: ReturnType<typeof getSavedUserLocation>, cityConfirmed: boolean): number {
  if (savedLoc) return savedLoc.city ? 13 : BELARUS_ZOOM;
  return cityConfirmed ? BELARUS_ZOOM : 12;
}
