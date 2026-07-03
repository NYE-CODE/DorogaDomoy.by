import { describe, expect, it } from 'vitest';
import {
  PROFILE_PET_PHOTO_SLOT_COUNT,
  emptyStoredProfilePetPhotos,
  getProfilePetGalleryPhotos,
  getProfilePetPrimaryPhoto,
  slotsFromStoredPhotos,
  storedPhotosFromSlots,
} from './profile-pet-photo-slots';

describe('profile-pet-photo-slots', () => {
  it('stores sparse slots with fixed positions', () => {
    const stored = storedPhotosFromSlots([
      '/a.jpg',
      null,
      null,
      null,
      '/mark.jpg',
      null,
    ]);
    expect(stored).toEqual(['/a.jpg', '', '', '', '/mark.jpg', '']);
    const back = slotsFromStoredPhotos(stored);
    expect(back[0]).toBe('/a.jpg');
    expect(back[4]).toBe('/mark.jpg');
    expect(back[1]).toBeNull();
  });

  it('maps legacy compact photos sequentially', () => {
    const slots = slotsFromStoredPhotos(['/one.jpg', '/two.jpg']);
    expect(slots[0]).toBe('/one.jpg');
    expect(slots[1]).toBe('/two.jpg');
    expect(slots[2]).toBeNull();
    expect(slots).toHaveLength(PROFILE_PET_PHOTO_SLOT_COUNT);
  });

  it('gallery and primary helpers skip empty slots', () => {
    const photos = storedPhotosFromSlots(['/face.jpg', null, null, null, '/mark.jpg', null]);
    expect(getProfilePetGalleryPhotos(photos)).toEqual(['/face.jpg', '/mark.jpg']);
    expect(getProfilePetPrimaryPhoto(photos)).toBe('/face.jpg');
    expect(getProfilePetPrimaryPhoto(['', '/fallback.jpg'])).toBe('/fallback.jpg');
  });

  it('empty form photos are six empty strings', () => {
    expect(emptyStoredProfilePetPhotos()).toEqual(['', '', '', '', '', '']);
  });
});
