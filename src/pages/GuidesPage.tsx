import { useEffect, useMemo, useState } from 'react';
import { Header } from '@/widgets/layout/Header';
import { Footer } from '@/widgets/layout/Footer';
import { useI18n } from '@/app/providers/I18nContext';
import { guidesApi, type GuideCategory, type GuideVideoPublic } from '@/shared/api/client';
import {
  applySeo,
  canonicalUrlFromPath,
  SEO_KEYWORDS,
  SEO_ROBOTS_PUBLIC,
  truncateMetaDescription,
} from '@/shared/lib/seo';
import { cn } from '@/shared/ui/utils';
import { PageLoader } from '@/shared/ui/page-loader';

export default function GuidesPage() {
  const { t } = useI18n();
  const g = t.landing.guides;

  const [categories, setCategories] = useState<GuideCategory[]>([]);
  const [videos, setVideos] = useState<GuideVideoPublic[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const desc = truncateMetaDescription(
      `${g.pageSubtitle}. DorogaDomoy.by — инструкции и видеогайды по сервису.`,
    );
    applySeo({
      title: `${g.pageTitle} — DorogaDomoy.by`,
      description: desc,
      canonicalUrl: canonicalUrlFromPath('/guides'),
      robots: SEO_ROBOTS_PUBLIC,
      keywords: SEO_KEYWORDS,
    });
  }, [g.pageTitle, g.pageSubtitle]);

  useEffect(() => {
    setLoading(true);
    Promise.all([guidesApi.listCategories(), guidesApi.listPublished()])
      .then(([cats, vids]) => {
        setCategories(cats);
        setVideos(vids);
      })
      .catch(() => {
        setCategories([]);
        setVideos([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const categoriesSorted = useMemo(
    () => [...categories].sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title)),
    [categories],
  );

  const filteredVideos = useMemo(() => {
    if (activeCategory === 'all') return videos;
    return videos.filter((v) => v.category === activeCategory);
  }, [videos, activeCategory]);

  const categoryTitle = (slug: string) =>
    categoriesSorted.find((c) => c.slug === slug)?.title ?? slug;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header showCitySelector={false} />
      <main className="page-container-medium flex-1 py-10">
        <header className="mb-8">
          <h1 className="typo-h1">{g.pageTitle}</h1>
          <p className="mt-2 text-lg text-muted-foreground">{g.pageSubtitle}</p>
        </header>

        {loading ? (
          <PageLoader />
        ) : categoriesSorted.length === 0 && videos.length === 0 ? (
          <p className="text-muted-foreground">{g.empty}</p>
        ) : (
          <>
            {categoriesSorted.length > 0 ? (
              <div className="mb-8 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveCategory('all')}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                    activeCategory === 'all'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80',
                  )}
                >
                  {g.allCategories}
                </button>
                {categoriesSorted.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.slug)}
                    className={cn(
                      'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                      activeCategory === cat.slug
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80',
                    )}
                  >
                    {cat.title}
                  </button>
                ))}
              </div>
            ) : null}

            {filteredVideos.length === 0 ? (
              <p className="text-muted-foreground">{g.emptyCategory}</p>
            ) : (
              <ul className="grid gap-8 sm:grid-cols-2">
                {filteredVideos.map((video) => (
                  <li key={video.id}>
                    <article className="overflow-hidden rounded-md border border-border bg-card shadow-sm">
                      <div className="aspect-video w-full bg-muted">
                        <iframe
                          src={video.embed_url}
                          title={video.title}
                          className="size-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="strict-origin-when-cross-origin"
                        />
                      </div>
                      <div className="p-5">
                        {categoriesSorted.length > 1 ? (
                          <p className="text-xs font-medium uppercase tracking-wide text-primary">
                            {video.category_title || categoryTitle(video.category)}
                          </p>
                        ) : null}
                        <h2 className="mt-1 text-lg font-semibold text-foreground">{video.title}</h2>
                        {video.description ? (
                          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{video.description}</p>
                        ) : null}
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
