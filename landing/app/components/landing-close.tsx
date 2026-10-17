import { Link } from "react-router";
import { Map } from "lucide-react";
import { useI18n } from "../../../context/I18nContext";
import { trackYmGoal } from "../../../utils/ym";
import {
  landingContainerWide,
  landingPrimaryCtaClass,
  landingSectionY,
} from "./landing-section-styles";
import { cn } from "./ui/utils";

/** Финал лендинга: повтор заголовка и один primary CTA на карту. */
export function LandingClose() {
  const { t } = useI18n();
  const hero = t.landing.hero;

  return (
    <section
      aria-labelledby="landing-close-heading"
      className={cn("border-t border-border bg-muted/20", landingSectionY)}
    >
      <div className={cn(landingContainerWide, "flex flex-col items-center gap-5 text-center")}>
        <div className="space-y-2">
          <h2 id="landing-close-heading" className="typo-h2 text-balance">
            {hero.title}{" "}
            <span className="text-primary">{hero.titleHighlight}</span>
          </h2>
          <p className="mx-auto max-w-md text-sm text-muted-foreground sm:text-base">
            {hero.subtitle}
          </p>
        </div>
        <Link
          to="/search"
          onClick={() => trackYmGoal("hero_cta_click", { cta: "map", source: "landing_close" })}
          className={cn(landingPrimaryCtaClass, "inline-flex gap-2")}
        >
          <Map className="size-5 shrink-0" aria-hidden />
          {hero.primaryCta}
        </Link>
      </div>
    </section>
  );
}
