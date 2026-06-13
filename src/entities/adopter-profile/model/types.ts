import type { TraitLevel } from '@/entities/pet/model/types';

export type AdopterAnimalPref = 'cat' | 'dog' | 'any';
export type AdopterExperience = 'beginner' | 'experienced';
export type AdopterHousing = 'apartment' | 'house' | 'any';
/** Предпочтение по возрасту питомца */
export type AdopterAgePref = 'any' | 'young' | 'adult' | 'senior';
export type AdopterGenderPref = 'any' | 'male' | 'female';

/** Анкета будущего хозяина для подбора питомца из приюта. */
export interface AdopterProfile {
  animalType: AdopterAnimalPref;
  energyLevel: TraitLevel;
  experience: AdopterExperience;
  housing: AdopterHousing;
  hasKids: boolean;
  hasDogs: boolean;
  hasCats: boolean;
  agePref: AdopterAgePref;
  genderPref: AdopterGenderPref;
  /** Готов ухаживать за питомцем на лечении */
  acceptsTreatment: boolean;
  /** Готов взять питомца с инвалидностью / особыми нуждами */
  acceptsDisability: boolean;
  /** Пустая строка = любой город */
  city: string;
  completedAt: string;
}
