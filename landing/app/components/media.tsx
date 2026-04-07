import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { mediaApi } from "../../../api/client";
import { useI18n } from "../../../context/I18nContext";
import type { MediaArticle } from "../../../api/client";
import { API_BASE } from "../../../api/client";

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
      <section className="py-20 md:py-32 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              {t.landing.media.title}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t.landing.media.loading}
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (articles.length === 0) return null;

  return (
    <section className="py-20 md:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            {t.landing.media.title}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t.landing.media.subtitle}
          </p>
        </div>

        <div className="relative">
          <div className="grid md:grid-cols-3 gap-8">
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
                    className="block bg-card border-2 border-border rounded-2xl p-8 hover:border-primary transition-all duration-300"
                  >
                    {content}
                  </a>
                );
              }

              return (
                <div
                  key={article.id}
                  className="bg-card border-2 border-border rounded-2xl p-8 hover:border-primary transition-all duration-300"
                >
                  {content}
                </div>
              );
            })}
          </div>

          {articles.length > itemsPerPage && (
            <div className="flex justify-center items-center gap-4 mt-10">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="bg-card border-2 border-border text-muted-foreground p-3 rounded-lg hover:border-primary hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:text-muted-foreground"
              >
                <ChevronLeft size={24} />
              </button>

              <span className="text-muted-foreground font-medium">
                {currentIndex + 1} / {maxIndex + 1}
              </span>

              <button
                onClick={handleNext}
                disabled={currentIndex === maxIndex}
                className="bg-card border-2 border-border text-muted-foreground p-3 rounded-lg hover:border-primary hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:text-muted-foreground"
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
