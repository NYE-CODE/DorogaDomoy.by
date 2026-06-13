import { describe, expect, it } from 'vitest';
import { truncate } from './truncate';

describe('truncate', () => {
  it('returns original text when within limit', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('truncates with ellipsis', () => {
    expect(truncate('hello world', 8)).toBe('hello w…');
  });

  it('handles edge cases', () => {
    expect(truncate('abc', 0)).toBe('…');
    expect(truncate('abc', 1)).toBe('…');
  });
});
