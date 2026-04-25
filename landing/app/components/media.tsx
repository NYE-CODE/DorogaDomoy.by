import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { mediaApi } from "../../../api/client";
import { useI18n } from "../../../context/I18nContext";
import type { MediaArticle } from "../../../api/client";
import { API_BASE } from "../../../api/client";
import {
  landingContainerWide,
  landingH2,
  landingLeadCenter,
  landingSectionHeader,
  landingSectionY,
} from "./landing-section-styles";

function formatMediaDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function resolveLogoUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  return `${API_BASE}${url}`;
}

export function Media() {
  const { t } = useI18n();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [articles, setArticles] = useState<MediaArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mediaApi
      .list({ limit: 200 })
      .then(setArticles)
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, []);

  const itemsPerPage = 3;
  const maxIndex = Math.max(0, articles.length - itemsPerPage);
  const visibleArticles = articles.slice(currentIndex, currentIndex + itemsPerPage);

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  if (loading) {
    return (
      <section id="media" className={`${landingSectionY} bg-background scroll-mt-24`}>
        <div className={landingContainerWide}>
          <div className={landingSectionHeader}>
            <h2 className={landingH2}>{t.landing.media.title}</h2>
            <p className={landingLeadCenter}>{t.landing.media.loading}</p>
          </div>
        </div>
      </section>
    );
  }

  if (articles.length === 0) {
    return (
      <section id="media" className={`${landingSectionY} bg-background scroll-mt-24`}>
        <div className={landingContainerWide}>
          <div className={landingSectionHeader}>
            <h2 className={landingH2}>{t.landing.media.title}</h2>
            <p className={landingLeadCenter}>{t.landing.media.empty}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="media" className={`${landingSectionY} bg-background scroll-mt-24`}>
      <div className={landingContainerWide}>
        <div className={landingSectionHeader}>
          <h2 className={landingH2}>{t.landing.media.title}</h2>
          <p className={landingLeadCenter}>{t.landing.media.subtitle}</p>
        </div>

        <div className="relative">
          <div className="grid gap-6 md:grid-cols-3 md:gap-8">
            {visibleArticles.map((article) => {
              const logoUrl = resolveLogoUrl(article.logo_url);
              const content = (
                <>
                  <div className="mb-6">
                    {logoUrl ? (
                      <div className="inline-block px-4 py-2 flex items-center justify-center min-h-[48px]">
                        <img
                          src={logoUrl}
                          alt=""
                          className="max-h-10 max-w-[120px] object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const fallback = e.currentTarget.nextElementSibling;
                            if (fallback) (fallback as HTMLElement).style.display = "block";
                          }}
                        />
                        <span className="font-bold text-lg text-foreground hidden" style={{ display: "none" }}>
                          {article.title.slice(0, 20)}
                        </span>
                      </div>
                    ) : (
                      <div className="inline-block px-4 py-2">
                        <span className="font-bold text-lg text-foreground">{article.title.slice(0, 30)}</span>
                      </div>
                    )}
                  </div>

                  <h3
                    className="text-lg text-foreground mb-6 leading-relaxed font-medium line-clamp-3"
                    title={article.title}
                  >
                    {article.title}
                  </h3>

                  <p className="text-sm text-muted-foreground">{formatMediaDate(article.published_at)}</p>
                </>
              );

              if (article.link) {
                return (
                  <a
                    key={article.id}
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md md:p-7"
                  >
                    {content}
                  </a>
                );
              }

              return (
                <div
                  key={article.id}
                  className="rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md md:p-7"
                >
                  {content}
                </div>
              );
            })}
          </div>

          {articles.length > itemsPerPage && (
            <div className="mt-10 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="rounded-lg border border-border bg-card p-3 text-muted-foreground transition-all hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-border disabled:hover:text-muted-foreground"
              >
                <ChevronLeft size={24} />
              </button>

              <span className="text-muted-foreground font-medium">
                {currentIndex + 1} / {maxIndex + 1}
              </span>

              <button
                type="button"
                onClick={handleNext}
                disabled={currentIndex === maxIndex}
                className="rounded-lg border border-border bg-card p-3 text-muted-foreground transition-all hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-border disabled:hover:text-muted-foreground"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
