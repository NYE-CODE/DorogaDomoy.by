import { Link } from "react-router";
import { ChevronRight, Home, Map, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { useI18n } from "../../../context/I18nContext";
import { trackYmGoal } from "../../../utils/ym";
import {
  landingContainerWide,
  landingHeroY,
  landingOutlineHeroCtaClass,
  landingPrimaryCtaClass,
} from "./landing-section-styles";
import { cn } from "./ui/utils";

type HeroCta = "map" | "create" | "shelterPet";

function trackHeroCtaClick(cta: HeroCta) {
  trackYmGoal("hero_cta_click", { cta });
}

const pathLinks: { key: HeroCta; to: string; icon: typeof Map }[] = [
  { key: "map", to: "/search", icon: Map },
  { key: "create", to: "/create", icon: Plus },
  { key: "shelterPet", to: "/shelters?tab=pets", icon: Home },
];

/** Три пути = три регистра: поиск (rose), действие (бренд-«дорога»), приют (emerald). */
const pathAccent: Record<HeroCta, { chip: string; hoverBorder: string }> = {
  map: {
    chip: "bg-lost-soft text-lost group-hover:bg-lost-soft",
    hoverBorder: "hover:border-lost-border",
  },
  create: {
    chip: "bg-primary/10 text-primary group-hover:bg-primary/15",
    hoverBorder: "hover:border-primary/35",
  },
  shelterPet: {
    chip: "bg-shelter-soft text-shelter group-hover:bg-shelter-soft",
    hoverBorder: "hover:border-shelter-border",
  },
};

export function Hero() {
  const { t } = useI18n();
  const hero = t.landing.hero;
  const pathCopy = [hero.paths.search, hero.paths.create, hero.paths.shelter];

  return (
    <section className={`relative overflow-hidden bg-background ${landingHeroY}`}>
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,color-mix(in_srgb,var(--primary)_14%,transparent),transparent)]"
        aria-hidden
      />

      <div className={cn(landingContainerWide, "relative")}>
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14">
          <div className="text-center lg:text-left">
            <p className="mb-5 inline-flex items-center rounded-full border border-primary/20 bg-primary/8 px-3.5 py-1 text-sm font-medium text-primary">
              {hero.badge}
            </p>

            <h1 className="mb-5 text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem]">
              {hero.title}{" "}
              <span className="text-primary">{hero.titleHighlight}</span>
            </h1>

            <p className="mx-auto mb-8 max-w-xl text-lg leading-relaxed text-muted-foreground lg:mx-0">
              {hero.subtitle}
            </p>

            <div className="relative mx-auto mb-8 max-w-lg overflow-hidden rounded-xl border border-border/70 shadow-lg lg:hidden">
              <img
                src="/hero/search-main.webp"
                alt={hero.imageSearchAlt}
                className="aspect-[16/10] w-full object-cover"
                width={960}
                height={600}
                fetchPriority="high"
                decoding="async"
              />
            </div>

            <div className="mb-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
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

            <ul className="grid gap-3 sm:grid-cols-3">
              {pathLinks.map((path, index) => {
                const Icon = path.icon;
                const copy = pathCopy[index];
                return (
                  <li key={path.key}>
                    <Link
                      to={path.to}
                      onClick={() => trackHeroCtaClick(path.key)}
                      className={cn(
                        "group flex h-full flex-col rounded-xl border border-border/80 bg-card p-4 text-left shadow-sm transition-all duration-200 hover:shadow-md",
                        pathAccent[path.key].hoverBorder,
                      )}
                    >
                      <span
                        className={cn(
                          "mb-3 flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                          pathAccent[path.key].chip,
                        )}
                      >
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <span className="text-sm font-semibold text-foreground">{copy.title}</span>
                      <span className="mt-1 flex-1 text-xs leading-relaxed text-muted-foreground">
                        {copy.desc}
                      </span>
                      <ChevronRight
                        className="mt-3 size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                        aria-hidden
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="relative hidden lg:block">
            <div
              className="pointer-events-none absolute -right-8 top-8 h-56 w-56 rounded-full bg-primary/15 blur-3xl"
              aria-hidden
            />
            <div className="relative ml-auto w-full max-w-[34rem]">
              <div className="overflow-hidden rounded-2xl border border-border/70 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.35)]">
                <img
                  src="/hero/shelters-main.webp"
                  alt={hero.imageShelterAlt}
                  className="aspect-[5/6] w-full object-cover"
                  width={800}
                  height={960}
                  loading="eager"
                  decoding="async"
                />
              </div>
              <div className="absolute -bottom-8 -left-10 w-[72%] overflow-hidden rounded-2xl border-4 border-background shadow-xl">
                <img
                  src="/hero/search-main.webp"
                  alt={hero.imageSearchAlt}
                  className="aspect-[4/3] w-full object-cover"
                  width={640}
                  height={480}
                  fetchPriority="high"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
