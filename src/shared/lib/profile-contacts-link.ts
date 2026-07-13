/** Ссылка на профиль для добавления контактов с возвратом на исходную страницу. */
export function buildProfileContactsTo(returnPath?: string | null) {
  return {
    pathname: '/profile' as const,
    search: '?tab=personal',
    ...(returnPath ? { state: { fromProtected: returnPath } } : {}),
  };
}

export const PROFILE_CONTACTS_TAB = 'personal' as const;
