import { Header } from "./components/header";
import { Hero } from "./components/hero";
import { Stats } from "./components/stats";
import { PetsFeature } from "./components/pets-feature";
import { Announcements } from "./components/announcements";
import { ShelterPets } from "./components/shelter-pets";
import { Media } from "./components/media";
import { Partners } from "./components/partners";
import { FAQ } from "./components/faq";
import { LandingClose } from "./components/landing-close";
import { Footer } from "./components/footer";
import { ScrollToTop } from "./components/scroll-to-top";
import { useFeatureFlags } from "../../context/FeatureFlagsContext";
import { PartnerAdSlot } from "@/features/partner-ads/PartnerAdSlot";

/** Условные секции должны совпадать с `landing-nav-config.ts` (навигация в футере). */
export default function App() {
  const {
    ff_landing_show_stats,
    ff_landing_show_pets_feature,
    ff_landing_show_faq,
  } = useFeatureFlags();

  return (
    <div className="min-h-screen overflow-x-clip">
      <Header showCitySelector={false} compactActions />
      <main id="main-content" tabIndex={-1} className="outline-none">
        <Hero />
        <Announcements />
        <ShelterPets />
        {ff_landing_show_stats && <Stats />}
        {ff_landing_show_pets_feature && <PetsFeature />}
        <div className="page-container px-4 py-2 sm:px-6">
          <PartnerAdSlot placement="landing-strip" />
        </div>
        <Media />
        <Partners />
        {ff_landing_show_faq && <FAQ />}
        <LandingClose />
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
