import { Bell, MapPin, Users, Shield, Zap, Globe } from "lucide-react";
import { useI18n } from "../../../context/I18nContext";

const icons = [Bell, MapPin, Users, Shield, Zap, Globe] as const;

export function WhyUs() {
  const { t } = useI18n();
  const features = t.landing.whyUs.features;

  return (
    <section id="why-us" className="py-20 md:py-32 bg-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            {t.landing.whyUs.title}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t.landing.whyUs.subtitle}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = icons[index];
            return (
              <div
                key={index}
                className="bg-card rounded-3xl p-8 shadow-md hover:shadow-xl transition-all duration-300"
              >
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-6">
                  <Icon size={32} className="text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}