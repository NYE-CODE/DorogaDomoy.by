import { Link } from "react-router";
import {
  QrCode,
  Zap,
  Shield,
  ArrowRight,
  UserPlus,
  Download,
  CircleCheckBig,
  Heart,
} from "lucide-react";
import { useI18n } from "../../../context/I18nContext";

const DOG_IMAGE =
  "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&h=600&fit=crop";

export function PetsFeature() {
  const { t } = useI18n();
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
      iconWrap: "group-hover:bg-[#FDB913]/10",
      iconClass: "text-[#FDB913]",
      title: p.steps[0].title,
      desc: p.steps[0].desc,
    },
    {
      icon: Download,
      iconWrap: "group-hover:bg-[#FF9800]/10",
      iconClass: "text-[#FF9800]",
      title: p.steps[1].title,
      desc: p.steps[1].desc,
    },
    {
      icon: CircleCheckBig,
      iconWrap: "group-hover:bg-[#FDB913]/10",
      iconClass: "text-[#FDB913]",
      title: p.steps[2].title,
      desc: p.steps[2].desc,
    },
  ] as const;

  return (
    <section
      id="pets-feature"
      className="py-20 bg-gradient-to-br from-[#FDB913]/10 to-[#FF9800]/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-bold text-black mb-6">
            {p.title}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">{p.subtitle}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div className="relative">
            <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={DOG_IMAGE}
                alt={p.imageAlt}
                className="w-full h-auto"
                width={800}
                height={600}
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-[#FDB913] rounded-full opacity-20 blur-3xl" />
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-[#FF9800] rounded-full opacity-20 blur-3xl" />
          </div>

          <div className="space-y-6">
            {features.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 ${item.boxClass} rounded-lg flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon size={24} className={item.iconClass} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-black mb-2">
                        {item.title}
                      </h3>
                      <p className="text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-12">
          <h3 className="text-3xl font-bold text-black text-center mb-12">
            {p.howTitle}
          </h3>
          <div className="relative grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="hidden md:block absolute top-16 left-1/3 -translate-x-1/2 z-0">
              <ArrowRight size={32} className="text-[#FDB913]" />
            </div>
            <div className="hidden md:block absolute top-16 left-2/3 -translate-x-1/2 z-0">
              <ArrowRight size={32} className="text-[#FF9800]" />
            </div>
            {steps.map((step) => {
              const StepIcon = step.icon;
              return (
                <div
                  key={step.title}
                  className="relative bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all group"
                >
                  <div className="text-center">
                    <div
                      className={`inline-flex items-center justify-center w-16 h-16 bg-gray-50 rounded-lg mb-4 ${step.iconWrap} transition-colors`}
                    >
                      <StepIcon size={32} className={step.iconClass} />
                    </div>
                    <h4 className="text-xl font-bold text-black mb-3">
                      {step.title}
                    </h4>
                    <p className="text-gray-600 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-center">
          <Link
            to="/my-pets"
            className="inline-flex items-center gap-3 bg-[#FF9800] text-white hover:bg-[#F57C00] rounded-lg px-8 h-12 text-lg transition-colors font-medium shadow-lg hover:shadow-xl"
          >
            <Heart size={24} />
            <span>{p.ctaButton}</span>
          </Link>
          <p className="text-gray-600 mt-4">{p.ctaSub}</p>
        </div>
      </div>
    </section>
  );
}
