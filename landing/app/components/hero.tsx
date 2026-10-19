import { Link } from "react-router";
import { Map, Plus } from "lucide-react";
import { useI18n } from "../../../context/I18nContext";
import { trackYmGoal } from "../../../utils/ym";
import { LandingCta } from "./landing-cta";
import { landingContainerWide } from "./landing-section-styles";
import { typoH1, typoLead } from "@/shared/styles/typography-classes";
import { saveSearchLayoutMode } from "@/shared/lib/home-route";
import { cn } from "./ui/utils";

type HeroCta = "map" | "create" | "shelterPet";

function trackHeroCtaClick(cta: HeroCta) {
  trackYmGoal("hero_cta_click", { cta });
}

export function Hero() {
  const { t } = useI18n();
  const hero = t.landing.hero;

  return (
    <section className="relative isolate flex min-h-0 flex-1 flex-col bg-background">
      <span className="sr-only">{hero.imageSearchAlt}</span>

      {/*
        Desktop: фото только в правой половине — иначе full-bleed cover
        на коротком широком hero неизбежно срезает лица.
      */}
      <div
        className="pointer-events-none absolute inset-y-0 left-[42%] right-0 z-0 hidden overflow-hidden lg:block"
        aria-hidden
      >
        <img
          src="/hero/search-main.webp"
          alt=""
          className="size-full object-cover object-[38%_24%]"
          width={1200}
          height={800}
          fetchPriority="high"
          decoding="async"
        />
        <div className="absolute inset-y-0 left-0 w-[28%] bg-gradient-to-r from-background to-transparent" />
      </div>

      {/* Mobile: фото фоном под матовым wash */}
      <div
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden lg:hidden"
        aria-hidden
      >
        <img
          src="/hero/search-main.webp"
          alt=""
          className="size-full object-cover object-[45%_28%]"
          width={1200}
          height={800}
          fetchPriority="high"
          decoding="async"
        />
        <div
          className={cn(
            "absolute inset-0",
            "bg-gradient-to-b from-background from-0% via-background/96 via-[48%] to-background/82",
            "dark:from-background/88 dark:via-background/55 dark:to-background/35",
          )}
        />
      </div>

      <div
        className={cn(
          landingContainerWide,
          "relative z-10 flex flex-1 items-center py-10 md:py-14 lg:py-16",
        )}
      >
        <div
          className={cn(
            "flex w-full max-w-xl flex-col gap-6 text-left sm:gap-7 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none lg:pr-6",
            "rounded-2xl bg-background/92 p-5 shadow-card backdrop-blur-sm",
            "dark:bg-transparent dark:p-0 dark:shadow-none dark:backdrop-blur-none",
          )}
        >
          <div className="space-y-3 sm:space-y-4">
            <h1
              id="landing-hero-heading"
              className={cn(typoH1, "text-balance text-foreground")}
            >
              {hero.title}{" "}
              <span className="text-primary">{hero.titleHighlight}</span>
            </h1>
            <p
              className={cn(
                typoLead,
                "max-w-lg text-balance text-secondary-foreground dark:text-muted-foreground",
              )}
            >
              {hero.subtitle}
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
            <LandingCta
              to="/search"
              onClick={() => {
                saveSearchLayoutMode("map");
                trackHeroCtaClick("map");
              }}
              className="w-full sm:w-auto"
            >
              <Map className="size-5 shrink-0" aria-hidden />
              {hero.primaryCta}
            </LandingCta>
            <LandingCta
              to="/create"
              variant="outline"
              onClick={() => trackHeroCtaClick("create")}
              className="w-full sm:w-auto"
            >
              <Plus className="size-5 shrink-0" aria-hidden />
              {hero.secondaryCta}
            </LandingCta>
          </div>

          <p className="text-sm text-secondary-foreground dark:text-muted-foreground">
            <Link
              to="/shelters?tab=pets"
              onClick={() => trackHeroCtaClick("shelterPet")}
              className="font-medium text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
              {hero.paths.shelter.title}
            </Link>
            <span> — {hero.paths.shelter.desc}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
