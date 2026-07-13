import type { User } from '@/entities/user/model/types';
import { shouldShowPetProfileOnboarding } from '@/shared/lib/pet-profile-onboarding';
import { shouldShowShelterOrgOnboarding } from '@/shared/lib/shelter-org-onboarding';

export type PostSignupWelcomePath = '/welcome/pet-profile' | '/welcome/shelter-org';

/** Страница приветствия после регистрации (null — сразу в приложение). */
export function resolvePostSignupWelcomePath(
  user: User,
  isNewSignup: boolean,
): PostSignupWelcomePath | null {
  if (!isNewSignup) return null;
  if (user.role === 'volunteer' || user.role === 'admin') {
    return shouldShowShelterOrgOnboarding(user.id) ? '/welcome/shelter-org' : null;
  }
  return shouldShowPetProfileOnboarding(user.id) ? '/welcome/pet-profile' : null;
}
