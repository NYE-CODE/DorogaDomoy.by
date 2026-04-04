import { translations } from '../i18n/translations';
import type { ProfilePetResponse } from '../api/client';

type Form = (typeof translations)['ru']['myPets']['form'];

export type ProfileSpecies = 'dog' | 'cat' | 'other';

const ALL_DOG_BREEDS = new Set([
  ...translations.ru.myPets.form.dogBreeds,
  ...translations.be.myPets.form.dogBreeds,
  ...translations.en.myPets.form.dogBreeds,
]);

const ALL_CAT_BREEDS = new Set([
  ...translations.ru.myPets.form.catBreeds,
  ...translations.be.myPets.form.catBreeds,
  ...translations.en.myPets.form.catBreeds,
]);

/**
 * Синхронизирует вид (dog/cat/other) с породой, если в БД записались противоречивые данные
 * (например species=cat при породе из списка собак).
 */
export function resolveProfilePetSpecies(
  speciesRaw: string | undefined | null,
  breed: string | null | undefined,
): ProfileSpecies {
  const s = (speciesRaw ?? '').trim().toLowerCase();
  const species: ProfileSpecies =
    s === 'dog' ? 'dog' : s === 'cat' ? 'cat' : s === 'other' ? 'other' : 'other';

  const b = (breed ?? '').trim();
  if (!b) return species;

  const inDog = ALL_DOG_BREEDS.has(b);
  const inCat = ALL_CAT_BREEDS.has(b);

  if (inDog && !inCat) return 'dog';
  if (inCat && !inDog) return 'cat';
  return species;
}

/** Текст вида без эмодзи (под заголовком карточки) */
export function speciesPlainLabel(species: ProfileSpecies, f: Form): string {
  const raw = species === 'cat' ? f.speciesCat : species === 'dog' ? f.speciesDog : f.speciesOther;
  const parts = raw.split(/\s+/);
  return parts.length > 1 ? parts.slice(1).join(' ') : raw;
}

/** Полная подпись вида с эмодзи (публичная страница) */
export function speciesFullLabel(species: ProfileSpecies, f: Form): string {
  if (species === 'cat') return f.speciesCat;
  if (species === 'dog') return f.speciesDog;
  return f.speciesOther;
}

export type ProfilePetListCard = {
  id: string;
  name: string;
  photo: string;
  subtitle: string;
};

export function profilePetToListCard(pet: ProfilePetResponse, form: Form): ProfilePetListCard {
  const species = speciesPlainLabel(resolveProfilePetSpecies(pet.species, pet.breed), form);
  return {
    id: pet.id,
    name: pet.name,
    photo: pet.photos?.[0] ?? '',
    subtitle: [species, pet.breed].filter(Boolean).join(', '),
  };
}
