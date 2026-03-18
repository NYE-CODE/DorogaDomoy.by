import { useEffect, useState } from "react";
import { partnersApi } from "../../../api/client";
import { useI18n } from "../../../context/I18nContext";
import type { Partner } from "../../../api/client";
import { API_BASE } from "../../../api/client";

function resolveLogoUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  return `${API_BASE}${url}`;
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
    <section className="py-20 md:py-32 bg-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            {t.landing.partners.title}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t.landing.partners.subtitle}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16 min-h-[120px] items-center justify-center text-muted-foreground">
            {t.landing.partners.loading}
          </div>
        ) : partners.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {partners.map((partner) => {
            const logoUrl = resolveLogoUrl(partner.logo_url);
            const content = (
              <div className="flex flex-col items-center justify-center p-6 grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300 h-full">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={partner.name}
                    className="max-h-16 max-w-[140px] object-contain mb-2"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      const fallback = e.currentTarget.nextElementSibling;
                      if (fallback) (fallback as HTMLElement).style.display = "block";
                    }}
                  />
                ) : null}
                <span className="font-bold text-xl text-foreground text-center" style={{ display: logoUrl ? "none" : "block" }}>
                  {partner.name}
                </span>
                {logoUrl && (
                  <span className="font-bold text-lg text-foreground text-center mt-2">
                    {partner.name}
                  </span>
                )}
              </div>
            );
            if (partner.link) {
              return (
                <a
                  key={partner.id}
                  href={partner.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center"
                >
                  {content}
                </a>
              );
            }
            return (
              <div key={partner.id} className="flex items-center justify-center">
                {content}
              </div>
            );
          })}
        </div>
        ) : null}

        <div className="text-center">
          <div className="relative bg-gradient-to-r from-[#FDB913] to-[#FF9800] rounded-3xl p-12 md:p-16 shadow-xl max-w-4xl mx-auto overflow-hidden">
            {/* Decorative geometric shapes */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-24 -mb-24"></div>
            <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-white/5 rounded-full"></div>
            <div className="absolute bottom-1/4 right-1/3 w-20 h-20 bg-black/5 rotate-45"></div>
            
            {/* Content */}
            <div className="relative z-10">
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                {t.landing.partners.ctaTitle}
              </h3>
              <p className="text-lg md:text-xl text-white/90 mb-8 max-w-xl mx-auto">
                {t.landing.partners.ctaSubtitle}
              </p>
              <a
                href="mailto:contact@dorogadomoy.by"
                className="inline-flex bg-white text-[#FF9800] px-10 py-4 rounded-lg font-bold hover:bg-white/90 dark:bg-card dark:text-primary dark:hover:bg-card/90 transition-colors shadow-lg text-lg"
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
