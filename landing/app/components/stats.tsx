import { useEffect, useState } from "react";
import { MapPin, PawPrint, TrendingUp, Users } from "lucide-react";

import { petsApi } from "../../../api/client";
import { useI18n } from "../../../context/I18nContext";
import { petScenarioStatsIconClass } from "@/shared/lib/pet-scenario-colors";
import {
  landingContainerWide,
  landingH2,
  landingIconChip,
  landingIconChipPrimary,
  landingPanel,
  landingSectionBase,
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

  const statsTitle =
    (t.landing.help as { statsTitle?: string }).statsTitle ?? "В цифрах";

  const searchItems = [
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
      iconClass: landingIconChipPrimary,
    },
    {
      key: "users",
      icon: Users,
      value:
        stats && stats.users_count != null
          ? stats.users_count.toLocaleString("ru")
          : "50,000+",
      label: t.landing.help.statsUsers,
      iconClass: landingIconChip,
    },
    {
      key: "cities",
      icon: MapPin,
      value: stats ? (stats.cities_count ?? 0).toLocaleString("ru") : "200+",
      label: t.landing.help.statsCities,
      iconClass: landingIconChip,
    },
    {
      key: "success",
      icon: TrendingUp,
      value: stats ? (stats.found_pets ?? 0).toLocaleString("ru") : "0",
      label: t.landing.help.statsSuccess,
      iconClass: cn(landingIconChip, petScenarioStatsIconClass.found),
    },
  ];

  return (
    <section id="stats" className={cn(landingSectionBase, "pb-8 md:pb-12")}>
      <div className={landingContainerWide}>
        <h2 className={cn(landingH2, "mb-5 md:mb-6")}>{statsTitle}</h2>

        <div className={cn(landingPanel, "grid grid-cols-2 sm:grid-cols-4")}>
          {searchItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                className={cn(
                  "flex flex-col gap-3 border-border p-4 sm:p-5",
                  index > 0 && "border-t sm:border-t-0 sm:border-l",
                  index >= 2 && "border-t sm:border-t-0",
                )}
              >
                <span className={item.iconClass}>
                  <Icon size={18} aria-hidden />
                </span>
                <div>
                  <div className="text-2xl font-bold leading-none text-foreground sm:text-3xl">
                    {item.value}
                  </div>
                  <div className="mt-1.5 text-xs leading-snug text-muted-foreground sm:text-sm">
                    {item.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
