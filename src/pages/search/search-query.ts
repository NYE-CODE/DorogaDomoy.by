import type { AnimalType, PetStatus } from '@/entities/pet/model/types';
import { findCityByName, type City } from '@/shared/lib/cities';

const STATUSES = new Set<PetStatus>(['searching', 'found']);
const ANIMALS = new Set<AnimalType>(['cat', 'dog', 'other']);

export interface SearchPageQuery {
  cityName: string;
  city?: City;
  statuses: PetStatus[];
  animalType: AnimalType | 'all';
}

/** Читает город, статус и вид из query страницы поиска (`?city=Минск&status=searching&animal=dog`). */
export function readSearchPageQuery(search: string): SearchPageQuery {
  const raw = search.startsWith('?') ? search.slice(1) : search;
  const params = new URLSearchParams(raw);
  const cityName = (params.get('city') ?? '').trim();
  const status = (params.get('status') ?? '').trim();
  const animal = (params.get('animal') ?? '').trim();

  return {
    cityName,
    city: cityName ? findCityByName(cityName) : undefined,
    statuses: STATUSES.has(status as PetStatus) ? [status as PetStatus] : [],
    animalType: ANIMALS.has(animal as AnimalType) ? (animal as AnimalType) : 'all',
  };
}
