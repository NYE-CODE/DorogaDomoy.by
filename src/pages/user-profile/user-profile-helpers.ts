import type { User } from '@/app/providers/AuthContext';
import type { Pet } from '@/entities/pet/model/types';
import { API_BASE } from '@/shared/api/client';
import { USER_PROFILE_DEFAULT_AVATAR } from './user-profile-constants';

export function getUserProfileRoleName(role: User['role'], t: Record<string, string>): string {
  const roleNames: Record<User['role'], string> = {
    user: t.user,
    volunteer: t.volunteer,
    shelter: t.shelter,
    admin: t.admin,
  };
  return roleNames[role];
}

export function getUserProfileAdStatusTitle(
  pet: Pet,
  petForm: Record<string, string>,
): string {
  const key =
    pet.status === 'searching'
      ? pet.animalType === 'dog'
        ? 'formTitleLostDog'
        : pet.animalType === 'cat'
          ? 'formTitleLostCat'
          : 'formTitleLostOther'
      : pet.animalType === 'dog'
        ? 'formTitleFoundDog'
        : pet.animalType === 'cat'
          ? 'formTitleFoundCat'
          : 'formTitleFoundOther';
  return petForm[key] ?? key;
}

export function deriveUserProfileLocation(activePets: Pet[]): string | null {
  if (activePets.length === 0) return null;
  const cities = activePets.map((p) => p.city).filter(Boolean);
  if (cities.length === 0) return 'Беларусь';
  const counts: Record<string, number> = {};
  cities.forEach((c) => {
    counts[c] = (counts[c] || 0) + 1;
  });
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return best ? `${best[0]}, Беларусь` : 'Беларусь';
}

export function deriveUserProfileJoinDate(allPets: Pet[]): Date | null {
  if (allPets.length === 0) return null;
  const dates = allPets.map((p) => p.publishedAt.getTime());
  return new Date(Math.min(...dates));
}

export function resolveUserProfileAvatarUrl(avatar?: string | null): string {
  if (!avatar) return USER_PROFILE_DEFAULT_AVATAR;
  if (avatar.startsWith('http') || avatar.startsWith('data:')) return avatar;
  return `${API_BASE}${avatar}`;
}
