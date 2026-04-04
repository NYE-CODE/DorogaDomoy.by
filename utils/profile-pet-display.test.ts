import { describe, expect, it } from 'vitest';
import { translations } from '../i18n/translations';
import { profilePetToListCard, resolveProfilePetSpecies, speciesPlainLabel } from './profile-pet-display';
import type { ProfilePetResponse } from '../api/client';

const dogBreed = translations.ru.myPets.form.dogBreeds[0]!;
const catBreed = translations.ru.myPets.form.catBreeds[0]!;

function createProfilePet(overrides: Partial<ProfilePetResponse> = {}): ProfilePetResponse {
  return {
    id: 'pet-1',
    owner_id: 'user-1',
    name: 'Барсик',
    species: 'other',
    breed: null,
    gender: 'male',
    age: null,
    colors: [],
    special_marks: null,
    is_chipped: false,
    chip_number: null,
    medical_info: null,
    temperament: null,
    responds_to_name: true,
    favorite_treats: null,
    favorite_walks: null,
    photos: [],
    created_at: '2026-04-04T00:00:00.000Z',
    updated_at: '2026-04-04T00:00:00.000Z',
    owner_name: null,
    owner_phone: null,
    owner_email: null,
    owner_city: null,
    owner_viber: null,
    ...overrides,
  };
}

describe('profile-pet-display', () => {
  it('normalizes species based on known dog breed', () => {
    expect(resolveProfilePetSpecies('cat', dogBreed)).toBe('dog');
  });

  it('normalizes species based on known cat breed', () => {
    expect(resolveProfilePetSpecies('dog', catBreed)).toBe('cat');
  });

  it('strips emoji from species label', () => {
    expect(speciesPlainLabel('dog', translations.ru.myPets.form)).toBe('Собака');
  });

  it('builds list card subtitle from normalized species and breed', () => {
    const card = profilePetToListCard(
      createProfilePet({
        species: 'other',
        breed: dogBreed,
        photos: ['/uploads/dog.jpg'],
      }),
      translations.ru.myPets.form,
    );

    expect(card.photo).toBe('/uploads/dog.jpg');
    expect(card.subtitle).toContain('Собака');
    expect(card.subtitle).toContain(dogBreed);
  });
});
