import { describe, expect, it } from 'vitest';
import { createApiError, formatApiErrorBody } from '@/shared/api/interceptors';

describe('formatApiErrorBody', () => {
  it('extracts string detail', () => {
    expect(formatApiErrorBody({ detail: 'Not found' }, 'fallback')).toBe('Not found');
  });

  it('joins validation errors', () => {
    expect(
      formatApiErrorBody({ detail: [{ msg: 'Required' }, { msg: 'Too short' }] }, 'fallback'),
    ).toBe('Required · Too short');
  });

  it('returns fallback for unknown shape', () => {
    expect(formatApiErrorBody(null, 'fallback')).toBe('fallback');
  });
});

describe('createApiError', () => {
  it('maps 401 to session message', () => {
    const err = createApiError({ status: 401, statusText: 'Unauthorized', body: {} });
    expect(err.message).toBe('Сессия истекла');
  });

  it('maps 413 to payload size message', () => {
    const err = createApiError({ status: 413, statusText: 'Payload Too Large', body: {} });
    expect(err.message).toContain('большой размер');
  });
});
