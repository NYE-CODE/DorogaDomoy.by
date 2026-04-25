import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { useI18n } from '../context/I18nContext';
import { blogApi, API_BASE, type BlogPostListItem } from '../api/client';
import { ChevronRight, Calendar } from 'lucide-react';
import {
  applySeo,
  canonicalUrlFromPath,
  SEO_KEYWORDS,
  SEO_ROBOTS_PUBLIC,
  truncateMetaDescription,
} from '../utils/seo';

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
    const desc = truncateMetaDescription(`${b.pageSubtitle}. DorogaDomoy.by — поиск пропавших питомцев в Беларуси.`);
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
    <div className="min-h-screen bg-background flex flex-col">
      <Header showCitySelector={false} />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">{b.pageTitle}</h1>
          <p className="mt-2 text-muted-foreground text-lg">{b.pageSubtitle}</p>
        </header>

        {loading ? (
          <p className="text-muted-foreground">{t.common.loading}</p>
        ) : posts.length === 0 ? (
          <p className="text-muted-foreground">{b.empty}</p>
        ) : (
          <ul className="space-y-8">
            {posts.map((post) => {
              const img = coverSrc(post.cover_image_url);
              const date = new Date(post.published_at).toLocaleDateString(
                typeof navigator !== 'undefined' ? navigator.language : 'ru',
                { year: 'numeric', month: 'long', day: 'numeric' },
              );
              return (
                <li key={post.id}>
                  <article className="rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <Link to={`/blog/${post.slug}`} className="flex flex-col sm:flex-row sm:min-h-[200px] group">
                      {img ? (
                        <div className="sm:w-72 shrink-0 aspect-[16/10] sm:aspect-auto sm:min-h-[200px] bg-muted">
                          <img src={img} alt="" className="w-full h-full object-cover group-hover:opacity-95 transition-opacity" />
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
                          <h2 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
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
              className="px-6 py-2.5 rounded-lg border border-border bg-card text-foreground font-medium hover:bg-muted disabled:opacity-60 transition-colors"
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
