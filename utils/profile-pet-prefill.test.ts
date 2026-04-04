import { describe, expect, it } from 'vitest';
import type { ProfilePetResponse } from '../api/client';
import { buildPrefillFromProfilePet, profileColorsToPetColors } from './profile-pet-prefill';

const labels = {
  labelName: 'Кличка',
  labelChipNumber: 'Номер чипа',
  labelChipped: 'Чипирован',
  medicalTitle: 'Медицинская информация',
  yes: 'Да',
};

function createProfilePet(overrides: Partial<ProfilePetResponse> = {}): ProfilePetResponse {
  return {
    id: 'pet-1',
    owner_id: 'user-1',
    name: 'Барсик',
    species: 'cat',
    breed: 'Без породы',
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

describe('profile-pet-prefill', () => {
  it('maps localized colors to pet color keys without duplicates', () => {
    expect(profileColorsToPetColors(['Черный', 'black', 'Чорны', 'White', 'Черный'])).toEqual([
      'black',
      'white',
    ]);
  });

  it('normalizes numeric age to page presets', () => {
    const youngPet = buildPrefillFromProfilePet(createProfilePet({ age: '1.5' }), labels);
    const adultPet = buildPrefillFromProfilePet(createProfilePet({ age: '5 лет' }), labels);
    const unknownAge = buildPrefillFromProfilePet(createProfilePet({ age: 'щенок' }), labels);

    expect(youngPet.approximateAge).toBe('менее 2 года');
    expect(adultPet.approximateAge).toBe('более 2 года');
    expect(unknownAge.approximateAge).toBe('');
  });

  it('includes key profile details in generated description', () => {
    const prefill = buildPrefillFromProfilePet(
      createProfilePet({
        name: 'Луна',
        special_marks: 'Белое пятно на лапе',
        is_chipped: true,
        chip_number: '12345',
        medical_info: 'Нужны таблетки',
      }),
      labels,
    );

    expect(prefill.description).toContain('Кличка: Луна');
    expect(prefill.description).toContain('Белое пятно на лапе');
    expect(prefill.description).toContain('Номер чипа: 12345');
    expect(prefill.description).toContain('Медицинская информация: Нужны таблетки');
  });
});
