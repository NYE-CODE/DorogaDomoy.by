import { describe, expect, it } from 'vitest';
import { formatDate, formatCalendarDate, formatRelativeTime } from './formatDate';

describe('formatDate', () => {
  const now = new Date('2026-06-13T12:00:00');

  it('returns relative labels for recent dates', () => {
    expect(formatDate(new Date('2026-06-13T12:00:00'), now)).toBe('Сегодня');
    expect(formatDate(new Date('2026-06-12T12:00:00'), now)).toBe('Вчера');
    expect(formatDate(new Date('2026-06-10T12:00:00'), now)).toBe('3 дн. назад');
    expect(formatDate(new Date('2026-05-30T12:00:00'), now)).toBe('2 нед. назад');
  });

  it('falls back to locale date for older dates', () => {
    const old = new Date('2025-01-15T10:00:00');
    expect(formatDate(old, now)).toBe(old.toLocaleDateString('ru-BY'));
  });
});

describe('formatCalendarDate', () => {
  it('formats full calendar date', () => {
    const d = new Date('2026-03-05T12:00:00');
    expect(formatCalendarDate(d, 'ru-BY')).toContain('2026');
    expect(formatCalendarDate(d, 'ru-BY')).toContain('5');
  });
});

describe('formatRelativeTime', () => {
  const now = new Date('2026-06-13T12:00:00');

  it('returns granular relative time', () => {
    expect(formatRelativeTime(new Date('2026-06-13T11:59:30'), now)).toBe('только что');
    expect(formatRelativeTime(new Date('2026-06-13T11:30:00'), now)).toBe('30 мин. назад');
    expect(formatRelativeTime(new Date('2026-06-13T09:00:00'), now)).toBe('3 ч. назад');
    expect(formatRelativeTime(new Date('2026-06-12T12:00:00'), now)).toBe('1 день назад');
  });
});
