import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { useI18n } from '../context/I18nContext';
import { blogApi, API_BASE, type BlogPostPublic, type BlogPostListItem } from '../api/client';
import { BlogBody } from '../components/blog-body';
import { BlogRelatedSlider } from '../components/blog-related-slider';
import { ArrowLeft, Calendar, MessageCircle } from 'lucide-react';

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
    blogApi
      .getPublished(slug)
      .then((p) => {
        setPost(p);
        document.title = `${p.title} — ${t.landing.blog.pageTitle}`;
      })
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [slug, t.landing.blog.pageTitle]);

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
      <div className="min-h-screen bg-background flex flex-col">
        <Header showCitySelector={false} />
        <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-16">
          <p className="text-muted-foreground">{t.common.loading}</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header showCitySelector={false} />
        <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-16 text-center">
          <p className="text-muted-foreground mb-6">{b.notFound}</p>
          <button
            type="button"
            onClick={() => navigate('/blog')}
            className="text-primary font-medium hover:underline"
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
    <div className="min-h-screen bg-background flex flex-col">
      <Header showCitySelector={false} />
      <main className="flex-1 w-full flex flex-col">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
          <nav className="mb-6">
            <button
              type="button"
              onClick={() => navigate('/blog')}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {b.backToList}
            </button>
          </nav>

          {img ? (
            <div className="rounded-xl overflow-hidden border border-border mb-8 aspect-[21/9] max-h-[320px] bg-muted">
              <img src={img} alt="" className="w-full h-full object-cover" />
            </div>
          ) : null}

          <header className="mb-8">
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium text-xs">
                {post.category_title || categoryLabel(post.category, t)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {date}
              </span>
              <span>
                {post.reading_minutes} {b.readingMin}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">{post.title}</h1>
            {post.excerpt ? (
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">{post.excerpt}</p>
            ) : null}
          </header>

          <BlogBody markdown={post.body_md} />
        </article>

        <BlogRelatedSlider
          posts={relatedPosts}
          sectionTitle={b.relatedTitle}
          ariaPrev={b.sliderPrev}
          ariaNext={b.sliderNext}
        />

        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-2 w-full border-t border-border mt-2">
          <h2 className="text-lg font-semibold text-foreground mb-2">{b.commentsSectionTitle}</h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-xl">
            {post.telegram_post_url ? b.commentsHint : b.commentsUnavailable}
          </p>
          {post.telegram_post_url ? (
            <a
              href={post.telegram_post_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#229ED9] text-white text-sm font-medium hover:bg-[#1e8bc3] transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              {b.commentsInTelegram}
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#229ED9]/50 text-white/90 text-sm font-medium cursor-not-allowed opacity-70"
            >
              <MessageCircle className="w-4 h-4" />
              {b.commentsInTelegram}
            </button>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
