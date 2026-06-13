import { describe, expect, it } from 'vitest';
import { formatBynShort, formatCurrency } from './formatCurrency';

describe('formatCurrency', () => {
  it('formats BYN amount', () => {
    const result = formatCurrency(10.5);
    expect(result).toMatch(/10[,.]5/);
    expect(result).toMatch(/BYN|Br|руб/i);
  });
});

describe('formatBynShort', () => {
  it('formats integers without decimals', () => {
    expect(formatBynShort(10)).toBe('10 BYN');
  });

  it('trims trailing zeros for fractional amounts', () => {
    expect(formatBynShort(10.5)).toBe('10.5 BYN');
    expect(formatBynShort(10.0)).toBe('10 BYN');
  });
});
