import { useNavigate } from "react-router";
import { useI18n } from "../../../context/I18nContext";
import { useAuthenticatedAction } from "../../../utils/use-authenticated-action";
import { cn } from "./ui/utils";
import { LandingCta } from "./landing-cta";
import {
  landingContainerWide,
  landingH2,
  landingH3,
  landingLead,
  landingMuted,
  landingSectionAlt,
  landingSectionY,
  landingStepNumMedallion,
} from "./landing-section-styles";

const DOG_IMAGE =
  "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=960&h=720&fit=crop&crop=entropy";

export function PetsFeature() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { runWhenAuthed } = useAuthenticatedAction();
  const p = t.landing.petsFeature;

  return (
    <section id="pets-feature" className={cn(landingSectionAlt, landingSectionY)}>
      <div className={landingContainerWide}>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="flex min-w-0 flex-col gap-10">
            <div className="max-w-md space-y-3">
              <h2 className={cn(landingH2, "mb-0 text-left")}>{p.title}</h2>
              <p className={cn(landingLead, "text-left")}>{p.subtitle}</p>
            </div>

            <ol className="flex list-none flex-col gap-6 p-0">
              {p.steps.map((step, index) => (
                <li key={step.title} className="flex gap-4">
                  <span className={cn(landingStepNumMedallion, "w-4 shrink-0")} aria-hidden>
                    {index + 1}
                  </span>
                  <div className="min-w-0 space-y-1">
                    <h3 className={landingH3}>{step.title}</h3>
                    <p className={landingMuted}>{step.desc}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div>
              <LandingCta
                type="button"
                showArrow
                onClick={() => runWhenAuthed(() => navigate("/my-pets"))}
              >
                {p.ctaButton}
              </LandingCta>
            </div>
          </div>

          <div className="mx-auto w-full max-w-lg lg:mx-0 lg:max-w-none">
            <img
              src={DOG_IMAGE}
              alt={p.imageAlt}
              className="aspect-[4/3] w-full rounded-2xl object-cover object-[center_42%]"
              width={960}
              height={720}
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
