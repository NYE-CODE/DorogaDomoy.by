import { describe, expect, it } from 'vitest';
import { resolvePostSignupWelcomePath } from './post-signup-welcome';
import type { User } from '@/entities/user/model/types';

const baseUser: User = {
  id: 'u1',
  name: 'Test',
  email: 't@example.by',
  role: 'user',
  profileCompleted: true,
  contacts: {},
  registeredAsVolunteer: false,
};

describe('resolvePostSignupWelcomePath', () => {
  it('returns pet profile welcome for new regular user', () => {
    expect(resolvePostSignupWelcomePath(baseUser, true)).toBe('/welcome/pet-profile');
  });

  it('returns shelter org welcome for new volunteer', () => {
    expect(
      resolvePostSignupWelcomePath({ ...baseUser, role: 'volunteer', registeredAsVolunteer: true }, true),
    ).toBe('/welcome/shelter-org');
  });

  it('returns null for returning user login', () => {
    expect(resolvePostSignupWelcomePath(baseUser, false)).toBeNull();
  });
});
