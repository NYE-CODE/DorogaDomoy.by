import { describe, expect, it } from 'vitest';
import { buildProfileContactsTo } from './profile-contacts-link';

describe('buildProfileContactsTo', () => {
  it('opens personal tab on profile', () => {
    expect(buildProfileContactsTo()).toEqual({
      pathname: '/profile',
      search: '?tab=personal',
    });
  });

  it('preserves return path in router state', () => {
    expect(buildProfileContactsTo('/create')).toEqual({
      pathname: '/profile',
      search: '?tab=personal',
      state: { fromProtected: '/create' },
    });
  });
});
