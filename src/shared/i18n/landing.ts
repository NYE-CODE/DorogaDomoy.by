/** Landing page strings (ru / be / en) — композиция из модулей landing/*. */
import { landingHeroLocales } from './landing/hero';
import { landingMediaLocales } from './landing/media';
import { landingPartnersLocales } from './landing/partners';
import { landingFaqLocales } from './landing/faq';
import { landingHelpLocales } from './landing/help';
import { landingPetsFeatureLocales } from './landing/petsFeature';
import { landingAnnouncementsLocales } from './landing/announcements';
import { landingShelterPetsLocales } from './landing/shelterPets';
import { landingBlogLocales } from './landing/blog';
import { landingSheltersLocales } from './landing/shelters';
import { landingHeaderLocales } from './landing/header';
import { landingFooterLocales } from './landing/footer';
import { landingMobileAppLocales } from './landing/mobileApp';
import { landingPetsNearbyLocales } from './landing/petsNearby';
import { landingHowItWorksLocales } from './landing/howItWorks';

export const landingLocales = {
  ru: {
    hero: landingHeroLocales.ru,
    media: landingMediaLocales.ru,
    partners: landingPartnersLocales.ru,
    faq: landingFaqLocales.ru,
    help: landingHelpLocales.ru,
    petsFeature: landingPetsFeatureLocales.ru,
    petsNearby: landingPetsNearbyLocales.ru,
    howItWorks: landingHowItWorksLocales.ru,
    mobileApp: landingMobileAppLocales.ru,
    announcements: landingAnnouncementsLocales.ru,
    shelterPets: landingShelterPetsLocales.ru,
    blog: landingBlogLocales.ru,
    shelters: landingSheltersLocales.ru,
    header: landingHeaderLocales.ru,
    footer: landingFooterLocales.ru,
  },
  be: {
    hero: landingHeroLocales.be,
    media: landingMediaLocales.be,
    partners: landingPartnersLocales.be,
    faq: landingFaqLocales.be,
    help: landingHelpLocales.be,
    petsFeature: landingPetsFeatureLocales.be,
    petsNearby: landingPetsNearbyLocales.be,
    howItWorks: landingHowItWorksLocales.be,
    mobileApp: landingMobileAppLocales.be,
    announcements: landingAnnouncementsLocales.be,
    shelterPets: landingShelterPetsLocales.be,
    blog: landingBlogLocales.be,
    shelters: landingSheltersLocales.be,
    header: landingHeaderLocales.be,
    footer: landingFooterLocales.be,
  },
  en: {
    hero: landingHeroLocales.en,
    media: landingMediaLocales.en,
    partners: landingPartnersLocales.en,
    faq: landingFaqLocales.en,
    help: landingHelpLocales.en,
    petsFeature: landingPetsFeatureLocales.en,
    petsNearby: landingPetsNearbyLocales.en,
    howItWorks: landingHowItWorksLocales.en,
    mobileApp: landingMobileAppLocales.en,
    announcements: landingAnnouncementsLocales.en,
    shelterPets: landingShelterPetsLocales.en,
    blog: landingBlogLocales.en,
    shelters: landingSheltersLocales.en,
    header: landingHeaderLocales.en,
    footer: landingFooterLocales.en,
  },
} as const;
