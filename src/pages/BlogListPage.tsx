import { useEffect, useState, Fragment } from 'react';
import { Link } from 'react-router';
import { Header } from '@/widgets/layout/Header';
import { Footer } from '@/widgets/layout/Footer';
import { useI18n } from '@/app/providers/I18nContext';
import { blogApi, API_BASE, type BlogPostListItem } from '@/shared/api/client';
import { ChevronRight, Calendar } from 'lucide-react';
import {
  applySeo,
  canonicalUrlFromPath,
  SEO_KEYWORDS,
  SEO_ROBOTS_PUBLIC,
  truncateMetaDescription,
} from '@/shared/lib/seo';
import { PartnerAdSlot } from '@/features/partner-ads/PartnerAdSlot';
import { PARTNER_AD_BLOG_LIST_INTERVAL } from '@/shared/lib/partner-ad-placements';
import { cn } from '@/shared/lib/classNames';
import { surfaceCtaOutline, surfacePage } from '@/shared/styles/surface-classes';
import '../../landing/styles/theme-scoped.css';

function coverSrc(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${API_BASE}${url.startsWith('/') ? url : `/${url}`}`;
}

function categoryLabel(category: string, t: ReturnType<typeof useI18n>['t']): string {
  const b = t.landing.blog;
  switch (category) {
    case 'stories':
      return b.categoryStories;
    case 'news':
      return b.categoryNews;
    case 'safety':
      return b.categorySafety;
    case 'guides':
    default:
      return b.categoryGuides;
  }
}

const BLOG_PAGE_SIZE = 24;

export default function BlogListPage() {
  const { t } = useI18n();
  const b = t.landing.blog;
  const [posts, setPosts] = useState<BlogPostListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const desc = truncateMetaDescription(
      `${b.pageSubtitle}. DorogaDomoy.by — экосистема помощи животным: поиск, приюты и поддержка в Беларуси.`,
    );
    applySeo({
      title: `${b.pageTitle} — DorogaDomoy.by`,
      description: desc,
      canonicalUrl: canonicalUrlFromPath('/blog'),
      robots: SEO_ROBOTS_PUBLIC,
      keywords: SEO_KEYWORDS,
    });
  }, [b.pageTitle, b.pageSubtitle]);

  useEffect(() => {
    blogApi
      .listPublished({ limit: BLOG_PAGE_SIZE, offset: 0 })
      .then((list) => {
        setPosts(list);
        setHasMore(list.length >= BLOG_PAGE_SIZE);
      })
      .catch(() => {
        setPosts([]);
        setHasMore(false);
      })
      .finally(() => setLoading(false));
  }, []);

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    blogApi
      .listPublished({ limit: BLOG_PAGE_SIZE, offset: posts.length })
      .then((chunk) => {
        setPosts((prev) => [...prev, ...chunk]);
        setHasMore(chunk.length >= BLOG_PAGE_SIZE);
      })
      .catch(() => setHasMore(false))
      .finally(() => setLoadingMore(false));
  };

  return (
    <div className={cn('landing-theme min-h-screen flex flex-col', surfacePage)}>
      <Header showCitySelector={false} />
      <main className="page-container-narrow flex-1 w-full py-10">
        <header className="mb-10">
          <h1 className="font-display typo-h1">{b.pageTitle}</h1>
          <p className="mt-2 text-lg text-muted-foreground">{b.pageSubtitle}</p>
        </header>

        {loading ? (
          <p className="text-muted-foreground">{t.common.loading}</p>
        ) : posts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-landing-muted/40 px-4 py-8 text-center text-muted-foreground">
            {b.empty}
          </p>
        ) : (
          <ul className="space-y-6">
            {posts.map((post, index) => {
              const img = coverSrc(post.cover_image_url);
              const date = new Date(post.published_at).toLocaleDateString(
                typeof navigator !== 'undefined' ? navigator.language : 'ru',
                { year: 'numeric', month: 'long', day: 'numeric' },
              );
              return (
                <Fragment key={post.id}>
                <li>
                  <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35">
                    <Link to={`/blog/${post.slug}`} className="group flex flex-col sm:min-h-[200px] sm:flex-row">
                      {img ? (
                        <div className="aspect-[16/10] shrink-0 bg-landing-muted sm:aspect-auto sm:min-h-[200px] sm:w-72">
                          <img src={img} alt="" className="h-full w-full object-cover transition-opacity group-hover:opacity-95" />
                        </div>
                      ) : null}
                      <div
                        className={`flex flex-1 flex-col p-6 ${img ? 'sm:min-h-[200px]' : ''}`}
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-2">
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                              {post.category_title || categoryLabel(post.category, t)}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {date}
                            </span>
                            <span>
                              {post.reading_minutes} {b.readingMin}
                            </span>
                          </div>
                          <h2 className="font-display typo-h3 transition-colors group-hover:text-primary">
                            {post.title}
                          </h2>
                          {post.excerpt ? (
                            <p className="mt-2 text-muted-foreground line-clamp-2 text-sm sm:text-base">{post.excerpt}</p>
                          ) : null}
                        </div>
                        <span
                          className={`inline-flex shrink-0 items-center gap-1 self-end text-primary font-medium text-sm ${img ? 'mt-auto pt-4' : 'mt-4'}`}
                        >
                          {b.readArticle}
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </Link>
                  </article>
                </li>
                {(index + 1) % PARTNER_AD_BLOG_LIST_INTERVAL === 0 ? (
                  <li>
                    <PartnerAdSlot placement="blog-list" />
                  </li>
                ) : null}
                </Fragment>
              );
            })}
          </ul>
        )}

        {!loading && posts.length > 0 && hasMore ? (
          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className={cn(surfaceCtaOutline, 'w-auto min-w-[10rem] px-6 disabled:opacity-60')}
            >
              {loadingMore ? t.common.loading : b.loadMore}
            </button>
          </div>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
