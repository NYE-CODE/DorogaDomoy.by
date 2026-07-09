import { emptyStoredProfilePetPhotos } from '@/shared/lib/profile-pet-photo-slots';

export interface ProfilePetFormData {
  name: string;
  species: 'dog' | 'cat' | 'other';
  breed: string;
  gender: string;
  age: string;
  colors: string[];
  specialMarks: string;
  isChipped: string;
  chipNumber: string;
  registrationAuthority: string;
  registrationTokenNumber: string;
  medicalInfo: string;
  temperament: string;
  respondsToName: string;
  favoriteTreats: string;
  favoriteWalks: string;
  photos: string[];
}

export const ADD_EDIT_PET_TOTAL_STEPS = 4;

export const emptyProfilePetForm = (): ProfilePetFormData => ({
  name: '',
  species: 'dog',
  breed: '',
  gender: 'male',
  age: '',
  colors: [],
  specialMarks: '',
  isChipped: 'no',
  chipNumber: '',
  registrationAuthority: '',
  registrationTokenNumber: '',
  medicalInfo: '',
  temperament: 'friendly',
  respondsToName: 'yes',
  favoriteTreats: '',
  favoriteWalks: '',
  photos: emptyStoredProfilePetPhotos(),
});

export type MyPetsFormT = {
  dogBreeds: readonly string[];
  catBreeds: readonly string[];
  colorOptions: readonly string[];
  [key: string]: unknown;
};

export function getProfilePetBreedOptions(species: ProfilePetFormData['species'], f: MyPetsFormT): readonly string[] {
  if (species === 'dog') return f.dogBreeds;
  if (species === 'cat') return f.catBreeds;
  return [];
}
