import { sheltersApi, shelterPetsApi } from '@/shared/api/client';
import type { Pet } from '@/entities/pet/model/types';
import { adopterProfileScope, readAdopterProfile, readMatchLikedPetIdsOrdered } from './adopter-profile-storage';
import {
  defaultShelterPetFilters,
  petMatchesShelterFilters,
  sanitizeShelterPetFilters,
  type ShelterPetFilterState,
} from './shelter-pet-filters';

export type ShelterPetBrowseSource = 'catalog' | 'shelter' | 'match';

export type ShelterPetBrowseContext = {
  source: ShelterPetBrowseSource;
  shelterId?: string;
  catalogCity?: string;
  catalogAnimal?: 'all' | 'cat' | 'dog' | 'other';
  shelterFilters?: ShelterPetFilterState;
};

const FILTER_PARAM = 'sf';

export function encodeShelterFilters(filters: ShelterPetFilterState): string {
  try {
    const json = JSON.stringify(filters);
    return btoa(unescape(encodeURIComponent(json)));
  } catch {
    return '';
  }
}

export function decodeShelterFilters(raw: string | null): ShelterPetFilterState {
  if (!raw?.trim()) return defaultShelterPetFilters();
  try {
    const json = decodeURIComponent(escape(atob(raw)));
    const parsed = JSON.parse(json) as Partial<ShelterPetFilterState>;
    return sanitizeShelterPetFilters(parsed);
  } catch {
    return defaultShelterPetFilters();
  }
}

export function parseBrowseContext(searchParams: URLSearchParams): ShelterPetBrowseContext | null {
  const from = searchParams.get('from');
  if (from === 'catalog') {
    const animal = searchParams.get('petAnimal');
    const catalogAnimal =
      animal === 'cat' || animal === 'dog' || animal === 'other' ? animal : 'all';
    return {
      source: 'catalog',
      catalogCity: searchParams.get('petCity')?.trim() || '',
      catalogAnimal,
    };
  }
  if (from === 'shelter') {
    const shelterId = searchParams.get('shelterId')?.trim();
    if (!shelterId) return null;
    return {
      source: 'shelter',
      shelterId,
      shelterFilters: decodeShelterFilters(searchParams.get(FILTER_PARAM)),
    };
  }
  if (from === 'match') {
    return { source: 'match' };
  }
  return null;
}

export function browseContextToSearchParams(ctx: ShelterPetBrowseContext): URLSearchParams {
  const params = new URLSearchParams();
  if (ctx.source === 'catalog') {
    params.set('from', 'catalog');
    if (ctx.catalogCity?.trim()) params.set('petCity', ctx.catalogCity.trim());
    if (ctx.catalogAnimal && ctx.catalogAnimal !== 'all') params.set('petAnimal', ctx.catalogAnimal);
    return params;
  }
  if (ctx.source === 'match') {
    params.set('from', 'match');
    return params;
  }
  params.set('from', 'shelter');
  if (ctx.shelterId) params.set('shelterId', ctx.shelterId);
  const encoded = encodeShelterFilters(ctx.shelterFilters ?? defaultShelterPetFilters());
  if (encoded) params.set(FILTER_PARAM, encoded);
  return params;
}

export function buildShelterPetBrowseQuery(ctx: ShelterPetBrowseContext): string {
  const qs = browseContextToSearchParams(ctx).toString();
  return qs ? `?${qs}` : '';
}

export function buildShelterPetUrl(petId: string, ctx: ShelterPetBrowseContext): string {
  return `/shelter-pet/${petId}${buildShelterPetBrowseQuery(ctx)}`;
}

let catalogPetsPromise: Promise<Pet[]> | null = null;

/** Публичный каталог питомцев приютов — один HTTP-запрос, с dedupe параллельных вызовов. */
export function loadCatalogShelterPets(options?: { force?: boolean }): Promise<Pet[]> {
  if (options?.force) catalogPetsPromise = null;
  if (!catalogPetsPromise) {
    catalogPetsPromise = shelterPetsApi
      .catalog({ limit: 500 })
      .catch((err) => {
        catalogPetsPromise = null;
        throw err;
      });
  }
  return catalogPetsPromise;
}

function filterCatalogPets(pets: Pet[], ctx: ShelterPetBrowseContext): Pet[] {
  const city = ctx.catalogCity?.trim() ?? '';
  const animal = ctx.catalogAnimal ?? 'all';
  return pets.filter((p) => {
    if (city && p.city?.trim() !== city) return false;
    if (animal !== 'all' && p.animalType !== animal) return false;
    return true;
  });
}

export async function resolveShelterPetBrowseIds(
  ctx: ShelterPetBrowseContext | null,
  fallbackShelterId?: string | null,
  userId?: string | null,
): Promise<string[]> {
  if (ctx?.source === 'match') {
    const profile = readAdopterProfile(adopterProfileScope(userId));
    if (!profile) return [];
    return readMatchLikedPetIdsOrdered(profile.completedAt);
  }

  if (ctx?.source === 'catalog') {
    const pets = await loadCatalogShelterPets();
    return filterCatalogPets(pets, ctx).map((p) => p.id);
  }

  const shelterId = ctx?.source === 'shelter' ? ctx.shelterId : fallbackShelterId;
  if (!shelterId?.trim()) return [];

  const rows = await sheltersApi.listPets(shelterId.trim(), { is_archived: false, limit: 300 });
  const filters = ctx?.source === 'shelter' ? ctx.shelterFilters ?? defaultShelterPetFilters() : defaultShelterPetFilters();
  return rows.filter((p) => petMatchesShelterFilters(p, filters)).map((p) => p.id);
}

export function browseSearchFromParams(searchParams: URLSearchParams): string {
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}
