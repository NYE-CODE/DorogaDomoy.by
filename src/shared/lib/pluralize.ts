/**
 * Русская plural-форма: [one, few, many].
 * Пример: pluralize(5, ['день', 'дня', 'дней']) → «дней»
 */
export function pluralize(count: number, forms: readonly [string, string, string]): string {
  const n = Math.abs(Math.trunc(count));
  const mod100 = n % 100;
  const mod10 = n % 10;

  if (mod100 >= 11 && mod100 <= 19) return forms[2];
  if (mod10 === 1) return forms[0];
  if (mod10 >= 2 && mod10 <= 4) return forms[1];
  return forms[2];
}

/** «5 объявлений», «1 объявление». */
export function pluralizeWithCount(
  count: number,
  forms: readonly [string, string, string],
): string {
  return `${count} ${pluralize(count, forms)}`;
}
