/** Слоты размещения рекламы партнёров. */
export const PARTNER_AD_PLACEMENTS = [
  'search-feed',
  'pet-detail-sidebar',
  'pet-detail-bottom',
  'blog-list',
  'blog-article',
  'favorites-grid',
  'landing-strip',
  'shelters-top',
] as const;

export type PartnerAdPlacement = (typeof PARTNER_AD_PLACEMENTS)[number];

/** Каждые N карточек в ленте поиска. */
export const PARTNER_AD_SEARCH_FEED_INTERVAL = 8;

/** Каждые N постов в списке блога. */
export const PARTNER_AD_BLOG_LIST_INTERVAL = 4;

/** Каждые N карточек в избранном. */
export const PARTNER_AD_FAVORITES_GRID_INTERVAL = 3;
