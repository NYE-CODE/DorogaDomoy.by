import { useNavigate } from "react-router";
import type { LucideIcon } from "lucide-react";
import {
  CircleCheckBig,
  Download,
  Heart,
  QrCode,
  Shield,
  UserPlus,
  Zap,
} from "lucide-react";
import { useI18n } from "../../../context/I18nContext";
import { useAuthenticatedAction } from "../../../utils/use-authenticated-action";
import { Button } from "./ui/button";
import { cn } from "./ui/utils";
import {
  landingContainerWide,
  landingH2,
  landingIconChipPrimary,
  landingLeadWideCenter,
  landingPanel,
  landingPathAccentBorder,
  landingPrimaryCtaClass,
  landingSectionBase,
  landingSectionHeader,
  landingSectionY,
} from "./landing-section-styles";

const DOG_IMAGE =
  "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=960&h=720&fit=crop&crop=entropy";

const featureIcons: readonly LucideIcon[] = [QrCode, Zap, Shield];
const stepIcons: readonly LucideIcon[] = [UserPlus, Download, CircleCheckBig];

export function PetsFeature() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { runWhenAuthed } = useAuthenticatedAction();
  const p = t.landing.petsFeature;

  return (
    <section id="pets-feature" className={cn(landingSectionBase, landingSectionY)}>
      <div className={landingContainerWide}>
        <header className={landingSectionHeader}>
          <h2 className={landingH2}>{p.title}</h2>
          <p className={landingLeadWideCenter}>{p.subtitle}</p>
        </header>

        <div className="mb-10 grid items-center gap-8 lg:mb-14 lg:grid-cols-2 lg:gap-12">
          <div className="mx-auto w-full max-w-lg lg:max-w-none">
            <div className="overflow-hidden rounded-lg border border-border shadow-md">
              <img
                src={DOG_IMAGE}
                alt={p.imageAlt}
                className="aspect-[4/3] w-full object-cover object-[center_42%]"
                width={960}
                height={720}
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>

          <ul className="grid gap-3 sm:gap-4">
            {p.features.map((feature, index) => {
              const Icon = featureIcons[index];
              return (
                <li
                  key={feature.title}
                  className={cn(
                    "flex gap-4 rounded-lg border border-border bg-card p-4 sm:p-5",
                    landingPathAccentBorder.medallion,
                    "border-l-[3px] sm:border-l-[3px] sm:border-t-0",
                  )}
                >
                  <span className={landingIconChipPrimary}>
                    <Icon size={20} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-foreground sm:text-lg">{feature.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">
                      {feature.desc}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mb-10 lg:mb-12">
          <h3 className="mb-5 text-center text-lg font-semibold text-foreground sm:mb-6 sm:text-xl">
            {p.howTitle}
          </h3>
          <ol className={cn(landingPanel, "grid sm:grid-cols-3")}>
            {p.steps.map((step, index) => {
              const StepIcon = stepIcons[index];
              return (
                <li
                  key={step.title}
                  className={cn(
                    "flex flex-col gap-3 border-border p-4 sm:p-5",
                    index > 0 && "border-t sm:border-t-0 sm:border-l",
                  )}
                >
                  <span className={landingIconChipPrimary}>
                    <StepIcon size={20} aria-hidden />
                  </span>
                  <div>
                    <h4 className="text-base font-semibold leading-snug text-foreground">{step.title}</h4>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <Button asChild>
            <button
              type="button"
              onClick={() => runWhenAuthed(() => navigate("/my-pets"))}
              className={`${landingPrimaryCtaClass} gap-3`}
            >
              <Heart size={22} className="shrink-0" aria-hidden />
              <span>{p.ctaButton}</span>
            </button>
          </Button>
          <p className="max-w-md text-xs text-muted-foreground sm:text-sm">{p.ctaSub}</p>
        </div>
      </div>
    </section>
  );
}
