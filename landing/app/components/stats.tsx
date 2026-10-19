import { useEffect, useState } from "react";

import { petsApi } from "../../../api/client";
import { useI18n } from "../../../context/I18nContext";
import {
  landingContainerWide,
  landingMuted,
  landingSectionBase,
  landingSectionYTight,
} from "./landing-section-styles";
import { cn } from "./ui/utils";

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

  const searchItems = [
    {
      key: "active",
      value:
        stats
          ? ((stats.searching ?? 0) + (stats.found ?? 0)).toLocaleString("ru")
          : "—",
      label: t.landing.help.statsActiveAds,
    },
    {
      key: "users",
      value:
        stats && stats.users_count != null
          ? stats.users_count.toLocaleString("ru")
          : "—",
      label: t.landing.help.statsUsers,
    },
    {
      key: "cities",
      value: stats ? (stats.cities_count ?? 0).toLocaleString("ru") : "—",
      label: t.landing.help.statsCities,
    },
    {
      key: "success",
      value: stats ? (stats.found_pets ?? 0).toLocaleString("ru") : "—",
      label: t.landing.help.statsSuccess,
    },
  ];

  return (
    <section
      id="stats"
      aria-label={t.landing.help.statsTitle}
      className={cn(landingSectionBase, landingSectionYTight, "shrink-0")}
    >
      <div className={landingContainerWide}>
        <ul className="grid list-none grid-cols-2 gap-8 p-0 sm:grid-cols-4 sm:gap-6 lg:gap-10">
          {searchItems.map((item) => (
            <li key={item.key} className="flex flex-col items-center text-center">
              <div className="font-display text-3xl font-bold leading-none tracking-tight text-landing-dark sm:text-4xl">
                {item.value}
              </div>
              <div className={cn(landingMuted, "mt-2 leading-snug")}>{item.label}</div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
