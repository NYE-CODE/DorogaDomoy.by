import type { Pet } from '@/entities/pet/model/types';
import type { FilterState } from '../../../components/filters';

export type SearchSortMode = 'newest' | 'oldest';

export const SEARCH_LIST_PAGE_SIZE = 12;

/** Клиентская фильтрация для режима списка (и доп. отбор поверх mapPets). */
export function filterSearchPets(
  pets: Pet[],
  filters: FilterState,
  selectedCity: string,
): Pet[] {
  let active = pets.filter((p) => !p.isArchived && p.moderationStatus === 'approved');

  if (filters.animalType !== 'all') {
    active = active.filter((p) => p.animalType === filters.animalType);
  }
  if (filters.statuses.length > 0) {
    active = active.filter((p) => filters.statuses.includes(p.status));
  }
  if (filters.colors.length > 0) {
    active = active.filter((p) => p.colors.some((c) => filters.colors.includes(c)));
  }
  const breed = filters.breed.trim().toLowerCase();
  if (breed) {
    active = active.filter((p) => (p.breed ?? '').toLowerCase().includes(breed));
  }
  const q = filters.searchQuery.trim().toLowerCase();
  if (q) {
    active = active.filter((p) => {
      const haystack = [
        p.breed,
        p.description,
        p.city,
        p.distinctiveMarks?.join(' '),
        p.animalType,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }
  const city = selectedCity.trim().toLowerCase();
  if (city) {
    active = active.filter((p) => p.city.toLowerCase().includes(city));
  }
  return active;
}

export function sortSearchPets(pets: Pet[], sort: SearchSortMode): Pet[] {
  const sorted = [...pets];
  sorted.sort((a, b) => {
    const ta = new Date(a.publishedAt).getTime();
    const tb = new Date(b.publishedAt).getTime();
    return sort === 'oldest' ? ta - tb : tb - ta;
  });
  return sorted;
}
