import { useI18n } from "../../../context/I18nContext";
import { cn } from "./ui/utils";
import {
  landingContainerWide,
  landingH2,
  landingH3,
  landingMuted,
  landingSectionAlt,
  landingSectionHeader,
  landingSectionY,
} from "./landing-section-styles";

/** Порядок совпадает с шагами: объявление, карта, отклики, дом. */
const STEP_ICONS = [
  "/landing/how-step-listing.png",
  "/landing/how-step-map.png",
  "/landing/how-step-replies.png",
  "/landing/how-step-home.png",
] as const;

export function HowItWorks() {
  const { t } = useI18n();
  const copy = t.landing.howItWorks;

  return (
    <section id="how-it-works" className={cn(landingSectionAlt, landingSectionY)}>
      <div className={landingContainerWide}>
        <div className={landingSectionHeader}>
          <h2 className={cn(landingH2, "mb-0")}>{copy.title}</h2>
        </div>

        <ol className="grid list-none grid-cols-1 gap-10 p-0 sm:grid-cols-2 sm:gap-x-12 sm:gap-y-12 lg:grid-cols-4 lg:gap-x-10">
          {copy.steps.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-3">
              <img
                src={STEP_ICONS[index]}
                alt=""
                width={88}
                height={88}
                decoding="async"
                loading="lazy"
                className="h-[4.5rem] w-auto max-w-[5.75rem] object-contain object-left sm:h-20"
              />
              <h3 className={landingH3}>{step.title}</h3>
              <p className={cn(landingMuted, "max-w-[18rem]")}>{step.desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
