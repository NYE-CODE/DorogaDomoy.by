import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Button } from "./ui/button";
import { petsApi } from "../../../api/client";
import { useI18n } from "../../../context/I18nContext";
import { useFeatureFlags } from "../../context/FeatureFlagsContext";

export function Hero() {
  const { t } = useI18n();
  const { ff_landing_show_stats } = useFeatureFlags();
  const [stats, setStats] = useState<{ searching: number; found: number; fostering: number } | null>(null);

  useEffect(() => {
    petsApi
      .statistics()
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  const total = stats ? stats.searching + stats.found + stats.fostering : 0;
  const statText = ff_landing_show_stats && total > 0
    ? `${t.landing.hero.statsPrefix} ${total.toLocaleString("ru")} ${t.landing.hero.statsSuffix}`
    : null;

  return (
    <section className="bg-background py-20 md:py-32 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="text-center md:text-left z-10">
            <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
              {t.landing.hero.title1} <br />
              {t.landing.hero.your}<span className="relative inline-block">
                {t.landing.hero.title2}
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 10" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 5 Q50 0, 100 5 T200 5" stroke="#FDB913" strokeWidth="8" fill="none"/>
                </svg>
              </span> {t.landing.hero.title3}
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-xl">
              {t.landing.hero.subtitle} {statText}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Button asChild>
                <Link to="/create" className="bg-primary text-primary-foreground hover:opacity-90 rounded-lg px-8 py-6 text-lg shadow-lg inline-flex items-center justify-center">
                  {t.landing.hero.createAd}
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/search" className="border-2 border-foreground bg-background text-foreground hover:bg-muted rounded-lg px-8 py-6 text-lg inline-flex items-center justify-center">
                  {t.landing.hero.viewMap}
                </Link>
              </Button>
            </div>
          </div>
          <div className="relative hidden md:block">
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-[#FDB913] rounded-full opacity-20 blur-3xl"></div>
            <img 
              src="https://images.unsplash.com/photo-1509205477838-a534e43a849f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMGRvZyUyMGNhdCUyMHBldHMlMjBob21lfGVufDF8fHx8MTc3MzY1ODM5MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt={t.landing.hero.petsAlt} 
              className="w-full h-auto relative z-10 rounded-2xl shadow-xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}