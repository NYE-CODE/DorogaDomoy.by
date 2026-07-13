const STORAGE_KEY_PREFIX = 'dd-shelter-org-onboarding-dismissed';

export function hasDismissedShelterOrgOnboarding(userId: string): boolean {
  try {
    return localStorage.getItem(`${STORAGE_KEY_PREFIX}:${userId}`) === '1';
  } catch {
    return false;
  }
}

export function dismissShelterOrgOnboarding(userId: string): void {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}:${userId}`, '1');
  } catch {
    /* ignore quota / private mode */
  }
}

export function shouldShowShelterOrgOnboarding(userId: string): boolean {
  return !hasDismissedShelterOrgOnboarding(userId);
}
