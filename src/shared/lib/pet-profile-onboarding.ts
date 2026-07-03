const STORAGE_KEY_PREFIX = 'dd-pet-onboarding-dismissed';

export function hasDismissedPetProfileOnboarding(userId: string): boolean {
  try {
    return localStorage.getItem(`${STORAGE_KEY_PREFIX}:${userId}`) === '1';
  } catch {
    return false;
  }
}

export function dismissPetProfileOnboarding(userId: string): void {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}:${userId}`, '1');
  } catch {
    /* ignore quota / private mode */
  }
}

export function shouldShowPetProfileOnboarding(userId: string): boolean {
  return !hasDismissedPetProfileOnboarding(userId);
}
