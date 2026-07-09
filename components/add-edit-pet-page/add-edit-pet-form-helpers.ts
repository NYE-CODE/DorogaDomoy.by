import {
  slotsFromStoredPhotos,
  storedPhotosFromSlots,
} from '@/shared/lib/profile-pet-photo-slots';
import type { ProfilePetResponse } from '../../api/client';
import { resolveProfilePetSpecies } from '../../utils/profile-pet-display';
import { compressImageBlobForShare } from '../../utils/web-share-image';
import type { ProfilePetFormData } from './add-edit-pet-form-types';

export const MAX_PROFILE_UPLOAD_BYTES = 750 * 1024;

/** Instagram guide for pet photos (external link). */
export const PROFILE_PET_PHOTO_GUIDE_INSTAGRAM_URL =
  'https://www.instagram.com/p/DXpRblXiJwT/?img_index=1';

export class PhotoPrepareError extends Error {
  constructor(public readonly kind: 'process' | 'tooLarge') {
    super(kind);
    this.name = 'PhotoPrepareError';
  }
}

function buildCompressedPhotoName(file: File): string {
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo';
  return `${baseName}.jpg`;
}

export async function prepareProfilePhotoForUpload(file: File): Promise<File> {
  const compressed = await compressImageBlobForShare(file, {
    maxLongSide: 1200,
    maxSizeBytes: MAX_PROFILE_UPLOAD_BYTES,
  });
  if (!compressed) {
    throw new PhotoPrepareError('process');
  }
  if (compressed.size > MAX_PROFILE_UPLOAD_BYTES) {
    throw new PhotoPrepareError('tooLarge');
  }
  return new File([compressed], buildCompressedPhotoName(file), {
    type: 'image/jpeg',
  });
}

export function profilePetToForm(p: ProfilePetResponse): ProfilePetFormData {
  return {
    name: p.name,
    species: resolveProfilePetSpecies(p.species, p.breed),
    breed: p.breed ?? '',
    gender: p.gender === 'female' ? 'female' : 'male',
    age: p.age ?? '',
    colors: p.colors ?? [],
    specialMarks: p.special_marks ?? '',
    isChipped: p.is_chipped ? 'yes' : 'no',
    chipNumber: p.chip_number ?? '',
    registrationAuthority: p.registration_authority ?? '',
    registrationTokenNumber: p.registration_token_number ?? '',
    medicalInfo: p.medical_info ?? '',
    temperament: p.temperament ?? 'friendly',
    respondsToName: p.responds_to_name ? 'yes' : 'no',
    favoriteTreats: p.favorite_treats ?? '',
    favoriteWalks: p.favorite_walks ?? '',
    photos: storedPhotosFromSlots(slotsFromStoredPhotos(p.photos ?? [])),
  };
}
