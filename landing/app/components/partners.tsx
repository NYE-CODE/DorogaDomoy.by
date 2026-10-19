import { useEffect, useState } from "react";
import { partnersApi } from "../../../api/client";
import { useI18n } from "../../../context/I18nContext";
import type { Partner } from "../../../api/client";
import { API_BASE } from "../../../api/client";
import { Skeleton } from "../../../components/ui/skeleton";
import { cn } from "./ui/utils";
import {
  landingContainerWide,
  landingH2,
  landingLeadCenter,
  landingMuted,
  landingSectionAlt,
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
    <div className="flex min-h-[6.5rem] flex-col items-center justify-center rounded-2xl p-4 transition-colors hover:bg-muted/40">
      {logoUrl && !logoFailed ? (
        <>
          <img
            src={logoUrl}
            alt=""
            className="max-h-11 max-w-[8rem] object-contain opacity-80 grayscale transition-[filter,opacity] duration-200 group-hover:opacity-100 group-hover:grayscale-0"
            loading="lazy"
            decoding="async"
            onError={() => setLogoFailed(true)}
          />
          <span className={cn(landingMuted, "mt-2 line-clamp-2 text-center text-xs leading-snug")}>
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
        className="group block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {cardInner}
      </a>
    );
  }
  return <div className="group block rounded-2xl">{cardInner}</div>;
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
    <section id="partners" className={cn(landingSectionAlt, landingSectionY)}>
      <div className={landingContainerWide}>
        <div className={landingSectionHeader}>
          <h2 className={landingH2}>{t.landing.partners.title}</h2>
          <p className={landingLeadCenter}>{t.landing.partners.subtitle}</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex h-28 flex-col items-center justify-center rounded-2xl bg-muted/30 p-4"
              >
                <Skeleton className="h-10 w-24 rounded-md" />
                <Skeleton className="mt-3 h-3 w-16 rounded-md" />
              </div>
            ))}
          </div>
        ) : partners.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {partners.map((partner) => (
              <PartnerTile key={partner.id} partner={partner} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
