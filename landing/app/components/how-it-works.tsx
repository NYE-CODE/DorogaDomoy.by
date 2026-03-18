import { FileText, Map, Heart } from "lucide-react";
import { useI18n } from "../../../context/I18nContext";

const stepIcons = [FileText, Map, Heart] as const;

export function HowItWorks() {
  const { t } = useI18n();
  const steps = t.landing.howItWorks.steps;

  return (
    <section id="how-it-works" className="py-20 md:py-32 bg-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            {t.landing.howItWorks.title}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t.landing.howItWorks.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12">
          {steps.map((step, index) => {
            const StepIcon = stepIcons[index];
            return (
              <div key={index} className="relative text-center md:text-left">
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-2xl mb-4">
                    <StepIcon size={36} className="text-primary-foreground" />
                  </div>
                </div>
                <div className="text-6xl font-bold text-muted/50 absolute top-0 right-4 md:right-0 -z-0">
                  {step.number}
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">{step.title}</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}