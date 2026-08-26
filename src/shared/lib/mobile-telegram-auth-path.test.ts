import { describe, expect, it } from 'vitest';
import { isMobileTelegramAuthPath } from './mobile-telegram-auth-path';

describe('isMobileTelegramAuthPath', () => {
  it('matches hosted widget URLs', () => {
    expect(isMobileTelegramAuthPath('/mobile-telegram-auth.html')).toBe(true);
    expect(isMobileTelegramAuthPath('/mobile-telegram-auth')).toBe(true);
  });

  it('ignores other routes', () => {
    expect(isMobileTelegramAuthPath('/')).toBe(false);
    expect(isMobileTelegramAuthPath('/privacy')).toBe(false);
  });
});
