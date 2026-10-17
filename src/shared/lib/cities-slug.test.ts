import { describe, expect, it } from 'vitest';
import { citySlug, findCityBySlug } from '@/shared/lib/cities';

describe('citySlug', () => {
  it('maps regional centers to stable slugs', () => {
    expect(citySlug('Минск')).toBe('minsk');
    expect(citySlug('Могилёв')).toBe('mogilev');
    expect(findCityBySlug('brest')?.name).toBe('Брест');
  });
});
