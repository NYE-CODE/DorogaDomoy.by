import { Bell, MapPin, Users, Shield, Zap, Globe } from "lucide-react";
import { useI18n } from "../../../context/I18nContext";
import {
  landingBandMuted,
  landingContainerWide,
  landingH2,
  landingLeadCenter,
  landingSectionHeader,
  landingSectionY,
} from "./landing-section-styles";

const icons = [Bell, MapPin, Users, Shield, Zap, Globe] as const;

export function WhyUs() {
  const { t } = useI18n();
  const features = t.landing.whyUs.features;

  return (
    <section id="why-us" className={`${landingSectionY} ${landingBandMuted} scroll-mt-24`}>
      <div className={landingContainerWide}>
        <div className={landingSectionHeader}>
          <h2 className={landingH2}>{t.landing.whyUs.title}</h2>
          <p className={landingLeadCenter}>{t.landing.whyUs.subtitle}</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8">
          {features.map((feature, index) => {
            const Icon = icons[index];
            return (
              <div
                key={index}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg md:p-8"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
                  <Icon size={28} className="text-primary-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground md:text-xl">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground md:text-base">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}