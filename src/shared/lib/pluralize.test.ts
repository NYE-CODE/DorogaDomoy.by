import { describe, expect, it } from 'vitest';
import { pluralize, pluralizeWithCount } from './pluralize';

const forms = ['объявление', 'объявления', 'объявлений'] as const;

describe('pluralize', () => {
  it('selects correct Russian form', () => {
    expect(pluralize(1, forms)).toBe('объявление');
    expect(pluralize(2, forms)).toBe('объявления');
    expect(pluralize(5, forms)).toBe('объявлений');
    expect(pluralize(11, forms)).toBe('объявлений');
    expect(pluralize(21, forms)).toBe('объявление');
    expect(pluralize(22, forms)).toBe('объявления');
  });

  it('handles negative counts', () => {
    expect(pluralize(-1, forms)).toBe('объявление');
    expect(pluralize(-5, forms)).toBe('объявлений');
  });
});

describe('pluralizeWithCount', () => {
  it('combines count and form', () => {
    expect(pluralizeWithCount(5, forms)).toBe('5 объявлений');
  });
});
