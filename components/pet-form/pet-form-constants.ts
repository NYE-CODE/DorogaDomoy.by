import {
  APPROXIMATE_AGE_LESS_2,
  APPROXIMATE_AGE_MORE_2,
} from '@/shared/lib/ai-photo-analyze';
import type { AnimalType, Gender } from '../../types/pet';

export const APPROXIMATE_AGE_PRESET_VALUES = [
  '',
  APPROXIMATE_AGE_LESS_2,
  APPROXIMATE_AGE_MORE_2,
] as const;

export const MAX_DESCRIPTION = 500;
export const MIN_DESCRIPTION = 20;
export const MAX_DISTINCTIVE_MARKS = 8;
export const MAX_DISTINCTIVE_MARK_LEN = 80;
export const MIN_DISTINCTIVE_MARK_LEN = 3;

export const TOTAL_STEPS_CREATE = 5;
export const TOTAL_STEPS_EDIT = 5;

export const animalTypeOptions: { value: AnimalType; icon: string }[] = [
  { value: 'cat', icon: '🐱' },
  { value: 'dog', icon: '🐶' },
  { value: 'other', icon: '🐾' },
];

export const genderOptions: { value: Gender }[] = [
  { value: 'unknown' },
  { value: 'male' },
  { value: 'female' },
];

export const agePresetValues = APPROXIMATE_AGE_PRESET_VALUES;
