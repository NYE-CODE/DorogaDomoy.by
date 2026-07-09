import { DEFAULT_CITY, findCityByName } from '../../utils/cities';
import type { Pet } from '../../types/pet';
import type { PetFormData } from './pet-form-types';

export function defaultsFromSelectedCity(selectedCity: string): Pick<PetFormData, 'city' | 'location'> {
  const trimmed = selectedCity.trim();
  if (!trimmed) {
    return {
      city: DEFAULT_CITY.name,
      location: { lat: DEFAULT_CITY.coordinates[0], lng: DEFAULT_CITY.coordinates[1] },
    };
  }
  const found = findCityByName(trimmed);
  if (found) {
    return {
      city: found.name,
      location: { lat: found.coordinates[0], lng: found.coordinates[1] },
    };
  }
  return {
    city: trimmed,
    location: { lat: DEFAULT_CITY.coordinates[0], lng: DEFAULT_CITY.coordinates[1] },
  };
}

export const defaultFormData: PetFormData = {
  photos: [],
  animalType: 'cat',
  breed: '',
  colors: [],
  gender: 'unknown',
  approximateAge: '',
  approximateAgeRaw: '',
  status: 'searching',
  description: '',
  city: DEFAULT_CITY.name,
  location: { lat: DEFAULT_CITY.coordinates[0], lng: DEFAULT_CITY.coordinates[1] },
  contacts: {},
  useProfileContacts: true,
  contactName: '',
  contactPhone: '',
  agreeToPrivacy: false,
  rewardMode: 'points',
  rewardAmountByn: undefined,
  registrationAuthority: '',
  registrationTokenNumber: '',
  includeChipInDescription: false,
  pendingChipNumber: '',
};

export function formDataFromPet(pet: Pet): PetFormData {
  return {
    photos: pet.photos ?? [],
    animalType: pet.animalType,
    breed: pet.breed || '',
    colors: pet.colors ?? [],
    gender: pet.gender || 'unknown',
    approximateAge: pet.approximateAge || '',
    approximateAgeRaw: pet.approximateAgeRaw || '',
    status: pet.status,
    description: pet.description,
    city: pet.city ?? DEFAULT_CITY.name,
    location: pet.location ?? {
      lat: DEFAULT_CITY.coordinates[0],
      lng: DEFAULT_CITY.coordinates[1],
    },
    contacts: pet.contacts ?? {},
    useProfileContacts: true,
    contactName: pet.authorName ?? '',
    contactPhone: pet.contacts?.phone ?? '',
    agreeToPrivacy: true,
    rewardMode: pet.rewardMode ?? 'points',
    rewardAmountByn: pet.rewardAmountByn,
    registrationAuthority: pet.registrationAuthority ?? '',
    registrationTokenNumber: pet.registrationTokenNumber ?? '',
    includeChipInDescription: false,
    pendingChipNumber: '',
  };
}

/** Миграция номера шага: прежний порядок 1=инфо, 2=описание, 3=фото → 1=фото, 2=инфо, 3=описание */
export function migratePetFormDraftStep(step: number): number {
  if (step >= 5) return step;
  const legacyToCurrent: Record<number, number> = { 1: 2, 2: 3, 3: 1, 4: 4 };
  return legacyToCurrent[step] ?? step;
}
