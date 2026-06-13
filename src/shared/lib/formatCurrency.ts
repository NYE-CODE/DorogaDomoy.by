/** Форматирует сумму в белорусских рублях. */
export function formatCurrency(
  amount: number,
  options: { locale?: string; currency?: string; maximumFractionDigits?: number } = {},
): string {
  const {
    locale = 'ru-BY',
    currency = 'BYN',
    maximumFractionDigits = 2,
  } = options;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits,
  }).format(amount);
}

/** Короткий формат «10 BYN» для badge/label. */
export function formatBynShort(amount: number): string {
  const formatted = Number.isInteger(amount)
    ? String(amount)
    : amount.toFixed(2).replace(/\.?0+$/, '');
  return `${formatted} BYN`;
}
