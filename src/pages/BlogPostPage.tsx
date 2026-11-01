import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Header } from '@/widgets/layout/Header';
import { Footer } from '@/widgets/layout/Footer';
import { useI18n } from '@/app/providers/I18nContext';
import { blogApi, API_BASE, type BlogPostPublic, type BlogPostListItem } from '@/shared/api/client';
import { BlogBody } from '../../components/blog-body';
import { BlogRelatedSlider } from '../../components/blog-related-slider';
import { PartnerAdSlot } from '@/features/partner-ads/PartnerAdSlot';
import { Calendar, MessageCircle } from 'lucide-react';
import { BackQuickMenu } from '../../components/navigation/BackQuickMenu';
import {
  applySeo,
  canonicalUrlFromPath,
  SEO_KEYWORDS,
  SEO_ROBOTS_PRIVATE,
  SEO_ROBOTS_PUBLIC,
  truncateMetaDescription,
} from '@/shared/lib/seo';
import { cn } from '@/shared/lib/classNames';
import { surfacePage } from '@/shared/styles/surface-classes';
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

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const b = t.landing.blog;
  const [post, setPost] = useState<BlogPostPublic | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPostListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setPost(null);
    blogApi
      .getPublished(slug)
      .then((p) => {
        setPost(p);
        const meta =
          (p.meta_description && p.meta_description.trim()) ||
          (p.excerpt && p.excerpt.trim()) ||
          truncateMetaDescription(
            p.body_md
              .replace(/#{1,6}\s+[^\n]+\n?/g, '')
              .replace(/\*\*/g, '')
              .replace(/\[([^\]]+)]\([^)]+\)/g, '$1'),
          );
        applySeo({
          title: `${p.title} — ${t.landing.blog.pageTitle} | DorogaDomoy.by`,
          description: meta,
          canonicalUrl: canonicalUrlFromPath(`/blog/${p.slug}`),
          robots: SEO_ROBOTS_PUBLIC,
          keywords: SEO_KEYWORDS,
        });
      })
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [slug, t.landing.blog.pageTitle]);

  useEffect(() => {
    if (loading || !slug) return;
    if (post) return;
    applySeo({
      title: `${b.notFound} | DorogaDomoy.by`,
      description: 'Статья не найдена или снята с публикации. Другие материалы — в блоге DorogaDomoy.by.',
      canonicalUrl: canonicalUrlFromPath(`/blog/${slug}`),
      robots: SEO_ROBOTS_PRIVATE,
      keywords: SEO_KEYWORDS,
    });
  }, [loading, post, slug, b.notFound]);

  useEffect(() => {
    if (!slug) return;
    blogApi
      .listPublished({ limit: 80, offset: 0 })
      .then((list) => {
        const others = list.filter((p) => p.slug !== slug);
        setRelatedPosts(others.slice(0, 12));
      })
      .catch(() => setRelatedPosts([]));
  }, [slug]);

  if (loading) {
    return (
      <div className={cn('landing-theme min-h-screen flex flex-col', surfacePage)}>
        <Header showCitySelector={false} />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
          <p className="text-muted-foreground">{t.common.loading}</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className={cn('landing-theme min-h-screen flex flex-col', surfacePage)}>
        <Header showCitySelector={false} />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 text-center">
          <p className="mb-6 text-muted-foreground">{b.notFound}</p>
          <button
            type="button"
            onClick={() => navigate('/blog')}
            className="font-medium text-primary hover:underline"
          >
            {b.backToList}
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  const img = coverSrc(post.cover_image_url);
  const date = new Date(post.published_at).toLocaleDateString(
    typeof navigator !== 'undefined' ? navigator.language : 'ru',
    { year: 'numeric', month: 'long', day: 'numeric' },
  );

  return (
    <div className={cn('landing-theme min-h-screen flex flex-col', surfacePage)}>
      <Header showCitySelector={false} />
      <main className="flex w-full flex-1 flex-col">
        <article className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <nav className="mb-6">
            <BackQuickMenu />
          </nav>

          {img ? (
            <div className="mb-8 aspect-[21/9] max-h-[320px] overflow-hidden rounded-2xl border border-border bg-landing-muted shadow-card">
              <img src={img} alt="" className="h-full w-full object-cover" />
            </div>
          ) : null}

          <header className="mb-8">
            <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {post.category_title || categoryLabel(post.category, t)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="size-4" />
                {date}
              </span>
              <span>
                {post.reading_minutes} {b.readingMin}
              </span>
            </div>
            <h1 className="font-display typo-h1">{post.title}</h1>
            {post.excerpt ? (
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>
            ) : null}
          </header>

          <PartnerAdSlot placement="blog-article" className="mb-8" />

          <BlogBody markdown={post.body_md} />
        </article>

        <section className="mx-auto mt-2 w-full max-w-3xl border-t border-border px-4 pb-12 pt-2 sm:px-6 lg:px-8">
          <h2 className="mb-2 font-display text-lg font-semibold text-foreground">{b.commentsSectionTitle}</h2>
          <p className="mb-4 max-w-xl text-sm text-muted-foreground">
            {post.telegram_post_url ? b.commentsHint : b.commentsUnavailable}
          </p>
          {post.telegram_post_url ? (
            <a
              href={post.telegram_post_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 min-h-12 items-center justify-center gap-2 rounded-full bg-telegram px-7 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-telegram-hover"
            >
              <MessageCircle className="size-4" />
              {b.commentsInTelegram}
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex h-12 min-h-12 cursor-not-allowed items-center justify-center gap-2 rounded-full bg-telegram/50 px-7 text-sm font-semibold text-white/90 opacity-70"
            >
              <MessageCircle className="size-4" />
              {b.commentsInTelegram}
            </button>
          )}
        </section>

        <BlogRelatedSlider
          posts={relatedPosts}
          sectionTitle={b.relatedTitle}
          ariaPrev={b.sliderPrev}
          ariaNext={b.sliderNext}
        />
      </main>
      <Footer />
    </div>
  );
}
