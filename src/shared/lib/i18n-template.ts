/** Подстановка `{key}` в строках переводов (не вызывать строку как функцию). */
export function formatI18nTemplate(
  template: string | undefined | null,
  vars: Record<string, string | number>,
  fallback = '',
): string {
  let result = String(template ?? fallback);
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{${key}}`, String(value));
  }
  return result;
}
