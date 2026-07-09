import { describe, expect, it } from 'vitest';
import {
  ALL_ADMIN_PRIMARY_SECTIONS,
  ALL_ADMIN_TABS,
  TAB_PRIMARY,
  TABS_BY_PRIMARY,
  type AdminPrimarySection,
  type AdminTab,
} from './admin-panel-nav';

describe('admin-panel-nav', () => {
  it('maps every tab to a primary section', () => {
    for (const tab of ALL_ADMIN_TABS) {
      expect(TAB_PRIMARY[tab as AdminTab]).toBeTruthy();
    }
    expect(Object.keys(TAB_PRIMARY).length).toBe(ALL_ADMIN_TABS.length);
  });

  it('lists every tab exactly once across primary sections', () => {
    const listed = ALL_ADMIN_PRIMARY_SECTIONS.flatMap(
      (section) => TABS_BY_PRIMARY[section as AdminPrimarySection],
    );
    expect(new Set(listed).size).toBe(listed.length);
    expect([...listed].sort()).toEqual([...ALL_ADMIN_TABS].sort());
  });

  it('keeps tab primary mapping consistent with section lists', () => {
    for (const section of ALL_ADMIN_PRIMARY_SECTIONS) {
      for (const tab of TABS_BY_PRIMARY[section as AdminPrimarySection]) {
        expect(TAB_PRIMARY[tab]).toBe(section);
      }
    }
  });

  it('uses dashboard as the default tab for dashboard section', () => {
    expect(TABS_BY_PRIMARY.dashboard[0]).toBe('dashboard');
  });
});
