import { Link } from "react-router";
import { Button } from "./ui/button";
import { useI18n } from "../../../context/I18nContext";
import type { HomeMode } from "../App";
import { trackYmGoal } from "../../../utils/ym";
import {
  landingContainerWide,
  landingHeroY,
  landingOutlineHeroCtaClass,
  landingPrimaryCtaClass,
} from "./landing-section-styles";

function trackHeroCtaClick(mode: HomeMode, cta: "primary" | "secondary") {
  trackYmGoal("hero_cta_click", { mode, cta });
}

export function Hero({ mode = "search" }: { mode?: HomeMode }) {
  const { t } = useI18n();
  const isSheltersMode = mode === "shelters";
  const sheltersTitle1 = "Найдите друга,";
  const sheltersTitle2 = "который ждал";
  const sheltersTitle3 = "именно вас";
  const sheltersSubtitle = "Познакомьтесь с питомцами из приютов и подарите кому-то настоящий дом";
  const searchTitle1 = "Вместе вернём";
  const searchTitle2 = "вашего питомца";
  const searchTitle3 = "домой";
  const searchSubtitle = "Помогаем находить потерявшихся животных по всей стране";
  const sheltersPrimary = "Смотреть приюты";
  const sheltersSecondary = "Выбрать питомца";
  const heroImage = isSheltersMode ? "/hero/shelters-main.webp" : "/hero/search-main.webp";
  const heroTitleClass = "mb-6 text-4xl font-bold leading-[1.08] text-foreground sm:text-5xl md:text-6xl lg:text-7xl";
  const underlineSvgClass = "absolute -bottom-1.5 left-0 w-full";
  const underlineStroke = 6;

  return (
    <section className={`relative overflow-hidden bg-background ${landingHeroY}`}>
      <div className={landingContainerWide}>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="text-center md:text-left z-10">
            {isSheltersMode ? (
              <h1 className={heroTitleClass}>
                {sheltersTitle1} <br />
                <span className="relative inline-block whitespace-nowrap">
                  {sheltersTitle2}
                  <svg className={underlineSvgClass} viewBox="0 0 200 10" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 5 Q50 0, 100 5 T200 5" stroke="#FDB913" strokeWidth={underlineStroke} fill="none"/>
                  </svg>
                </span>{" "}
                {sheltersTitle3}
              </h1>
            ) : (
              <h1 className={heroTitleClass}>
                {searchTitle1} <br />
                <span className="relative inline-block whitespace-nowrap">
                  {searchTitle2}
                  <svg className={underlineSvgClass} viewBox="0 0 200 10" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 5 Q50 0, 100 5 T200 5" stroke="#FDB913" strokeWidth={underlineStroke} fill="none"/>
                  </svg>
                </span> {searchTitle3}
              </h1>
            )}
            <p className="text-xl text-muted-foreground mb-10 max-w-xl">
              {isSheltersMode ? sheltersSubtitle : searchSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Button asChild>
                <Link
                  to={isSheltersMode ? "/shelters" : "/create"}
                  className={landingPrimaryCtaClass}
                  onClick={() => trackHeroCtaClick(mode, "primary")}
                >
                  {isSheltersMode ? sheltersPrimary : t.landing.hero.createAd}
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link
                  to={isSheltersMode ? "/shelters?tab=pets" : "/search"}
                  className={landingOutlineHeroCtaClass}
                  onClick={() => trackHeroCtaClick(mode, "secondary")}
                >
                  {isSheltersMode ? sheltersSecondary : t.landing.hero.viewMap}
                </Link>
              </Button>
            </div>
          </div>
          <div className="relative hidden md:block">
            <div
              className={`absolute -top-10 -right-10 h-64 w-64 rounded-full blur-3xl ${
                isSheltersMode ? "bg-emerald-300/40" : "bg-[#FDB913] opacity-20"
              }`}
            />
            <div className="relative z-10 aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-xl">
              <img
                src={heroImage}
                alt={isSheltersMode ? "Питомцы из приюта" : t.landing.hero.petsAlt}
                className="size-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}