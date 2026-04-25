import { useEffect, useState } from "react";
import { partnersApi } from "../../../api/client";
import { useI18n } from "../../../context/I18nContext";
import type { Partner } from "../../../api/client";
import { API_BASE } from "../../../api/client";
import { Skeleton } from "../../../components/ui/skeleton";
import {
  landingBandMuted,
  landingContainerNarrow,
  landingH2,
  landingLeadCenter,
  landingSectionHeader,
  landingSectionY,
} from "./landing-section-styles";

function resolveLogoUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  return `${API_BASE}${url}`;
}

function PartnerTile({ partner }: { partner: Partner }) {
  const logoUrl = resolveLogoUrl(partner.logo_url);
  const [logoFailed, setLogoFailed] = useState(false);

  const cardInner = (
    <div className="flex min-h-[7rem] flex-col items-center justify-center rounded-xl bg-transparent p-4 transition-all duration-300 hover:-translate-y-0.5">
      {logoUrl && !logoFailed ? (
        <>
          <img
            src={logoUrl}
            alt=""
            className="max-h-12 max-w-[132px] object-contain grayscale opacity-85 transition-[filter,opacity] duration-300 group-hover:grayscale-0 group-hover:opacity-100"
            onError={() => setLogoFailed(true)}
          />
          <span className="mt-2 line-clamp-2 text-center text-xs font-medium text-muted-foreground">
            {partner.name}
          </span>
        </>
      ) : (
        <span className="text-center text-sm font-semibold leading-snug text-foreground line-clamp-3 px-1">
          {partner.name}
        </span>
      )}
    </div>
  );

  if (partner.link) {
    return (
      <a
        href={partner.link}
        target="_blank"
        rel="noopener noreferrer"
        className="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {cardInner}
      </a>
    );
  }
  return <div className="group block rounded-xl">{cardInner}</div>;
}

export function Partners() {
  const { t } = useI18n();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    partnersApi
      .list()
      .then(setPartners)
      .catch(() => setPartners([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="partners" className={`relative ${landingSectionY} ${landingBandMuted} scroll-mt-24`}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className={landingContainerNarrow}>
        <div className={landingSectionHeader}>
          <h2 className={landingH2}>{t.landing.partners.title}</h2>
          <p className={landingLeadCenter}>{t.landing.partners.subtitle}</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-10 md:mb-12">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex h-28 flex-col items-center justify-center rounded-xl bg-muted/30 p-4"
              >
                <Skeleton className="h-10 w-24 rounded-md" />
                <Skeleton className="mt-3 h-3 w-16 rounded-md" />
              </div>
            ))}
          </div>
        ) : partners.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-10 md:mb-12">
            {partners.map((partner) => (
              <PartnerTile key={partner.id} partner={partner} />
            ))}
          </div>
        ) : null}

        <div className="text-center">
          <div className="relative mx-auto max-w-2xl overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-[#FDB913] via-[#f5a623] to-[#FF9800] p-8 md:p-10 shadow-lg">
            <div
              className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-white/15 blur-2xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-12 -left-12 size-40 rounded-full bg-black/10 blur-2xl"
              aria-hidden
            />
            <div className="relative z-10">
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                {t.landing.partners.ctaTitle}
              </h3>
              <p className="text-sm md:text-base text-white/95 mb-6 max-w-lg mx-auto leading-relaxed">
                {t.landing.partners.ctaSubtitle}
              </p>
              <a
                href="mailto:contact@dorogadomoy.by"
                className="inline-flex items-center justify-center rounded-lg bg-white px-7 py-3 text-base font-semibold text-[#c2410c] shadow-md transition-colors hover:bg-white/95 dark:bg-card dark:text-primary dark:hover:bg-card/95"
              >
                {t.landing.partners.ctaButton}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
