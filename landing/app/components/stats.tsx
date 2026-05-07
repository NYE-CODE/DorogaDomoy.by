import { useEffect, useState } from "react";
import { Building2, Heart, MapPin, PawPrint, TrendingUp, Users } from "lucide-react";

import { petsApi, sheltersApi } from "../../../api/client";
import { useI18n } from "../../../context/I18nContext";
import { landingContainerWide, landingH2 } from "./landing-section-styles";
import type { HomeMode } from "../App";

interface StatsResponse {
  searching: number;
  found: number;
  found_pets?: number;
  cities_count?: number;
  users_count?: number;
}

interface ShelterStats {
  sheltersCount: number;
  shelterPetsCount: number;
  citiesCount: number;
  adoptedCount: number;
}

export function Stats({ mode = "search" }: { mode?: HomeMode }) {
  const { t } = useI18n();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [shelterStats, setShelterStats] = useState<ShelterStats | null>(null);
  const isSheltersMode = mode === "shelters";

  useEffect(() => {
    if (isSheltersMode) {
      Promise.all([
        sheltersApi.list(),
        petsApi.list({
          pet_scope: "shelter_pet",
          moderation_status: "approved",
          is_archived: false,
          limit: 500,
        }),
      ])
        .then(([shelters, pets]) => {
          const cities = new Set(
            shelters
              .map((s) => (s.city ?? "").trim().toLowerCase())
              .filter(Boolean),
          );
          const adoptedCount = pets.filter((p) => p.adoptionStatus === "adopted").length;
          setShelterStats({
            sheltersCount: shelters.length,
            shelterPetsCount: pets.length,
            citiesCount: cities.size,
            adoptedCount,
          });
          setStats(null);
        })
        .catch(() => {
          setShelterStats({
            sheltersCount: 0,
            shelterPetsCount: 0,
            citiesCount: 0,
            adoptedCount: 0,
          });
        });
      return;
    }

    petsApi.statistics().then(setStats).catch(() => setStats(null));
    setShelterStats(null);
  }, [isSheltersMode]);

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
  const sheltersItems = [
    {
      key: "shelters",
      icon: Building2,
      value: shelterStats ? shelterStats.sheltersCount.toLocaleString("ru") : "0",
      label: "Организаций на платформе",
      iconClass:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    },
    {
      key: "pets",
      icon: PawPrint,
      value: shelterStats ? shelterStats.shelterPetsCount.toLocaleString("ru") : "0",
      label: "Питомцев из приютов",
      iconClass:
        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    },
    {
      key: "cities",
      icon: MapPin,
      value: shelterStats ? shelterStats.citiesCount.toLocaleString("ru") : "0",
      label: "Городов с приютами",
      iconClass:
        "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
    },
    {
      key: "adopted",
      icon: Heart,
      value: shelterStats ? shelterStats.adoptedCount.toLocaleString("ru") : "0",
      label: "Нашли дом",
      iconClass:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    },
  ];
  const items = isSheltersMode ? sheltersItems : searchItems;

  return (
    <section id="stats" className="relative z-10 -mt-10 pb-8 md:-mt-14 md:pb-12 scroll-mt-24">
      <div className={landingContainerWide}>
        <div className="mb-5 md:mb-7">
          <h2 className={`${landingH2} mb-0 text-left`}>
            {(t.landing.help as { statsTitle?: string }).statsTitle ?? "В цифрах"}
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                className="rounded-xl md:rounded-2xl border border-border bg-card p-3 sm:p-4 md:p-5 shadow-sm"
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
    </section>
  );
}
