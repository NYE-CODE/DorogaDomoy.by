/** Пример для placeholder: валидный мобильный РБ (код 29, дальше 7 цифр). */
export const BELARUS_MOBILE_PHONE_PLACEHOLDER = '+375291234567';

/** Беларусь: мобильные коды A1 / MTS / life:) после +375 */
const BY_MOBILE_NSN = /^(25|29|33|44)\d{7}$/;

function digitsOnly(s: string): string {
  return s.replace(/\D/g, '');
}

/**
 * Разбирает ввод и возвращает 12 цифр вида 375XXXXXXXXX для валидного мобильного номера РБ, иначе null.
 * Допускаются: +375…, 8 0 29…, 0 29…, только национальная часть 29… (9 цифр).
 */
export function parseBelarusMobileDigits(raw: unknown): string | null {
  if (raw == null) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  let d = digitsOnly(trimmed);
  if (!d) return null;

  if (d.startsWith('375')) {
    if (d.length === 12 && BY_MOBILE_NSN.test(d.slice(3))) return d;
    return null;
  }
  if (d.startsWith('80') && d.length === 11) {
    d = '375' + d.slice(2);
    if (d.length === 12 && BY_MOBILE_NSN.test(d.slice(3))) return d;
    return null;
  }
  if (d.startsWith('0') && d.length === 10) {
    d = '375' + d.slice(1);
    if (d.length === 12 && BY_MOBILE_NSN.test(d.slice(3))) return d;
    return null;
  }
  if (d.length === 9 && BY_MOBILE_NSN.test(d)) {
    return '375' + d;
  }
  return null;
}

export function isValidBelarusMobilePhone(raw: unknown): boolean {
  return parseBelarusMobileDigits(raw) !== null;
}

/** Пустая строка — допустимо (необязательное поле). */
export function isValidBelarusMobilePhoneOptional(raw: string | undefined | null): boolean {
  if (raw == null || !String(raw).trim()) return true;
  return isValidBelarusMobilePhone(raw);
}

/** Для сохранения в API: "+375291234567" или null если невалидно / пусто */
export function formatBelarusPhoneStorage(raw: unknown): string | null {
  const d = parseBelarusMobileDigits(raw);
  return d ? `+${d}` : null;
}
