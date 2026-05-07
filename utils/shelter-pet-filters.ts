import type { AnimalType, Gender, Pet, PetColor, PetStatus } from '../types/pet';

/** Состояние фильтров приюта (черновик / применённые). */
export type ShelterPetAgeBand =
  | 'all'
  | 'under5mo'
  | 'm6to12'
  | 'y1to5'
  | 'y6to10'
  | 'y10plus';

export type ShelterPetHealth = 'all' | 'disabled' | 'treatment' | 'good' | 'excellent';
export type ShelterPetCoat = 'all' | 'smooth' | 'semi' | 'fluffy';
export type ShelterPetSponsor = 'all' | 'available' | 'taken';

export type ShelterPetFilterState = {
  animalType: AnimalType | 'all';
  status: PetStatus | 'all';
  search: string;
  gender: 'all' | Exclude<Gender, 'unknown'>;
  ageBand: ShelterPetAgeBand;
  health: ShelterPetHealth;
  color: 'all' | PetColor;
  coat: ShelterPetCoat;
  sponsor: ShelterPetSponsor;
  urgentOnly: boolean;
};

export const defaultShelterPetFilters = (): ShelterPetFilterState => ({
  animalType: 'all',
  status: 'all',
  search: '',
  gender: 'all',
  ageBand: 'all',
  health: 'all',
  color: 'all',
  coat: 'all',
  sponsor: 'all',
  urgentOnly: false,
});

function norm(s: string): string {
  return s.toLowerCase().replace(/ё/g, 'е');
}

export function petSearchBlob(p: Pet): string {
  return norm([p.description, p.approximateAge, p.breed, p.city, p.authorName].filter(Boolean).join(' '));
}

function hasAnyAgeSignal(p: Pet, blob: string): boolean {
  return Boolean(p.approximateAge?.trim()) || /\d|месяц|мес\b|год|лет|года/i.test(blob);
}

function matchesAgeBand(p: Pet, band: ShelterPetAgeBand): boolean {
  if (band === 'all') return true;
  const blob = petSearchBlob(p);
  if (!hasAnyAgeSignal(p, blob)) return true;

  const presetYoung = p.approximateAge?.trim() === 'менее 2 года';
  const presetOld = p.approximateAge?.trim() === 'более 2 года';

  switch (band) {
    case 'under5mo':
      if (presetYoung) return true;
      return /до\s*5|до\s*пяти|[1-5]\s*(мес|месяц)|менее\s*6?\s*мес|^\s*[1-5]\s*мес/i.test(blob);
    case 'm6to12':
      return /(6|7|8|9|10|11|12)\s*(мес|месяц)|полгода|пол\s*года|6\s*[-–]\s*12/i.test(blob);
    case 'y1to5':
      if (presetYoung) return true;
      return (
        /[1-5]\s*(год|года|лет)|год\s*и\s*пол|полтора\s*года|два\s*года|три\s*года|четыре\s*года|пять\s*лет/i.test(
          blob,
        ) && !/(6|7|8|9)\s*лет|10\s*(\+|лет)|старше\s*10|от\s*10/i.test(blob)
      );
    case 'y6to10':
      if (presetOld) return false;
      return /(6|7|8|9)\s*(год|года|лет)|6\s*[-–]\s*10\s*лет/i.test(blob);
    case 'y10plus':
      if (presetOld) return true;
      return /(10|11|12|[1-9]\d)\s*(год|года|лет)|старше\s*10|от\s*10|10\s*\+/i.test(blob);
    default:
      return true;
  }
}

function matchesHealth(blob: string, health: ShelterPetHealth): boolean {
  if (health === 'all') return true;
  switch (health) {
    case 'disabled':
      return /инвал|трехлап|без\s*лапы|хрома|слеп|глух|особые\s*нужды/i.test(blob);
    case 'treatment':
      return /лечен|терапи|операц|реабилит|вакцин|стерилиз|кастрат|кастрац|болеет|лечить/i.test(blob);
    case 'good':
      return /хорош(ее|о|ий)?\s*(здоров|состояни)|здоров\s*хорош/i.test(blob);
    case 'excellent':
      return /отличн(ое|о|ый)?\s*(здоров|состояни)|идеальн(ое|о)?\s*здоров/i.test(blob);
    default:
      return true;
  }
}

function matchesCoat(blob: string, coat: ShelterPetCoat): boolean {
  if (coat === 'all') return true;
  switch (coat) {
    case 'smooth':
      return /гладк|коротк(ая|ой)?\s*шерст|бесшерст|голый/i.test(blob);
    case 'semi':
      return /полудлин|средн(яя|ей)?\s*шерст|полупушист/i.test(blob);
    case 'fluffy':
      return /пушист|длинн(ая|ой)?\s*шерст|пушн/i.test(blob);
    default:
      return true;
  }
}

function matchesSponsor(blob: string, sponsor: ShelterPetSponsor): boolean {
  if (sponsor === 'all') return true;
  const taken = /под\s*опек|уже\s*есть\s*опек|есть\s*опекун|опекун\s*найден/i.test(blob);
  const seeking = /нужн(а|ен)?\s*опек|ищем\s*опек|возьмите\s*опек|нужен\s*куратор|ищем\s*куратор/i.test(blob);
  if (sponsor === 'taken') return taken;
  if (sponsor === 'available') return seeking && !taken;
  return true;
}

function matchesUrgent(blob: string, urgent: boolean): boolean {
  if (!urgent) return true;
  return /срочн|sos|срочный\s*сбор|срочно\s*нужн|экстрен/i.test(blob);
}

/** Фильтр по объявлению (пол, вид, статус, окрас из полей; возраст/здоровье/шерсть/опека/SOS — эвристика по тексту). */
export function petMatchesShelterFilters(p: Pet, f: ShelterPetFilterState): boolean {
  if (f.animalType !== 'all' && p.animalType !== f.animalType) return false;
  if (f.status !== 'all' && p.status !== f.status) return false;

  if (f.gender !== 'all') {
    if (p.gender === 'unknown') return false;
    if (p.gender !== f.gender) return false;
  }

  if (f.color !== 'all') {
    if (!p.colors?.length) return false;
    if (!p.colors.includes(f.color)) return false;
  }

  const blob = petSearchBlob(p);
  if (!matchesAgeBand(p, f.ageBand)) return false;
  if (!matchesHealth(blob, f.health)) return false;
  if (!matchesCoat(blob, f.coat)) return false;
  if (!matchesSponsor(blob, f.sponsor)) return false;
  if (!matchesUrgent(blob, f.urgentOnly)) return false;

  const q = f.search.trim().toLowerCase();
  if (q) {
    if (!blob.includes(q)) return false;
  }

  return true;
}

export function countActiveShelterFilterFields(f: ShelterPetFilterState): number {
  let n = 0;
  if (f.animalType !== 'all') n++;
  if (f.status !== 'all') n++;
  if (f.search.trim()) n++;
  if (f.gender !== 'all') n++;
  if (f.ageBand !== 'all') n++;
  if (f.health !== 'all') n++;
  if (f.color !== 'all') n++;
  if (f.coat !== 'all') n++;
  if (f.sponsor !== 'all') n++;
  if (f.urgentOnly) n++;
  return n;
}
