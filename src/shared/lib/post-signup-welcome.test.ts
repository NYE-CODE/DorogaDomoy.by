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

  it('prefers signupRole=volunteer even if API user.role is still user', () => {
    expect(resolvePostSignupWelcomePath(baseUser, true, 'volunteer')).toBe('/welcome/shelter-org');
  });

  it('uses API volunteer role even if signupRole hint is user', () => {
    expect(
      resolvePostSignupWelcomePath(
        { ...baseUser, role: 'volunteer', registeredAsVolunteer: true },
        true,
        'user',
      ),
    ).toBe('/welcome/shelter-org');
  });

  it('treats registeredAsVolunteer as volunteer when role missing', () => {
    expect(
      resolvePostSignupWelcomePath({ ...baseUser, registeredAsVolunteer: true }, true),
    ).toBe('/welcome/shelter-org');
  });

  it('returns null for returning user login', () => {
    expect(resolvePostSignupWelcomePath(baseUser, false)).toBeNull();
  });
});
