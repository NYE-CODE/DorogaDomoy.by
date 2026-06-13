/** Обрезает строку до maxLength с суффиксом. */
export function truncate(text: string, maxLength: number, suffix = '…'): string {
  if (maxLength <= 0) return suffix;
  if (text.length <= maxLength) return text;
  if (suffix.length >= maxLength) return suffix.slice(0, maxLength);
  return text.slice(0, maxLength - suffix.length) + suffix;
}
