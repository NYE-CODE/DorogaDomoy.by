import type {
  AdopterAnimalPref,
  AdopterAgePref,
  AdopterExperience,
  AdopterGenderPref,
  AdopterHousing,
  AdopterProfile,
} from '../types/adopter-profile';
import type { TraitLevel } from '../types/pet';

const ANIMAL_TYPES = new Set<AdopterAnimalPref>(['cat', 'dog', 'any']);
const EXPERIENCE_VALUES = new Set<AdopterExperience>(['beginner', 'experienced']);
const HOUSING_VALUES = new Set<AdopterHousing>(['apartment', 'house', 'any']);
const AGE_PREF_VALUES = new Set<AdopterAgePref>(['any', 'young', 'adult', 'senior']);
const GENDER_PREF_VALUES = new Set<AdopterGenderPref>(['any', 'male', 'female']);

function pickEnum<T extends string>(value: unknown, allowed: ReadonlySet<T>, fallback: T): T {
  return typeof value === 'string' && allowed.has(value as T) ? (value as T) : fallback;
}

function pickBool(value: unknown): boolean {
  return value === true;
}

export function clampTraitLevel(value: unknown, fallback: TraitLevel = 3): TraitLevel {
  const n = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);
  if (Number.isInteger(n) && n >= 1 && n <= 5) return n as TraitLevel;
  return fallback;
}

const PROFILE_KEY = 'dd_adopter_profile_v1';
const PASSED_KEY = 'dd_match_passed_v1';
const LIKED_KEY = 'dd_match_liked_v1';

interface MatchLikedSnapshot {
  profileCompletedAt: string;
  petIds: string[];
}

export function readAdopterProfile(): AdopterProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<AdopterProfile>;
    if (!data?.completedAt) return null;
    return normalizeAdopterProfile(data);
  } catch {
    return null;
  }
}

/** Совместимость со старыми анкетами без полей возраста/здоровья. */
export function normalizeAdopterProfile(raw: Partial<AdopterProfile>): AdopterProfile {
  return {
    animalType: pickEnum(raw.animalType, ANIMAL_TYPES, 'any'),
    energyLevel: clampTraitLevel(raw.energyLevel),
    experience: pickEnum(raw.experience, EXPERIENCE_VALUES, 'beginner'),
    housing: pickEnum(raw.housing, HOUSING_VALUES, 'apartment'),
    hasKids: pickBool(raw.hasKids),
    hasDogs: pickBool(raw.hasDogs),
    hasCats: pickBool(raw.hasCats),
    agePref: pickEnum(raw.agePref, AGE_PREF_VALUES, 'any'),
    genderPref: pickEnum(raw.genderPref, GENDER_PREF_VALUES, 'any'),
    acceptsTreatment: pickBool(raw.acceptsTreatment),
    acceptsDisability: pickBool(raw.acceptsDisability),
    city: typeof raw.city === 'string' ? raw.city : '',
    completedAt: raw.completedAt!,
  };
}

export function saveAdopterProfile(profile: AdopterProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* ignore quota */
  }
}

export function clearAdopterProfile(): void {
  try {
    localStorage.removeItem(PROFILE_KEY);
  } catch {
    /* ignore */
  }
}

export function readPassedPetIds(): Set<string> {
  try {
    const raw = sessionStorage.getItem(PASSED_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x): x is string => typeof x === 'string' && x.length > 0));
  } catch {
    return new Set();
  }
}

export function addPassedPetId(petId: string): void {
  const ids = readPassedPetIds();
  ids.add(petId);
  try {
    sessionStorage.setItem(PASSED_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
}

export function clearPassedPetIds(): void {
  try {
    sessionStorage.removeItem(PASSED_KEY);
  } catch {
    /* ignore */
  }
}

function readMatchLikedSnapshot(): MatchLikedSnapshot | null {
  try {
    const raw = sessionStorage.getItem(LIKED_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<MatchLikedSnapshot>;
    if (!data?.profileCompletedAt || !Array.isArray(data.petIds)) return null;
    return {
      profileCompletedAt: data.profileCompletedAt,
      petIds: data.petIds.filter((x): x is string => typeof x === 'string' && x.length > 0),
    };
  } catch {
    return null;
  }
}

/** Лайки текущей сессии подбора — привязаны к completedAt анкеты. */
export function readMatchLikedPetIdsOrdered(profileCompletedAt: string): string[] {
  const snap = readMatchLikedSnapshot();
  if (!snap || snap.profileCompletedAt !== profileCompletedAt) return [];
  return snap.petIds;
}

export function readMatchLikedPetIds(profileCompletedAt: string): Set<string> {
  return new Set(readMatchLikedPetIdsOrdered(profileCompletedAt));
}

export function addMatchLikedPetId(petId: string, profileCompletedAt: string): void {
  const snap = readMatchLikedSnapshot();
  const petIds =
    snap?.profileCompletedAt === profileCompletedAt
      ? [...new Set([...snap.petIds, petId])]
      : [petId];
  try {
    sessionStorage.setItem(
      LIKED_KEY,
      JSON.stringify({ profileCompletedAt, petIds } satisfies MatchLikedSnapshot),
    );
  } catch {
    /* ignore */
  }
}

export function clearMatchLikedPetIds(): void {
  try {
    sessionStorage.removeItem(LIKED_KEY);
  } catch {
    /* ignore */
  }
}
