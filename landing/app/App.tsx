import { Header } from "./components/header";
import { Hero } from "./components/hero";
import { Stats } from "./components/stats";
import { PetsFeature } from "./components/pets-feature";
import { ShelterPets } from "./components/shelter-pets";
import { PetsNearby } from "./components/pets-nearby";
import { HowItWorks } from "./components/how-it-works";
import { Media } from "./components/media";
import { Partners } from "./components/partners";
import { FAQ } from "./components/faq";
import { MobileApp } from "./components/mobile-app";
import { Footer } from "./components/footer";
import { ScrollToTop } from "./components/scroll-to-top";
import { useFeatureFlags } from "@/app/providers/FeatureFlagsContext";
import { PartnerAdSlot } from "@/features/partner-ads/PartnerAdSlot";
import { cn } from "./components/ui/utils";

/** Условные секции должны совпадать с `landing-nav-config.ts` (навигация в футере). */
export default function App() {
  const {
    flagsReady,
    ff_landing_show_stats,
    ff_landing_show_pets_feature,
    ff_landing_show_faq,
    ff_landing_show_mobile_app,
  } = useFeatureFlags();

  return (
    <div
      className={cn(
        "min-h-screen overflow-x-clip",
        /* Высота шапки для первого экрана (hero + stats) */
        "[--landing-header-h:4.5rem] md:[--landing-header-h:5.75rem]",
      )}
    >
      <Header showCitySelector={false} compactActions />
      <main id="main-content" tabIndex={-1} className="outline-none">
        {/* Первый экран: hero (+ stats, если включена) на всю высоту viewport */}
        <div className="flex min-h-[calc(100dvh-var(--landing-header-h))] flex-col">
          <Hero />
          {flagsReady && ff_landing_show_stats && <Stats />}
        </div>
        <PetsNearby />
        <HowItWorks />
        <ShelterPets />
        {flagsReady && ff_landing_show_pets_feature && <PetsFeature />}
        {flagsReady && ff_landing_show_mobile_app && <MobileApp />}
        <Media />
        <Partners />
        <div className="page-container px-4 py-2 sm:px-6">
          <PartnerAdSlot placement="landing-strip" />
        </div>
        {flagsReady && ff_landing_show_faq && <FAQ />}
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
