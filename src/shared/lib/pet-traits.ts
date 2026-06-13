import type { Compatibility, Pet, TraitLevel } from '@/entities/pet/model/types';

export interface TraitScaleLabels {
  label: string;
  levels: [string, string, string, string, string];
}

export interface PetTraitsCopy {
  sectionTitle: string;
  energyLevel: TraitScaleLabels;
  friendlinessLevel: TraitScaleLabels;
  trainingLevel: TraitScaleLabels;
  independenceLevel: TraitScaleLabels;
  compatYesKids: string;
  compatYesDogs: string;
  compatYesCats: string;
  compatNoKids: string;
  compatNoDogs: string;
  compatNoCats: string;
}

export interface TraitScaleDef {
  key: 'energyLevel' | 'friendlinessLevel' | 'trainingLevel' | 'independenceLevel';
  label: string;
  levels: [string, string, string, string, string];
}

const DEFAULT_COPY: PetTraitsCopy = {
  sectionTitle: 'Характер и совместимость',
  energyLevel: {
    label: 'Активность',
    levels: ['Спокойный', 'Размеренный', 'Умеренный', 'Энергичный', 'Очень активный'],
  },
  friendlinessLevel: {
    label: 'Доверие к людям',
    levels: ['Осторожный', 'Сдержанный', 'Дружелюбный', 'Контактный', 'Очень ласковый'],
  },
  trainingLevel: {
    label: 'Воспитанность',
    levels: ['Без навыков', 'Базовые навыки', 'Воспитан', 'Хорошо обучен', 'Отлично обучен'],
  },
  independenceLevel: {
    label: 'Самостоятельность',
    levels: ['Нужна компания', 'Лучше не один', 'Нейтрально', 'Спокоен один', 'Легко один'],
  },
  compatYesKids: 'Ладит с детьми',
  compatYesDogs: 'Ладит с собаками',
  compatYesCats: 'Ладит с кошками',
  compatNoKids: 'Не ладит с детьми',
  compatNoDogs: 'Не ладит с собаками',
  compatNoCats: 'Не ладит с кошками',
};

/** @deprecated Используйте buildTraitScales(copy) с переводами из i18n. */
export const TRAIT_SCALES: TraitScaleDef[] = buildTraitScales(DEFAULT_COPY);

export function buildTraitScales(copy: PetTraitsCopy): TraitScaleDef[] {
  return [
    { key: 'energyLevel', ...copy.energyLevel },
    { key: 'friendlinessLevel', ...copy.friendlinessLevel },
    { key: 'trainingLevel', ...copy.trainingLevel },
    { key: 'independenceLevel', ...copy.independenceLevel },
  ];
}

export function isValidTraitLevel(value: unknown): value is TraitLevel {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5;
}

export function traitLevelLabel(def: TraitScaleDef, value?: TraitLevel): string | null {
  if (!isValidTraitLevel(value)) return null;
  return def.levels[value - 1];
}

export interface CompatBadge {
  key: 'goodWithKids' | 'goodWithDogs' | 'goodWithCats';
  value: Compatibility;
}

const COMPAT_KEYS: CompatBadge['key'][] = ['goodWithKids', 'goodWithDogs', 'goodWithCats'];

function compatLabel(copy: PetTraitsCopy, key: CompatBadge['key'], value: Compatibility): string {
  const map: Record<CompatBadge['key'], { yes: string; no: string }> = {
    goodWithKids: { yes: copy.compatYesKids, no: copy.compatNoKids },
    goodWithDogs: { yes: copy.compatYesDogs, no: copy.compatNoDogs },
    goodWithCats: { yes: copy.compatYesCats, no: copy.compatNoCats },
  };
  return value === 'yes' ? map[key].yes : map[key].no;
}

/** Совместимости, явно заданные (не unknown), для отображения бейджами. */
export function getCompatBadges(pet: Pet): CompatBadge[] {
  return COMPAT_KEYS.flatMap((key) => {
    const value = pet[key];
    if (!value || value === 'unknown') return [];
    return [{ key, value }];
  });
}

export function compatBadgeText(badge: CompatBadge, copy: PetTraitsCopy): string {
  return compatLabel(copy, badge.key, badge.value);
}

/** @deprecated Используйте compatBadgeText(badge, copy). */
export function compatText(value: Compatibility, subject: string): string {
  const legacy: Record<Compatibility, string> = {
    yes: 'Ладит',
    no: 'Не ладит',
    unknown: 'Не знаю',
  };
  return `${legacy[value]} с ${subject}`;
}

/** Есть ли у питомца хоть одна заполненная черта характера/совместимости. */
export function hasAnyTrait(pet: Pet): boolean {
  return (
    isValidTraitLevel(pet.energyLevel) ||
    isValidTraitLevel(pet.friendlinessLevel) ||
    isValidTraitLevel(pet.trainingLevel) ||
    isValidTraitLevel(pet.independenceLevel) ||
    getCompatBadges(pet).length > 0
  );
}
