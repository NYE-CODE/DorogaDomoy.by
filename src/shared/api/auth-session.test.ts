import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { LEGACY_TOKEN_KEY } from '@/shared/api/base';
import { authApi } from '@/shared/api/client';
const mockUserResponse = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test',
  role: 'user',
  contacts: {},
  profile_completed: true,
  password_set: true,
};

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 204 ? 'No Content' : 'OK',
    json: async () => body,
  } as Response;
}

describe('authApi session', () => {
  beforeAll(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  beforeEach(() => {
    vi.mocked(globalThis.fetch).mockReset();
    localStorage.clear();
    localStorage.setItem(LEGACY_TOKEN_KEY, 'legacy-jwt');
  });

  afterEach(() => {
    vi.mocked(fetch).mockReset();
    localStorage.clear();
  });

  it('login clears legacy token after success', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({
        access_token: 'new',
        token_type: 'bearer',
        user: mockUserResponse,
      }),
    );

    const user = await authApi.login('test@example.com', 'secret');
    expect(user.email).toBe('test@example.com');
    expect(localStorage.getItem(LEGACY_TOKEN_KEY)).toBeNull();
  });

  it('register clears legacy token after success', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({
        access_token: 'new',
        token_type: 'bearer',
        user: mockUserResponse,
      }),
    );

    await authApi.register('test@example.com', 'Test', 'secret', {});
    expect(localStorage.getItem(LEGACY_TOKEN_KEY)).toBeNull();
  });

  it('logout clears legacy token even when request fails', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('network down'));

    await authApi.logout();
    expect(localStorage.getItem(LEGACY_TOKEN_KEY)).toBeNull();
  });

  it('logout clears legacy token on 204', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(undefined, 204));

    await authApi.logout();
    expect(localStorage.getItem(LEGACY_TOKEN_KEY)).toBeNull();
  });
});
