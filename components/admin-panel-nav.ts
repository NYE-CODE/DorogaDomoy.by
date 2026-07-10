export type AdminTab =
  | 'dashboard'
  | 'moderation'
  | 'pets'
  | 'profilePets'
  | 'users'
  | 'rewards'
  | 'reports'
  | 'media'
  | 'blog'
  | 'blogCategories'
  | 'partners'
  | 'partnerAds'
  | 'helpSection'
  | 'featureFlags'
  | 'instagram'
  | 'telegramBlog'
  | 'faq'
  | 'guides'
  | 'settings'
  | 'sheltersCatalog'
  | 'sheltersModeration';

export type AdminPrimarySection =
  | 'dashboard'
  | 'landing'
  | 'petSearch'
  | 'shelter'
  | 'blog'
  | 'administration';

export const TAB_PRIMARY: Record<AdminTab, AdminPrimarySection> = {
  dashboard: 'dashboard',
  media: 'landing',
  partners: 'landing',
  partnerAds: 'landing',
  helpSection: 'landing',
  faq: 'landing',
  guides: 'landing',
  users: 'petSearch',
  profilePets: 'petSearch',
  pets: 'petSearch',
  moderation: 'petSearch',
  reports: 'petSearch',
  rewards: 'petSearch',
  sheltersCatalog: 'shelter',
  sheltersModeration: 'shelter',
  blog: 'blog',
  blogCategories: 'blog',
  telegramBlog: 'blog',
  featureFlags: 'administration',
  instagram: 'administration',
  settings: 'administration',
};

export const TABS_BY_PRIMARY: Record<AdminPrimarySection, AdminTab[]> = {
  dashboard: ['dashboard'],
  landing: ['media', 'partners', 'partnerAds', 'helpSection', 'faq', 'guides'],
  petSearch: ['users', 'profilePets', 'pets', 'moderation', 'reports', 'rewards'],
  shelter: ['sheltersCatalog', 'sheltersModeration'],
  blog: ['blog', 'blogCategories', 'telegramBlog'],
  administration: ['featureFlags', 'instagram', 'settings'],
};

export const ALL_ADMIN_TABS = Object.keys(TAB_PRIMARY) as AdminTab[];

export const ALL_ADMIN_PRIMARY_SECTIONS = Object.keys(
  TABS_BY_PRIMARY,
) as AdminPrimarySection[];
