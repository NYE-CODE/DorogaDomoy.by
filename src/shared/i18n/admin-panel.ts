/** Строки админ-панели (ru / be / en) — композиция из модулей admin-panel/*. */
import { adminPanelSectionsLocales } from './admin-panel/sections';
import { adminPanelTabsLocales } from './admin-panel/tabs';
import { adminPanelHeaderLocales } from './admin-panel/header';
import { adminPanelPaginationLocales } from './admin-panel/pagination';
import { adminPanelBreedUnknownLocales } from './admin-panel/breedUnknown';
import { adminPanelDashboardLocales } from './admin-panel/dashboard';
import { adminPanelToastsLocales } from './admin-panel/toasts';
import { adminPanelUsersLocales } from './admin-panel/users';
import { adminPanelReportsLocales } from './admin-panel/reports';
import { adminPanelRewardsLogLocales } from './admin-panel/rewardsLog';
import { adminPanelSheltersLocales } from './admin-panel/shelters';
import { adminPanelSheltersCatalogLocales } from './admin-panel/sheltersCatalog';
import { adminPanelBlogLocales } from './admin-panel/blog';
import { adminPanelCategoriesLocales } from './admin-panel/categories';
import { adminPanelTelegramLocales } from './admin-panel/telegram';
import { adminPanelMediaLocales } from './admin-panel/media';
import { adminPanelPartnersLocales } from './admin-panel/partners';
import { adminPanelPartnerAdsLocales } from './admin-panel/partnerAds';
import { adminPanelFaqLocales } from './admin-panel/faq';
import { adminPanelHelpSectionLocales } from './admin-panel/helpSection';
import { adminPanelGuidesSectionLocales } from './admin-panel/guidesSection';
import { adminPanelFeatureFlagsLocales } from './admin-panel/featureFlags';
import { adminPanelSettingsLocales } from './admin-panel/settings';
import { adminPanelInstagramLocales } from './admin-panel/instagram';
import { adminPanelModerationLocales } from './admin-panel/moderation';

export const adminPanelLocales = {
  ru: {
    sections: adminPanelSectionsLocales.ru,
    tabs: adminPanelTabsLocales.ru,
    header: adminPanelHeaderLocales.ru,
    pagination: adminPanelPaginationLocales.ru,
    breedUnknown: adminPanelBreedUnknownLocales.ru,
    dashboard: adminPanelDashboardLocales.ru,
    toasts: adminPanelToastsLocales.ru,
    users: adminPanelUsersLocales.ru,
    reports: adminPanelReportsLocales.ru,
    rewardsLog: adminPanelRewardsLogLocales.ru,
    shelters: adminPanelSheltersLocales.ru,
    sheltersCatalog: adminPanelSheltersCatalogLocales.ru,
    blog: adminPanelBlogLocales.ru,
    categories: adminPanelCategoriesLocales.ru,
    telegram: adminPanelTelegramLocales.ru,
    media: adminPanelMediaLocales.ru,
    partners: adminPanelPartnersLocales.ru,
    partnerAds: adminPanelPartnerAdsLocales.ru,
    faq: adminPanelFaqLocales.ru,
    helpSection: adminPanelHelpSectionLocales.ru,
    guidesSection: adminPanelGuidesSectionLocales.ru,
    featureFlags: adminPanelFeatureFlagsLocales.ru,
    settings: adminPanelSettingsLocales.ru,
    instagram: adminPanelInstagramLocales.ru,
    moderation: adminPanelModerationLocales.ru,
  },
  be: {
    sections: adminPanelSectionsLocales.be,
    tabs: adminPanelTabsLocales.be,
    header: adminPanelHeaderLocales.be,
    pagination: adminPanelPaginationLocales.be,
    breedUnknown: adminPanelBreedUnknownLocales.be,
    dashboard: adminPanelDashboardLocales.be,
    toasts: adminPanelToastsLocales.be,
    users: adminPanelUsersLocales.be,
    reports: adminPanelReportsLocales.be,
    rewardsLog: adminPanelRewardsLogLocales.be,
    shelters: adminPanelSheltersLocales.be,
    sheltersCatalog: adminPanelSheltersCatalogLocales.be,
    blog: adminPanelBlogLocales.be,
    categories: adminPanelCategoriesLocales.be,
    telegram: adminPanelTelegramLocales.be,
    media: adminPanelMediaLocales.be,
    partners: adminPanelPartnersLocales.be,
    partnerAds: adminPanelPartnerAdsLocales.be,
    faq: adminPanelFaqLocales.be,
    helpSection: adminPanelHelpSectionLocales.be,
    guidesSection: adminPanelGuidesSectionLocales.be,
    featureFlags: adminPanelFeatureFlagsLocales.be,
    settings: adminPanelSettingsLocales.be,
    instagram: adminPanelInstagramLocales.be,
    moderation: adminPanelModerationLocales.be,
  },
  en: {
    sections: adminPanelSectionsLocales.en,
    tabs: adminPanelTabsLocales.en,
    header: adminPanelHeaderLocales.en,
    pagination: adminPanelPaginationLocales.en,
    breedUnknown: adminPanelBreedUnknownLocales.en,
    dashboard: adminPanelDashboardLocales.en,
    toasts: adminPanelToastsLocales.en,
    users: adminPanelUsersLocales.en,
    reports: adminPanelReportsLocales.en,
    rewardsLog: adminPanelRewardsLogLocales.en,
    shelters: adminPanelSheltersLocales.en,
    sheltersCatalog: adminPanelSheltersCatalogLocales.en,
    blog: adminPanelBlogLocales.en,
    categories: adminPanelCategoriesLocales.en,
    telegram: adminPanelTelegramLocales.en,
    media: adminPanelMediaLocales.en,
    partners: adminPanelPartnersLocales.en,
    partnerAds: adminPanelPartnerAdsLocales.en,
    faq: adminPanelFaqLocales.en,
    helpSection: adminPanelHelpSectionLocales.en,
    guidesSection: adminPanelGuidesSectionLocales.en,
    featureFlags: adminPanelFeatureFlagsLocales.en,
    settings: adminPanelSettingsLocales.en,
    instagram: adminPanelInstagramLocales.en,
    moderation: adminPanelModerationLocales.en,
  },
} as const;

export type AdminPanelLocaleKey = keyof typeof adminPanelLocales;
