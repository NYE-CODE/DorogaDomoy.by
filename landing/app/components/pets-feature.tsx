import { useNavigate } from "react-router";
import {
  QrCode,
  Zap,
  Shield,
  UserPlus,
  Download,
  CircleCheckBig,
  Heart,
} from "lucide-react";
import { useI18n } from "../../../context/I18nContext";
import { useAuthenticatedAction } from "../../../utils/use-authenticated-action";
import { Button } from "./ui/button";
import {
  landingContainerNarrow,
  landingH2,
  landingLeadCenter,
  landingPrimaryCtaClass,
  landingSectionHeader,
  landingSectionY,
} from "./landing-section-styles";

const DOG_IMAGE =
  "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=640&h=480&fit=crop";

export function PetsFeature() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { runWhenAuthed } = useAuthenticatedAction();
  const p = t.landing.petsFeature;
  const features = [
    {
      icon: QrCode,
      boxClass: "bg-[#FDB913]",
      iconClass: "text-black",
      title: p.features[0].title,
      desc: p.features[0].desc,
    },
    {
      icon: Zap,
      boxClass: "bg-[#FF9800]",
      iconClass: "text-white",
      title: p.features[1].title,
      desc: p.features[1].desc,
    },
    {
      icon: Shield,
      boxClass: "bg-[#FDB913]",
      iconClass: "text-black",
      title: p.features[2].title,
      desc: p.features[2].desc,
    },
  ] as const;

  const steps = [
    {
      icon: UserPlus,
      iconWrap: "bg-[#FDB913]/15",
      iconClass: "text-[#FDB913]",
      title: p.steps[0].title,
      desc: p.steps[0].desc,
    },
    {
      icon: Download,
      iconWrap: "bg-[#FF9800]/15",
      iconClass: "text-[#FF9800]",
      title: p.steps[1].title,
      desc: p.steps[1].desc,
    },
    {
      icon: CircleCheckBig,
      iconWrap: "bg-[#FDB913]/15",
      iconClass: "text-[#FDB913]",
      title: p.steps[2].title,
      desc: p.steps[2].desc,
    },
  ] as const;

  return (
    <section
      id="pets-feature"
      className={`${landingSectionY} bg-gradient-to-br from-[#FDB913]/8 via-background to-[#FF9800]/10 dark:from-[#FDB913]/18 dark:via-[#15120f] dark:to-[#FF9800]/15`}
    >
      <div className={landingContainerNarrow}>
        <header className={landingSectionHeader}>
          <h2 className={landingH2}>{p.title}</h2>
          <p className={landingLeadCenter}>{p.subtitle}</p>
        </header>

        {/* Верхний блок: изображение + преимущества — плотнее */}
        <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-6 md:gap-8 items-start mb-8 md:mb-10">
          <div className="relative mx-auto w-full max-w-sm md:max-w-none md:mx-0">
            <div className="rounded-xl overflow-hidden shadow-lg ring-1 ring-black/5 dark:ring-white/10 bg-muted">
              <img
                src={DOG_IMAGE}
                alt={p.imageAlt}
                className="w-full aspect-[4/3] md:aspect-[5/4] object-cover max-h-[200px] sm:max-h-[220px] md:max-h-none"
                width={640}
                height={480}
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="pointer-events-none absolute -top-4 -right-4 size-24 rounded-full bg-[#FDB913]/25 blur-2xl dark:bg-[#FDB913]/30" />
            <div className="pointer-events-none absolute -bottom-4 -left-4 size-24 rounded-full bg-[#FF9800]/20 blur-2xl dark:bg-[#FF9800]/25" />
          </div>

          <div className="divide-y divide-border rounded-xl border border-border bg-card/80 backdrop-blur-[2px] shadow-sm">
            {features.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex gap-3 p-4 first:pt-4 last:pb-4 sm:p-5">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${item.boxClass}`}
                  >
                    <Icon size={20} className={item.iconClass} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-foreground mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-snug">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Как это работает — компактная сетка */}
        <div className="mb-8 md:mb-10">
          <h3 className="mb-4 text-center text-lg font-semibold text-foreground md:mb-5 md:text-xl">
            {p.howTitle}
          </h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {steps.map((step) => {
              const StepIcon = step.icon;
              return (
                <div
                  key={step.title}
                  className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div
                    className={`mb-3 inline-flex h-11 w-11 items-center justify-center rounded-lg ${step.iconWrap}`}
                  >
                    <StepIcon size={22} className={step.iconClass} />
                  </div>
                  <h4 className="mb-1.5 text-sm font-semibold leading-tight text-card-foreground">
                    {step.title}
                  </h4>
                  <p className="text-xs leading-relaxed text-muted-foreground sm:text-[13px]">{step.desc}</p>
                </div>
              );
            })}
          </div>
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
