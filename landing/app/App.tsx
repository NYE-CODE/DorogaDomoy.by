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
import { useFeatureFlags } from "../../context/FeatureFlagsContext";

/** Условные секции должны совпадать с `landing-nav-config.ts` (навигация в футере). */

export default function App() {
  const {
    ff_landing_show_help,
    ff_landing_show_stats,
    ff_landing_show_pets_feature,
    ff_landing_show_faq,
  } = useFeatureFlags();
  return (
    <div className="min-h-screen overflow-x-clip">
      <Header showCitySelector={false} />
      <Hero />
      {ff_landing_show_stats && <Stats />}
      <HowItWorks />
      {ff_landing_show_pets_feature && <PetsFeature />}
      <Announcements />
      <WhyUs />
      <Media />
      <Partners />
      {ff_landing_show_help && <Help />}
      {ff_landing_show_faq && <FAQ />}
      <Footer />
    </div>
  );
}
