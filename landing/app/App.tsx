import { Header } from "./components/header";
import { Hero } from "./components/hero";
import { Stats } from "./components/stats";
import { HowItWorks } from "./components/how-it-works";
import { PetsFeature } from "./components/pets-feature";
import { Announcements } from "./components/announcements";
import { WhyUs } from "./components/why-us";
import { Media } from "./components/media";
import { Partners } from "./components/partners";
import { FAQ } from "./components/faq";
import { Help } from "./components/help";
import { Footer } from "./components/footer";
import { ScrollToTop } from "./components/scroll-to-top";
import { useFeatureFlags } from "../../context/FeatureFlagsContext";
import { useEffect, useRef, useState } from "react";
import { trackYmGoal } from "../../utils/ym";
import { HOME_MODE_STORAGE_KEY } from "../../utils/home-route";

/** Условные секции должны совпадать с `landing-nav-config.ts` (навигация в футере). */
export type HomeMode = "search" | "shelters";

function trackModeSelected(mode: HomeMode) {
  trackYmGoal("mode_selected", { mode });
}

export default function App() {
  const {
    ff_landing_show_help,
    ff_landing_show_stats,
    ff_landing_show_pets_feature,
    ff_landing_show_faq,
  } = useFeatureFlags();
  const [homeMode, setHomeMode] = useState<HomeMode>(() => {
    if (typeof window === "undefined") return "search";
    const saved = window.localStorage.getItem(HOME_MODE_STORAGE_KEY);
    return saved === "shelters" ? "shelters" : "search";
  });
  const didMountRef = useRef(false);

  useEffect(() => {
    window.localStorage.setItem(HOME_MODE_STORAGE_KEY, homeMode);
  }, [homeMode]);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    trackModeSelected(homeMode);
  }, [homeMode]);

  return (
    <div className="min-h-screen overflow-x-clip">
      <Header
        showCitySelector={false}
        showHomeModeToggle
        homeMode={homeMode}
        onHomeModeChange={setHomeMode}
      />
      <Hero mode={homeMode} />
      {ff_landing_show_stats && <Stats mode={homeMode} />}
      <HowItWorks mode={homeMode} />
      {ff_landing_show_pets_feature && homeMode === "search" && <PetsFeature />}
      <Announcements mode={homeMode} />
      <WhyUs />
      <Media />
      <Partners />
      {ff_landing_show_help && <Help />}
      {ff_landing_show_faq && <FAQ />}
      <Footer />
      <ScrollToTop />
    </div>
  );
}
