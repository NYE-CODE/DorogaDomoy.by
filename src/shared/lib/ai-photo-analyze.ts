import type { PhotoAnalyzeResponse } from '@/shared/api/client';
import type { AnimalType, Gender, PetColor } from '@/entities/pet/model/types';

export const APPROXIMATE_AGE_LESS_2 = 'менее 2 года' as const;
export const APPROXIMATE_AGE_MORE_2 = 'более 2 года' as const;

const PET_COLOR_KEYS: PetColor[] = ['black', 'white', 'gray', 'brown', 'red', 'mixed', 'spotted', 'striped'];

export type AiFilledAdFields = {
  animalType?: boolean;
  breed?: boolean;
  colors?: boolean;
  gender?: boolean;
  approximateAge?: boolean;
  description?: boolean;
};

/** Выбирает наиболее подходящее фото для AI (предпочтительно data URL, затем самый крупный payload). */
export function pickBestPhotoForAi(photos: string[]): string | null {
  const candidates = photos.map((p) => p?.trim()).filter(Boolean) as string[];
  if (!candidates.length) return null;
  let best = candidates.find((p) => p.startsWith('data:image')) ?? candidates[0];
  for (const photo of candidates) {
    if (photo.length > best.length) best = photo;
  }
  return best;
}

export function mapAiColorsToPetColors(texts: string[]): PetColor[] {
  const rules: [RegExp, PetColor][] = [
    [/черн|чёрн|black/i, 'black'],
    [/бел|white/i, 'white'],
    [/сер|сіры|gray|grey/i, 'gray'],
    [/коричн|brown/i, 'brown'],
    [/рыж|ginger|red/i, 'red'],
    [/пёстр|пестр|spot/i, 'spotted'],
    [/полос|strip|tabby/i, 'striped'],
    [/трёх|трех|триколор|mixed|разно/i, 'mixed'],
  ];
  const found = new Set<PetColor>();
  for (const text of texts) {
    const key = text.trim().toLowerCase() as PetColor;
    if (PET_COLOR_KEYS.includes(key)) {
      found.add(key);
      continue;
    }
    for (const [re, color] of rules) {
      if (re.test(text)) found.add(color);
    }
  }
  if (found.size === 0 && texts.length > 0) found.add('mixed');
  return [...found];
}

/** Сопоставляет тексты окраса со списком подписей (профиль питомца). */
export function mapAiColorsToOptionLabels(texts: string[], options: string[]): string[] {
  const rules: [RegExp, string][] = [
    [/черн|чёрн|black/i, 'Черный'],
    [/бел|white/i, 'Белый'],
    [/сер|сіры|gray|grey/i, 'Серый'],
    [/коричн|brown/i, 'Коричневый'],
    [/рыж|ginger|red/i, 'Рыжий'],
    [/пёстр|пестр|spot/i, 'Пегий'],
    [/полос|strip|tabby/i, 'Полосатый'],
    [/трёх|трех|триколор|mixed|разно/i, 'Трёхцветный'],
  ];
  const optionByLower = new Map(options.map((o) => [o.toLowerCase(), o]));
  const found = new Set<string>();
  for (const text of texts) {
    const direct = optionByLower.get(text.trim().toLowerCase());
    if (direct) {
      found.add(direct);
      continue;
    }
    for (const [re, fallback] of rules) {
      if (!re.test(text)) continue;
      const match = options.find((o) => o.toLowerCase() === fallback.toLowerCase());
      if (match) found.add(match);
    }
  }
  return [...found];
}

export function mapAiApproximateAge(value: string | null | undefined): string {
  const v = (value ?? '').trim().toLowerCase();
  if (!v || v === 'unknown' || v === 'null') return '';
  if (v === 'less_2' || v.includes('менее') || v === 'young' || v === 'puppy' || v === 'kitten') {
    return APPROXIMATE_AGE_LESS_2;
  }
  if (v === 'more_2' || v.includes('более') || v === 'adult' || v === 'senior') {
    return APPROXIMATE_AGE_MORE_2;
  }
  return '';
}

export function mapAiAgeYearsEstimate(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '';
  const years = Math.round(value);
  if (years < 0 || years > 30) return '';
  return String(years);
}

export interface AdFormAiSlice {
  animalType: AnimalType;
  breed: string;
  colors: PetColor[];
  gender: Gender;
  approximateAge: string;
  description: string;
}

export function applyPhotoAnalyzeToAdForm(
  prev: AdFormAiSlice,
  result: PhotoAnalyzeResponse,
  maxDescription: number,
): { next: AdFormAiSlice; filled: AiFilledAdFields; descriptionFilled: boolean } {
  const next = { ...prev };
  const filled: AiFilledAdFields = {};

  if (result.animal_type === 'cat' || result.animal_type === 'dog' || result.animal_type === 'other') {
    if (next.animalType !== result.animal_type) {
      next.animalType = result.animal_type;
      next.breed = '';
    }
    filled.animalType = true;
  }
  if (result.breed?.trim()) {
    next.breed = result.breed.trim();
    filled.breed = true;
  }
  if (result.gender === 'male' || result.gender === 'female') {
    next.gender = result.gender;
    filled.gender = true;
  }
  if (result.colors?.length) {
    const mapped = mapAiColorsToPetColors(result.colors);
    if (mapped.length) {
      next.colors = mapped;
      filled.colors = true;
    }
  }
  const agePreset = mapAiApproximateAge(result.approximate_age ?? undefined);
  if (agePreset && !next.approximateAge?.trim()) {
    next.approximateAge = agePreset;
    filled.approximateAge = true;
  }
  const aiDesc = result.description?.trim() || result.notes?.trim();
  let descriptionFilled = false;
  if (aiDesc && !next.description?.trim()) {
    next.description = aiDesc.slice(0, maxDescription);
    filled.description = true;
    descriptionFilled = true;
  }
  return { next, filled, descriptionFilled };
}
