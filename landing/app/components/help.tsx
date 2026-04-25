import { Heart, Share2, DollarSign, Users } from "lucide-react";
import { Button } from "./ui/button";
import { useI18n } from "../../../context/I18nContext";
import { useFeatureFlags } from "../../../context/FeatureFlagsContext";
import {
  landingBandMuted,
  landingContainerWide,
  landingH2,
  landingLeadWideCenter,
  landingSectionHeader,
  landingSectionY,
} from "./landing-section-styles";

export function Help() {
  const { t } = useI18n();
  const { ff_landing_show_help } = useFeatureFlags();
  const ways = t.landing.help.ways;
  const cardTones = [
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
    "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  ] as const;

  return (
    <section id="help" className={`${landingSectionY} ${landingBandMuted}`}>
      <div className={landingContainerWide}>
        {ff_landing_show_help && (
          <>
            <div className={landingSectionHeader}>
              <h2 className={landingH2}>{t.landing.help.title}</h2>
              <p className={landingLeadWideCenter}>{t.landing.help.subtitle}</p>
            </div>

            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
              {([Share2, Users, Heart, DollarSign] as const).map((Icon, index) => {
                const w = ways[index];
                if (!w) return null;
                return (
                <div
                  key={index}
                  className="group relative flex flex-col rounded-2xl border border-border bg-card p-5 md:p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${cardTones[index]}`}>
                      <Icon size={22} />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {(index + 1).toString().padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-foreground mb-2 leading-tight">
                    {w.title}
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground mb-5 leading-relaxed flex-grow">
                    {w.desc}
                  </p>
                  <Button
                    className="w-full h-11 rounded-lg font-medium mt-auto"
                    variant={index === 2 ? "default" : "secondary"}
                  >
                    {w.action}
                  </Button>
                </div>
                );
              })}
            </div>
          </>
        )}

      </div>
    </section>
  );
}