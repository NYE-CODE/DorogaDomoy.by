import { describe, expect, it } from 'vitest';
import { rangeSliderGradient } from './range-slider-gradient';

describe('rangeSliderGradient', () => {
  it('returns gradient with fill percentage at min', () => {
    expect(rangeSliderGradient(1, 1, 10)).toContain('0%');
  });

  it('returns gradient with fill percentage at max', () => {
    const g = rangeSliderGradient(10, 1, 10);
    expect(g).toContain('100%');
    expect(g).toContain('var(--color-primary)');
    expect(g).toContain('var(--color-slider-track)');
  });
});
