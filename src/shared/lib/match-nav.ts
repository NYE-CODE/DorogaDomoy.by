import { readAdopterProfile } from './adopter-profile-storage';

/** Маршрут подбора: анкета или свайп, если анкета уже заполнена. */
export function getMatchPath(): '/match' | '/match/quiz' {
  const profile = readAdopterProfile();
  return profile?.completedAt ? '/match' : '/match/quiz';
}
