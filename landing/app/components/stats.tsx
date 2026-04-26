import { useEffect, useState } from "react";
import { MapPin, PawPrint, TrendingUp, Users } from "lucide-react";

import { petsApi } from "../../../api/client";
import { useI18n } from "../../../context/I18nContext";
import { landingContainerWide, landingH2 } from "./landing-section-styles";

interface StatsResponse {
  searching: number;
  found: number;
  found_pets?: number;
  cities_count?: number;
  users_count?: number;
}

export function Stats() {
  const { t } = useI18n();
  const [stats, setStats] = useState<StatsResponse | null>(null);

  useEffect(() => {
    petsApi.statistics().then(setStats).catch(() => setStats(null));
  }, []);

  const items = [
    {
      key: "active",
      icon: PawPrint,
      value:
        stats
          ? ((stats.searching ?? 0) + (stats.found ?? 0)).toLocaleString("ru")
          : "0",
      label:
        (t.landing.help as { statsActiveAds?: string }).statsActiveAds ??
        "Активных объявлений",
      iconClass:
        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    },
    {
      key: "users",
      icon: Users,
      value:
        stats && stats.users_count != null
          ? stats.users_count.toLocaleString("ru")
          : "50,000+",
      label: t.landing.help.statsUsers,
      iconClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    },
    {
      key: "cities",
      icon: MapPin,
      value: stats ? (stats.cities_count ?? 0).toLocaleString("ru") : "200+",
      label: t.landing.help.statsCities,
      iconClass:
        "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
    },
    {
      key: "success",
      icon: TrendingUp,
      value: stats ? (stats.found_pets ?? 0).toLocaleString("ru") : "0",
      label: t.landing.help.statsSuccess,
      iconClass:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    },
  ];

  return (
    <section id="stats" className="relative z-10 -mt-10 pb-8 md:-mt-14 md:pb-12 scroll-mt-24">
      <div className={landingContainerWide}>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-lg sm:p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2 md:gap-6 mb-5 md:mb-7">
            <h2 className={`${landingH2} mb-0 text-left`}>
              {(t.landing.help as { statsTitle?: string }).statsTitle ?? "В цифрах"}
            </h2>
            <p className="text-sm md:text-base text-muted-foreground">
              {(t.landing.help as { subtitle?: string }).subtitle ?? "Каждое объявление помогает вернуть питомца домой."}
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.key}
                  className="rounded-xl md:rounded-2xl border border-border bg-background p-3 sm:p-4 md:p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground leading-none truncate">
                        {item.value}
                      </div>
                      <div className="mt-2 text-xs sm:text-sm text-muted-foreground leading-tight">
                        {item.label}
                      </div>
                    </div>
                    <div
                      className={`shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg ${item.iconClass}`}
                    >
                      <Icon size={18} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
