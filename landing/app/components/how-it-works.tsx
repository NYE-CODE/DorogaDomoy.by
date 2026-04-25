import { FileText, Map, Heart } from "lucide-react";
import { useI18n } from "../../../context/I18nContext";
import {
  landingBandMuted,
  landingContainerWide,
  landingH2,
  landingLeadWideCenter,
  landingSectionHeader,
  landingSectionY,
} from "./landing-section-styles";

const stepIcons = [FileText, Map, Heart] as const;

export function HowItWorks() {
  const { t } = useI18n();
  const steps = t.landing.howItWorks.steps;

  return (
    <section id="how-it-works" className={`${landingSectionY} ${landingBandMuted}`}>
      <div className={landingContainerWide}>
        <div className={landingSectionHeader}>
          <h2 className={landingH2}>{t.landing.howItWorks.title}</h2>
          <p className={landingLeadWideCenter}>{t.landing.howItWorks.subtitle}</p>
        </div>

        <div className="relative">
          <div className="grid md:grid-cols-3 gap-4 md:gap-5">
          {steps.map((step, index) => {
            const StepIcon = stepIcons[index];
            return (
              <div
                key={index}
                className="group relative rounded-2xl border border-border bg-card p-5 md:p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex items-center gap-4 mb-4 md:mb-5">
                  <div className="relative z-10 inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground ring-4 ring-primary/10">
                    <StepIcon size={24} />
                  </div>
                </div>
                <h3 className="text-lg md:text-xl font-bold text-foreground mb-2 leading-tight">
                  {step.title}
                </h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {step.desc}
                </p>
                <div className="mt-5 flex items-center justify-end gap-2 text-xs font-medium text-primary">
                  <span>Шаг {index + 1}</span>
                  <span className="h-px w-8 bg-primary/30" />
                </div>
              </div>
            );
          })}
          </div>
        </div>
      </div>
    </section>
  );
}