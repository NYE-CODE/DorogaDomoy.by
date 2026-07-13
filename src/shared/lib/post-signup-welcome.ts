import type { User } from '@/entities/user/model/types';
import { shouldShowPetProfileOnboarding } from '@/shared/lib/pet-profile-onboarding';
import { shouldShowShelterOrgOnboarding } from '@/shared/lib/shelter-org-onboarding';

export type PostSignupWelcomePath = '/welcome/pet-profile' | '/welcome/shelter-org';

export type SignupRoleHint = 'user' | 'volunteer';

function isVolunteerLike(user: User, signupRole?: SignupRoleHint | null): boolean {
  return (
    signupRole === 'volunteer' ||
    user.role === 'volunteer' ||
    user.role === 'admin' ||
    user.registeredAsVolunteer === true
  );
}

/** Страница приветствия после регистрации (null — сразу в приложение). */
export function resolvePostSignupWelcomePath(
  user: User,
  isNewSignup: boolean,
  signupRole?: SignupRoleHint | null,
): PostSignupWelcomePath | null {
  if (!isNewSignup) return null;
  if (isVolunteerLike(user, signupRole)) {
    return shouldShowShelterOrgOnboarding(user.id) ? '/welcome/shelter-org' : null;
  }
  return shouldShowPetProfileOnboarding(user.id) ? '/welcome/pet-profile' : null;
}
