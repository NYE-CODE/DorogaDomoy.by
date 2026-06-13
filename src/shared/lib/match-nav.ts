import { adopterProfileScope, readAdopterProfile } from './adopter-profile-storage';

/** Маршрут подбора: анкета или свайп, если анкета уже заполнена для текущего аккаунта. */
export function getMatchPath(userId?: string | null): '/match' | '/match/quiz' {
  const profile = readAdopterProfile(adopterProfileScope(userId));
  return profile?.completedAt ? '/match' : '/match/quiz';
}
