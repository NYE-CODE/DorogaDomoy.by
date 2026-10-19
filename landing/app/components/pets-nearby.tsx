import { useI18n } from "../../../context/I18nContext";
import { trackYmGoal } from "../../../utils/ym";
import { cn } from "./ui/utils";
import { LandingCta } from "./landing-cta";
import {
  landingContainerWide,
  landingH2,
  landingLead,
} from "./landing-section-styles";
import { saveSearchLayoutMode } from "@/shared/lib/home-route";

const MAP_IMAGE = "/landing/pets-nearby-map.png";

/** Ширина SVG-волны; совпадает с w-28 / xl:w-32. */
const WAVE_W = "w-28 xl:w-32";

function trackPetsNearbyClick() {
  saveSearchLayoutMode("map");
  trackYmGoal("pets_nearby_click", { action: "open_map" });
}

/**
 * Правый край зелёной колонны: наклон «/».
 * Заливка зелёным слева от кривой — справа открывается карта под волной.
 */
function GreenWaveEdge({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 300"
      preserveAspectRatio="none"
      aria-hidden
      focusable="false"
    >
      {/* Мягкий «/»: сверху правее, снизу левее; зелёный слева от кривой */}
      <path
        d="M72 -1 C78 55 70 110 62 155 C54 200 40 250 18 301 L-1 301 L-1 -1 Z"
        className="fill-landing-dark"
      />
    </svg>
  );
}

/**
 * Секция «Питомцы рядом».
 * Зелёный фон обрезан по волне; карта лежит справа и заходит под изгиб.
 */
export function PetsNearby() {
  const { t } = useI18n();
  const copy = t.landing.petsNearby;
  const titleLines = copy.title.split("\n");

  return (
    <section
      id="pets-nearby"
      className="relative scroll-mt-24 overflow-x-clip bg-landing"
    >
      {/* Карта: правая половина + зона волны (под зелёным изгибом) */}
      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 z-0 hidden overflow-hidden lg:block",
          /* Старт чуть левее конца зелёной колонны, чтобы зайти под волну */
          "left-[calc(50vw+6rem-8rem)]",
        )}
        aria-hidden
      >
        <img
          src={MAP_IMAGE}
          alt=""
          width={761}
          height={484}
          className="size-full object-cover object-[center_42%]"
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Зелёный: прямоугольник + волна (без кремовой заливки — карта видна справа от кривой) */}
      <div
        className={cn(
          "pointer-events-none absolute bottom-px left-0 top-0 z-[1] overflow-hidden",
          "w-full",
          "lg:w-[calc(50vw+6rem)]",
        )}
        aria-hidden
      >
        {/* Прямая часть — до полосы волны */}
        <div
          className={cn(
            "absolute inset-y-0 left-0 bg-landing-dark",
            "right-0 lg:right-28 xl:right-32",
          )}
        />
        <GreenWaveEdge
          className={cn(
            "absolute inset-y-0 right-0 hidden h-full lg:block",
            WAVE_W,
          )}
        />
      </div>

      <div
        className={cn(
          landingContainerWide,
          "relative z-10 grid min-h-[22rem] items-center gap-10",
          "py-14 sm:py-16 lg:min-h-[28rem] lg:grid-cols-2 lg:gap-12 lg:py-20",
        )}
      >
        <div className="flex max-w-[19.5rem] flex-col gap-7 pr-6 text-on-landing-dark sm:gap-8 lg:pr-10">
          <div className="space-y-3">
            <h2 className={cn(landingH2, "mb-0 text-on-landing-dark")}>
              {titleLines.map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </h2>
            <p className={cn(landingLead, "max-w-[18rem] text-pretty text-on-landing-dark/85")}>
              {copy.subtitle}
            </p>
          </div>

          <LandingCta
            to="/search"
            variant="primaryOnDark"
            showArrow
            onClick={trackPetsNearbyClick}
          >
            {copy.cta}
          </LandingCta>
        </div>

        <div className="hidden lg:block" aria-hidden>
          <span className="sr-only">{copy.mapLabel}</span>
        </div>
      </div>
    </section>
  );
}
