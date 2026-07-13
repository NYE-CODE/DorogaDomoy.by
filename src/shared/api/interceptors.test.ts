import { describe, expect, it } from 'vitest';
import { LEGACY_TOKEN_KEY } from '@/shared/api/base';
import { clearLegacyToken, createApiError, formatApiErrorBody } from '@/shared/api/interceptors';

describe('formatApiErrorBody', () => {
  it('extracts string detail', () => {
    expect(formatApiErrorBody({ detail: 'Not found' }, 'fallback')).toBe('Not found');
  });

  it('joins validation errors', () => {
    expect(
      formatApiErrorBody({ detail: [{ msg: 'Required' }, { msg: 'Too short' }] }, 'fallback'),
    ).toBe('Required · Too short');
  });

  it('includes real field names', () => {
    expect(
      formatApiErrorBody({ detail: [{ field: 'name', msg: 'Field required' }] }, 'fallback'),
    ).toBe('name: Field required');
  });

  it('hides FastAPI query.data body-misparse noise', () => {
    expect(
      formatApiErrorBody({ detail: [{ field: 'query.data', msg: 'Field required' }] }, 'Проверьте данные'),
    ).toBe('Проверьте данные');
  });

  it('returns fallback for unknown shape', () => {
    expect(formatApiErrorBody(null, 'fallback')).toBe('fallback');
  });
});

describe('createApiError', () => {
  it('maps 401 to session message', () => {
    localStorage.setItem(LEGACY_TOKEN_KEY, 'legacy');
    const err = createApiError({ status: 401, statusText: 'Unauthorized', body: {} });
    expect(err.message).toBe('Сессия истекла');
    expect(localStorage.getItem(LEGACY_TOKEN_KEY)).toBeNull();
  });

  it('maps 413 to payload size message', () => {
    const err = createApiError({ status: 413, statusText: 'Payload Too Large', body: {} });
    expect(err.message).toContain('большой размер');
  });
});

describe('clearLegacyToken', () => {
  it('removes legacy key without throwing', () => {
    localStorage.setItem(LEGACY_TOKEN_KEY, 'legacy');
    expect(() => clearLegacyToken()).not.toThrow();
    expect(localStorage.getItem(LEGACY_TOKEN_KEY)).toBeNull();
  });
});
