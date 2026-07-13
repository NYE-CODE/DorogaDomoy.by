import { describe, expect, it } from 'vitest';
import { formatI18nTemplate } from '@/shared/lib/i18n-template';

describe('formatI18nTemplate', () => {
  it('replaces placeholders', () => {
    expect(formatI18nTemplate('Фото {n}', { n: 2 })).toBe('Фото 2');
    expect(formatI18nTemplate('{current} из {max}', { current: 1, max: 5 })).toBe('1 из 5');
  });

  it('uses fallback for missing template', () => {
    expect(formatI18nTemplate(null, { n: 1 }, 'Photo {n}')).toBe('Photo 1');
  });
});
