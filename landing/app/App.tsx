import { Header } from "./components/header";
import { Hero } from "./components/hero";
import { HowItWorks } from "./components/how-it-works";
import { Announcements } from "./components/announcements";
import { WhyUs } from "./components/why-us";
import { Media } from "./components/media";
import { Partners } from "./components/partners";
import { FAQ } from "./components/faq";
import { Help } from "./components/help";
import { Footer } from "./components/footer";
import { useFeatureFlags } from "../../context/FeatureFlagsContext";

export default function App() {
  const { ff_landing_show_help } = useFeatureFlags();
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <HowItWorks />
      <Announcements />
      <WhyUs />
      <Media />
      <Partners />
      <FAQ />
      {ff_landing_show_help && <Help />}
      <Footer />
    </div>
  );
}
