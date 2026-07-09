import type { ProfilePetResponse } from '@/shared/api/client';
import { getProfilePetGalleryPhotos } from '@/shared/lib/profile-pet-photo-slots';
import { resolveProfilePetSpecies, speciesPlainLabel } from '@/shared/lib/profile-pet-display';
import { dateLocaleForUi, formatPetAgeDisplay } from '@/shared/lib/profile-pet-text';
import { typoH3 } from '@/shared/styles/typography-classes';

export const MY_PET_PROFILE_FIELD_CLASS =
  'rounded-md border border-border/70 bg-muted/25 p-4 transition-colors hover:bg-muted/40';

export const MY_PET_PROFILE_SECTION_TITLE_CLASS = typoH3;

export interface MyPetProfileDisplay {
  photos: string[];
  ageDisplay: string;
  colorsLine: string;
  speciesLine: string;
  addedAt: string;
}

export function buildMyPetProfileDisplay(
  pet: ProfilePetResponse,
  locale: string,
  f: Record<string, string>,
  pp: Record<string, string>,
): MyPetProfileDisplay {
  const photos = getProfilePetGalleryPhotos(pet.photos);
  const ageDisplay = formatPetAgeDisplay(pet.age, locale, pp);
  const colorsLine = (pet.colors ?? []).filter(Boolean).join(', ') || '—';
  const resolvedSpecies = resolveProfilePetSpecies(pet.species, pet.breed);
  const speciesLine = `${speciesPlainLabel(resolvedSpecies, f)}${pet.breed ? ` · ${pet.breed}` : ''}`;
  const addedAt = pet.created_at
    ? new Date(pet.created_at).toLocaleDateString(dateLocaleForUi(locale), {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '—';

  return { photos, ageDisplay, colorsLine, speciesLine, addedAt };
}
