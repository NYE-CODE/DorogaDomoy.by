import { useEffect, useState } from "react";
import { Heart, Share2, DollarSign, Users } from "lucide-react";
import { Button } from "./ui/button";
import { petsApi } from "../../../api/client";
import { useI18n } from "../../../context/I18nContext";
import { useFeatureFlags } from "../../context/FeatureFlagsContext";

export function Help() {
  const { t } = useI18n();
  const { ff_landing_show_help, ff_landing_show_stats } = useFeatureFlags();
  const [stats, setStats] = useState<{
    found_pets?: number;
    cities_count?: number;
    success_rate?: number | null;
    users_count?: number;
    searching?: number;
    found?: number;
  } | null>(null);

  useEffect(() => {
    petsApi.statistics().then(setStats).catch(() => setStats(null));
  }, []);
  const ways = t.landing.help.ways;

  return (
    <section id="help" className="py-20 md:py-32 bg-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {ff_landing_show_help && (
          <>
            <div className="text-center mb-12 md:mb-20">
              <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold text-foreground mb-4 md:mb-6">
                {t.landing.help.title}
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {t.landing.help.subtitle}
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
              {([Share2, Users, Heart, DollarSign] as const).map((Icon, index) => (
                <div
                  key={index}
                  className="bg-card rounded-3xl p-8 text-center shadow-md hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                  <div className="w-16 h-16 bg-primary rounded-2xl mx-auto mb-6 flex items-center justify-center">
                    <Icon size={32} className="text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-4">{ways[index].title}</h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed flex-grow">{ways[index].desc}</p>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg w-full text-lg mt-auto">
                    {ways[index].action}
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Stats — показывается независимо от ff_landing_show_help */}
        {ff_landing_show_stats && (
        <>
        {!ff_landing_show_help && (
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
              {(t.landing.help as { statsTitle?: string }).statsTitle ?? 'В цифрах'}
            </h2>
          </div>
        )}
        <div className="bg-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 shadow-xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 text-center">
            <div className="min-w-0">
              <div className="text-2xl sm:text-3xl md:text-5xl font-bold text-foreground mb-1 sm:mb-2 truncate">
                {stats ? (stats.found_pets ?? 0).toLocaleString("ru") : "10,000+"}
              </div>
              <div className="text-xs sm:text-sm md:text-base text-muted-foreground leading-tight">{t.landing.help.statsFound}</div>
            </div>
            <div className="min-w-0">
              <div className="text-2xl sm:text-3xl md:text-5xl font-bold text-foreground mb-1 sm:mb-2 truncate">
                {stats && stats.users_count != null ? stats.users_count.toLocaleString("ru") : "50,000+"}
              </div>
              <div className="text-xs sm:text-sm md:text-base text-muted-foreground leading-tight">{t.landing.help.statsUsers}</div>
            </div>
            <div className="min-w-0">
              <div className="text-2xl sm:text-3xl md:text-5xl font-bold text-foreground mb-1 sm:mb-2 truncate">
                {stats ? (stats.cities_count ?? 0).toLocaleString("ru") : "200+"}
              </div>
              <div className="text-xs sm:text-sm md:text-base text-muted-foreground leading-tight">{t.landing.help.statsCities}</div>
            </div>
            <div className="min-w-0">
              <div className="text-2xl sm:text-3xl md:text-5xl font-bold text-foreground mb-1 sm:mb-2 truncate">
                {stats && stats.success_rate != null ? `${stats.success_rate}%` : "—"}
              </div>
              <div className="text-xs sm:text-sm md:text-base text-muted-foreground leading-tight">{t.landing.help.statsSuccess}</div>
            </div>
          </div>
        </div>
        </>
        )}
      </div>
    </section>
  );
}