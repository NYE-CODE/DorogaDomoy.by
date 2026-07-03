/**
 * Единая палитра сценариев платформы:
 * - lost    — потеряшки (rose)
 * - found   — найденные (sky)
 * - shelter — приют / ищет дом (emerald)
 *
 * Hex синхронизирован с tokens.css (`--color-scenario-*`).
 * В UI используйте классы ниже, не разрозненные rose/sky/emerald/primary.
 */
import type { PetStatus } from '@/entities/pet/model/types';
import { tokens } from '@/shared/styles/tokens';

export type PetScenario = 'lost' | 'found' | 'shelter';
export type LostFoundScenario = 'lost' | 'found';

const s = tokens.scenario;

/** Акцентные классы (лендинг, иконки, кольца). */
export const petScenarioAccentClass: Record<
  PetScenario,
  { text: string; soft: string; ring: string }
> = {
  lost: {
    text: 'text-rose-600 dark:text-rose-400',
    soft: 'bg-rose-500/10 dark:bg-rose-500/15',
    ring: 'ring-rose-500/25',
  },
  found: {
    text: 'text-sky-700 dark:text-sky-400',
    soft: 'bg-sky-500/10 dark:bg-sky-500/15',
    ring: 'ring-sky-500/25',
  },
  shelter: {
    text: 'text-emerald-700 dark:text-emerald-400',
    soft: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    ring: 'ring-emerald-500/25',
  },
};

/** Бейдж с рамкой (карточки, превью на карте). */
export const petScenarioBorderedBadgeClass: Record<PetScenario, string> = {
  lost: 'border-rose-200/90 bg-rose-50 text-rose-900 dark:border-rose-800/80 dark:bg-rose-950/40 dark:text-rose-100',
  found:
    'border-sky-200/90 bg-sky-50 text-sky-950 dark:border-sky-800/80 dark:bg-sky-950/45 dark:text-sky-100',
  shelter:
    'border-emerald-200/90 bg-emerald-50 text-emerald-950 dark:border-emerald-800/80 dark:bg-emerald-950/40 dark:text-emerald-100',
};

/** Плашка на фото — жетон: «гравировка» (uppercase + tracking) поверх цвета сценария. */
export const petScenarioPhotoPillClass: Record<PetScenario, string> = {
  lost: 'uppercase tracking-[0.12em] bg-rose-600/95 text-white shadow-sm backdrop-blur-sm dark:bg-rose-600',
  found: 'uppercase tracking-[0.12em] bg-sky-600/95 text-white shadow-sm backdrop-blur-sm dark:bg-sky-600',
  shelter: 'uppercase tracking-[0.12em] bg-emerald-600/95 text-white shadow-sm backdrop-blur-sm dark:bg-emerald-600',
};

/** Мягкий pill в списках и на детальной. */
export const petScenarioSoftPillClass: Record<PetScenario, string> = {
  lost: 'bg-rose-100 text-rose-900 dark:bg-rose-950/45 dark:text-rose-100',
  found: 'bg-sky-100 text-sky-950 dark:bg-sky-950/45 dark:text-sky-100',
  shelter: 'bg-emerald-100 text-emerald-950 dark:bg-emerald-950/45 dark:text-emerald-100',
};

/** Фильтр: выбранный чип (только lost/found). */
export const petScenarioFilterSelectedClass: Record<LostFoundScenario, string> = {
  lost: 'border-rose-400/55 bg-rose-500/12 text-rose-950 shadow-sm dark:border-rose-600 dark:bg-rose-950/50 dark:text-rose-100',
  found:
    'border-sky-500/45 bg-sky-500/12 text-sky-950 shadow-sm dark:border-sky-600 dark:bg-sky-950/50 dark:text-sky-100',
};

/** Переключатель типа объявления в форме. */
export const petScenarioFormToggleActiveClass: Record<LostFoundScenario, string> = {
  lost: 'bg-rose-600 text-white shadow-sm hover:bg-rose-600/90',
  found: 'bg-sky-600 text-white shadow-sm hover:bg-sky-600/90',
};

/** Баннер на странице объявления. */
export const petScenarioDetailBannerClass: Record<
  LostFoundScenario,
  { box: string; icon: string; title: string }
> = {
  lost: {
    box: 'mb-6 flex items-start gap-3 rounded-md border border-rose-500/35 bg-rose-50/80 p-4 dark:border-rose-500/40 dark:bg-rose-950/30',
    icon: 'mt-0.5 shrink-0 text-rose-600 dark:text-rose-400',
    title: 'mb-1 font-semibold text-rose-800 dark:text-rose-200',
  },
  found: {
    box: 'mb-6 flex items-start gap-3 rounded-md border border-sky-500/35 bg-sky-50/80 p-4 dark:border-sky-500/40 dark:bg-sky-950/30',
    icon: 'mt-0.5 shrink-0 text-sky-600 dark:text-sky-400',
    title: 'mb-1 font-semibold text-sky-900 dark:text-sky-200',
  },
};

/** Иконка в блоке статистики (лендинг). */
export const petScenarioStatsIconClass: Record<PetScenario, string> = {
  lost: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  found: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  shelter: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
};

/** Маркеры на карте (Leaflet). */
export const PET_SCENARIO_MARKER_HEX: Record<PetScenario, string> = {
  lost: s.lost,
  found: s.found,
  shelter: s.shelter,
};

/** Листовка для печати. */
export const petScenarioFlyerColors: Record<LostFoundScenario, { accent: string; soft: string; border: string }> = {
  lost: { accent: s.lost, soft: s.lostSoft, border: s.lostBorder },
  found: { accent: s.found, soft: s.foundSoft, border: s.foundBorder },
};

export function petScenarioFromStatus(status: PetStatus): LostFoundScenario {
  return status === 'searching' ? 'lost' : 'found';
}

export function petScenarioFromPetScope(petScope?: string | null): PetScenario {
  return petScope === 'shelter_pet' ? 'shelter' : 'lost';
}

export function petScenarioFromPet(pet: {
  status?: PetStatus;
  petScope?: string | null;
}): PetScenario {
  if (pet.petScope === 'shelter_pet') return 'shelter';
  return petScenarioFromStatus(pet.status ?? 'searching');
}

/** @deprecated Используйте petScenarioFromStatus */
export function lostFoundFromStatus(status: PetStatus): LostFoundScenario {
  return petScenarioFromStatus(status);
}
