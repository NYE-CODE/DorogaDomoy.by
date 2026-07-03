import { useEffect, useState } from "react";
import { partnersApi } from "../../../api/client";
import { useI18n } from "../../../context/I18nContext";
import type { Partner } from "../../../api/client";
import { API_BASE } from "../../../api/client";
import { Skeleton } from "../../../components/ui/skeleton";
import { cn } from "./ui/utils";
import {
  landingContainerNarrow,
  landingH2,
  landingLeadCenter,
  landingPanel,
  landingPrimaryCtaClass,
  landingSectionBase,
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
    <div className="flex min-h-[7rem] flex-col items-center justify-center rounded-lg p-4 transition-opacity hover:opacity-90">
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
        <span className="line-clamp-3 px-1 text-center text-sm font-semibold leading-snug text-foreground">
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
        className="group block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {cardInner}
      </a>
    );
  }
  return <div className="group block rounded-lg">{cardInner}</div>;
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
    <section id="partners" className={cn(landingSectionBase, landingSectionY)}>
      <div className={landingContainerNarrow}>
        <div className={landingSectionHeader}>
          <h2 className={landingH2}>{t.landing.partners.title}</h2>
          <p className={landingLeadCenter}>{t.landing.partners.subtitle}</p>
        </div>

        {loading ? (
          <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:mb-12 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex h-28 flex-col items-center justify-center rounded-lg bg-muted/30 p-4"
              >
                <Skeleton className="h-10 w-24 rounded-md" />
                <Skeleton className="mt-3 h-3 w-16 rounded-md" />
              </div>
            ))}
          </div>
        ) : partners.length > 0 ? (
          <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:mb-12 lg:grid-cols-4">
            {partners.map((partner) => (
              <PartnerTile key={partner.id} partner={partner} />
            ))}
          </div>
        ) : null}

        <div className="text-center">
          <div className={cn(landingPanel, "mx-auto max-w-2xl border-primary/20 bg-primary p-8 md:p-10")}>
            <h3 className="mb-2 text-xl font-bold text-primary-foreground md:text-2xl">
              {t.landing.partners.ctaTitle}
            </h3>
            <p className="mx-auto mb-6 max-w-lg text-sm leading-relaxed text-primary-foreground/95 md:text-base">
              {t.landing.partners.ctaSubtitle}
            </p>
            <a
              href="mailto:contact@dorogadomoy.by"
              className={cn(
                landingPrimaryCtaClass,
                "inline-flex bg-primary-foreground text-primary hover:bg-primary-foreground/95",
              )}
            >
              {t.landing.partners.ctaButton}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
