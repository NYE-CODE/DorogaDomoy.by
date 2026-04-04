import type { ProfilePetResponse } from '../api/client';
import type { PetFormData } from '../components/pet-form';
import type { AnimalType, Gender, PetColor } from '../types/pet';
import { resolveProfilePetSpecies } from './profile-pet-display';

const PET_COLOR_KEYS: PetColor[] = [
  'black',
  'white',
  'gray',
  'brown',
  'red',
  'mixed',
  'spotted',
  'striped',
];

const RU_LABELS = ['Черный', 'Белый', 'Серый', 'Коричневый', 'Рыжий', 'Смешанный', 'Пятнистый', 'Полосатый'];
const BE_LABELS = ['Чорны', 'Белы', 'Шэры', 'Карычневы', 'Рыжы', 'Змешаны', 'Плямісты', 'Паласаты'];
const EN_LABELS = ['Black', 'White', 'Gray', 'Brown', 'Ginger', 'Mixed', 'Spotted', 'Tabby'];

function labelToColorMap(labels: string[]): Record<string, PetColor> {
  const m: Record<string, PetColor> = {};
  labels.forEach((label, i) => {
    const key = PET_COLOR_KEYS[i];
    if (key) m[label] = key;
  });
  return m;
}

const LABEL_TO_PET_COLOR: Record<string, PetColor> = {
  ...labelToColorMap(RU_LABELS),
  ...labelToColorMap(BE_LABELS),
  ...labelToColorMap(EN_LABELS),
};

export function profileColorsToPetColors(colors: string[]): PetColor[] {
  const out: PetColor[] = [];
  for (const c of colors) {
    const trimmed = (c || '').trim();
    if (!trimmed) continue;
    if (PET_COLOR_KEYS.includes(trimmed as PetColor)) {
      const k = trimmed as PetColor;
      if (!out.includes(k)) out.push(k);
      continue;
    }
    const mapped = LABEL_TO_PET_COLOR[trimmed];
    if (mapped && !out.includes(mapped)) out.push(mapped);
  }
  return out;
}

export type ProfilePetPrefillLabels = {
  labelName: string;
  labelChipNumber: string;
  labelChipped: string;
  medicalTitle: string;
  yes: string;
};

function normalizeApproximateAge(age: string | null | undefined): PetFormData["approximateAge"] {
  const trimmed = (age ?? '').trim();
  if (!trimmed) return '';
  if (trimmed === 'менее 2 года' || trimmed === 'более 2 года') {
    return trimmed;
  }

  const numericPart = trimmed.replace(',', '.').match(/\d+(?:\.\d+)?/);
  if (!numericPart) return '';

  const numericAge = Number.parseFloat(numericPart[0]);
  if (!Number.isFinite(numericAge)) return '';
  return numericAge < 2 ? 'менее 2 года' : 'более 2 года';
}

export function buildPrefillFromProfilePet(
  p: ProfilePetResponse,
  L: ProfilePetPrefillLabels,
): Partial<PetFormData> {
  const species = resolveProfilePetSpecies(p.species, p.breed);
  const animalType: AnimalType =
    species === 'dog' ? 'dog' : species === 'cat' ? 'cat' : 'other';
  const gender: Gender =
    p.gender === 'female' ? 'female' : p.gender === 'male' ? 'male' : 'unknown';

  const lines: string[] = [];
  if (p.name?.trim()) lines.push(`${L.labelName}: ${p.name.trim()}`);
  if (p.special_marks?.trim()) lines.push(p.special_marks.trim());
  if (p.is_chipped && p.chip_number?.trim()) {
    lines.push(`${L.labelChipNumber}: ${p.chip_number.trim()}`);
  } else if (p.is_chipped) {
    lines.push(`${L.labelChipped}: ${L.yes}`);
  }
  if (p.medical_info?.trim()) {
    lines.push(`${L.medicalTitle}: ${p.medical_info.trim()}`);
  }
  const description = lines.join('\n\n').slice(0, 500);

  return {
    photos: [...(p.photos ?? [])],
    animalType,
    breed: (p.breed ?? '').trim(),
    colors: profileColorsToPetColors(p.colors ?? []),
    gender,
    approximateAge: normalizeApproximateAge(p.age),
    description,
    useProfileContacts: true,
  };
}
