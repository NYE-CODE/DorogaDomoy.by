import { Link } from "react-router";
import { Map, Plus } from "lucide-react";
import { useI18n } from "../../../context/I18nContext";
import { trackYmGoal } from "../../../utils/ym";
import {
  landingContainerWide,
  landingHeroY,
  landingOutlineHeroCtaClass,
  landingPrimaryCtaClass,
} from "./landing-section-styles";
import { typoH1, typoLead } from "@/shared/styles/typography-classes";
import { cn } from "./ui/utils";

type HeroCta = "map" | "create" | "shelterPet";

function trackHeroCtaClick(cta: HeroCta) {
  trackYmGoal("hero_cta_click", { cta });
}

export function Hero() {
  const { t } = useI18n();
  const hero = t.landing.hero;

  return (
    <section className={cn("bg-background", landingHeroY)}>
      <div className={landingContainerWide}>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col gap-6 text-center lg:gap-7 lg:text-left">
            <div className="space-y-4">
              <h1 id="landing-hero-heading" className={cn(typoH1, "text-balance")}>
                {hero.title}{" "}
                <span className="text-primary">{hero.titleHighlight}</span>
              </h1>
              <p className={cn(typoLead, "mx-auto max-w-lg text-balance lg:mx-0")}>
                {hero.subtitle}
              </p>
            </div>

            <div className="mx-auto flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:mx-0">
              <Link
                to="/search"
                onClick={() => trackHeroCtaClick("map")}
                className={cn(landingPrimaryCtaClass, "inline-flex w-full justify-center gap-2 sm:w-auto")}
              >
                <Map className="size-5 shrink-0" aria-hidden />
                {hero.primaryCta}
              </Link>
              <Link
                to="/create"
                onClick={() => trackHeroCtaClick("create")}
                className={cn(landingOutlineHeroCtaClass, "inline-flex w-full justify-center gap-2 sm:w-auto")}
              >
                <Plus className="size-5 shrink-0" aria-hidden />
                {hero.secondaryCta}
              </Link>
            </div>

            <p className="text-center text-sm text-muted-foreground lg:text-left">
              <Link
                to="/shelters?tab=pets"
                onClick={() => trackHeroCtaClick("shelterPet")}
                className="font-medium text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
              >
                {hero.paths.shelter.title}
              </Link>
              <span className="text-muted-foreground"> — {hero.paths.shelter.desc}</span>
            </p>
          </div>

          <div className="mx-auto w-full max-w-md lg:max-w-none">
            <div className="overflow-hidden rounded-2xl border-2 border-medallion-border bg-medallion-soft/40 shadow-md">
              <img
                src="/hero/search-main.webp"
                alt={hero.imageSearchAlt}
                className="aspect-[4/3] w-full object-cover lg:aspect-[5/4]"
                width={1200}
                height={800}
                fetchPriority="high"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
