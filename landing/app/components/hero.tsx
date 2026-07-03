import { Link } from "react-router";
import { Home, Map, Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "./ui/button";
import { useI18n } from "../../../context/I18nContext";
import { trackYmGoal } from "../../../utils/ym";
import {
  landingCell,
  landingContainerWide,
  landingHeroY,
  landingOutlineHeroCtaClass,
  landingPathAccentBorder,
  landingPrimaryCtaClass,
} from "./landing-section-styles";
import { typoH1, typoLead } from "@/shared/styles/typography-classes";
import { cn } from "./ui/utils";

type HeroCta = "map" | "create" | "shelterPet";

function trackHeroCtaClick(cta: HeroCta) {
  trackYmGoal("hero_cta_click", { cta });
}

const pathLinks: { key: HeroCta; to: string; icon: LucideIcon }[] = [
  { key: "map", to: "/search", icon: Map },
  { key: "create", to: "/create", icon: Plus },
  { key: "shelterPet", to: "/shelters?tab=pets", icon: Home },
];

const pathAccentBorder: Record<HeroCta, string> = {
  map: landingPathAccentBorder.lost,
  create: landingPathAccentBorder.primary,
  shelterPet: landingPathAccentBorder.shelter,
};

export function Hero() {
  const { t } = useI18n();
  const hero = t.landing.hero;
  const pathCopy = [hero.paths.search, hero.paths.create, hero.paths.shelter];

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

            <div className="flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Button asChild>
                <Link
                  to="/search"
                  className={landingPrimaryCtaClass}
                  onClick={() => trackHeroCtaClick("map")}
                >
                  <Map className="size-5 shrink-0" aria-hidden />
                  {hero.primaryCta}
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link
                  to="/create"
                  className={landingOutlineHeroCtaClass}
                  onClick={() => trackHeroCtaClick("create")}
                >
                  <Plus className="size-5 shrink-0" aria-hidden />
                  {hero.secondaryCta}
                </Link>
              </Button>
            </div>

            <nav className="mx-auto w-full max-w-xl lg:mx-0" aria-labelledby="landing-hero-heading">
              <ul className="grid overflow-hidden rounded-lg border border-border bg-card sm:grid-cols-3">
                {pathLinks.map((path, index) => {
                  const Icon = path.icon;
                  const copy = pathCopy[index];
                  return (
                    <li
                      key={path.key}
                      className="border-b border-border last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"
                    >
                      <Link
                        to={path.to}
                        onClick={() => trackHeroCtaClick(path.key)}
                        className={cn(
                          landingCell,
                          "flex h-full min-h-[44px] flex-col justify-center gap-1 border-l-[3px] px-4 py-3 text-left sm:border-l-0 sm:border-t-[3px]",
                          pathAccentBorder[path.key],
                        )}
                      >
                        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          <Icon className="size-4 shrink-0 opacity-70" aria-hidden />
                          {copy.title}
                        </span>
                        <span className="hidden text-xs leading-snug text-muted-foreground sm:block">
                          {copy.desc}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          <div className="mx-auto w-full max-w-md lg:max-w-none">
            <div className="overflow-hidden rounded-lg border border-border shadow-md">
              <img
                src="/hero/search-main.webp"
                alt={hero.imageSearchAlt}
                className="aspect-[4/3] w-full object-cover lg:aspect-[5/4]"
                width={960}
                height={720}
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
