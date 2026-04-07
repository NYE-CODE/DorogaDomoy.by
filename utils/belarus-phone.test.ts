import { describe, expect, it } from 'vitest';
import {
  formatBelarusPhoneStorage,
  isValidBelarusMobilePhoneOptional,
  parseBelarusMobileDigits,
} from './belarus-phone';

describe('belarus-phone', () => {
  it('parses international and local forms', () => {
    expect(parseBelarusMobileDigits('+375 29 123-45-67')).toBe('375291234567');
    expect(parseBelarusMobileDigits('375291234567')).toBe('375291234567');
    expect(parseBelarusMobileDigits('80291234567')).toBe('375291234567');
    expect(parseBelarusMobileDigits('0291234567')).toBe('375291234567');
    expect(parseBelarusMobileDigits('291234567')).toBe('375291234567');
    expect(parseBelarusMobileDigits('+375 33 999-88-77')).toBe('375339998877');
  });

  it('treats null and undefined as empty', () => {
    expect(parseBelarusMobileDigits(null)).toBeNull();
    expect(parseBelarusMobileDigits(undefined)).toBeNull();
    expect(formatBelarusPhoneStorage(undefined)).toBeNull();
    expect(isValidBelarusMobilePhoneOptional(null)).toBe(true);
  });

  it('rejects non-BY and wrong lengths', () => {
    expect(parseBelarusMobileDigits('+7 916 123-45-67')).toBeNull();
    expect(parseBelarusMobileDigits('+375 17 123-45-67')).toBeNull();
    expect(parseBelarusMobileDigits('+375 29 123-45-6')).toBeNull();
    expect(parseBelarusMobileDigits('')).toBeNull();
  });

  it('optional helper treats empty as valid', () => {
    expect(isValidBelarusMobilePhoneOptional('')).toBe(true);
    expect(isValidBelarusMobilePhoneOptional('   ')).toBe(true);
    expect(isValidBelarusMobilePhoneOptional('+375291234567')).toBe(true);
    expect(isValidBelarusMobilePhoneOptional('+79161234567')).toBe(false);
  });

  it('storage format', () => {
    expect(formatBelarusPhoneStorage('29 123 45 67')).toBe('+375291234567');
    expect(formatBelarusPhoneStorage('')).toBeNull();
  });
});
