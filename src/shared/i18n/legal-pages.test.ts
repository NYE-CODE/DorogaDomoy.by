import { describe, expect, it } from 'vitest';
import { getLegalPage } from './legal-pages';

describe('getLegalPage', () => {
  it('returns public delete-account copy for ru/be/en', () => {
    for (const locale of ['ru', 'be', 'en'] as const) {
      const doc = getLegalPage(locale, 'delete-account');
      expect(doc.kind).toBe('delete-account');
      expect(doc.contactEmail).toBe('contact@dorogadomoy.by');
      expect(doc.sections.some((s) => s.mailtoForm)).toBe(true);
      expect(doc.sections.some((s) => s.showContact)).toBe(true);
    }
  });

  it('links privacy rights to /delete-account', () => {
    const ru = getLegalPage('ru', 'privacy');
    const rights = ru.sections.find((s) => s.title.startsWith('7.'));
    expect(rights?.links?.some((l) => l.to === '/delete-account')).toBe(true);
  });
});
