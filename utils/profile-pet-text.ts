import type { Locale } from '../i18n/translations';

type PublicPetProfileTexts = {
  ageYearOneEn: string;
  ageYearsEn: string;
  ageYear: string;
  ageYears2to4: string;
  ageYears5plus: string;
};

type TemperamentOption = {
  value: string;
  label: string;
};

type MyPetsFormTexts = {
  genderFemale: string;
  genderMale: string;
  temperamentOptions: TemperamentOption[];
};

/**
 * Целое число лет из поля профиля. Строки с дробью, текстом или нечисловые — null
 * (показываем исходную строку как есть).
 */
export function parsePetAgeYears(age: string | null | undefined): number | null {
  const raw = (age ?? '').trim();
  if (raw === '') return null;
  if (!/^-?\d+$/.test(raw)) return null;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

/** Возраст для карточки: плюрализация для целых лет, иначе сырой текст или «—». */
export function formatPetAgeDisplay(
  age: string | null | undefined,
  locale: Locale,
  pp: PublicPetProfileTexts,
): string {
  const years = parsePetAgeYears(age);
  if (years !== null) return formatPetAge(years, locale, pp);
  const raw = (age ?? '').trim();
  return raw || '—';
}

export function formatPetAge(n: number, locale: Locale, pp: PublicPetProfileTexts): string {
  if (locale === 'en') {
    return n === 1
      ? pp.ageYearOneEn.replace('{n}', String(n))
      : pp.ageYearsEn.replace('{n}', String(n));
  }
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return pp.ageYear.replace('{n}', String(n));
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return pp.ageYears2to4.replace('{n}', String(n));
  }
  return pp.ageYears5plus.replace('{n}', String(n));
}

export function genderLabel(gender: string, form: MyPetsFormTexts): string {
  return gender === 'female' ? form.genderFemale : form.genderMale;
}

export function temperamentLabel(value: string | null | undefined, form: MyPetsFormTexts): string {
  if (!value) return '—';
  return form.temperamentOptions.find((option) => option.value === value)?.label ?? value;
}

export function dateLocaleForUi(locale: string): string {
  if (locale === 'be') return 'be-BY';
  if (locale === 'en') return 'en-US';
  return 'ru-RU';
}
