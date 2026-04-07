import { useRef } from 'react';
import { Link } from 'react-router';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { BlogPostListItem } from '../api/client';
import { API_BASE } from '../api/client';

function coverSrc(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${API_BASE}${url.startsWith('/') ? url : `/${url}`}`;
}

interface BlogRelatedSliderProps {
  posts: BlogPostListItem[];
  sectionTitle: string;
  ariaPrev: string;
  ariaNext: string;
}

export function BlogRelatedSlider({ posts, sectionTitle, ariaPrev, ariaNext }: BlogRelatedSliderProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  if (posts.length === 0) return null;

  const scrollBy = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const w = el.clientWidth;
    el.scrollBy({ left: dir * Math.min(w * 0.85, 360), behavior: 'smooth' });
  };

  return (
    <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-border" aria-labelledby="blog-related-heading">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 id="blog-related-heading" className="text-lg sm:text-xl font-semibold text-foreground">
          {sectionTitle}
        </h2>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            className="p-2 rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-colors"
            aria-label={ariaPrev}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            className="p-2 rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-colors"
            aria-label={ariaNext}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide scroll-smooth snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {posts.map((p) => {
          const img = coverSrc(p.cover_image_url);
          const date = new Date(p.published_at).toLocaleDateString(
            typeof navigator !== 'undefined' ? navigator.language : 'ru',
            { year: 'numeric', month: 'short', day: 'numeric' },
          );
          return (
            <Link
              key={p.id}
              to={`/blog/${p.slug}`}
              className="group flex flex-col w-[min(100%,280px)] sm:w-72 shrink-0 snap-start rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
            >
              <div className="aspect-[16/10] bg-muted overflow-hidden">
                {img ? (
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/10" />
                )}
              </div>
              <div className="p-4 flex flex-col flex-1 min-h-[100px]">
                <time dateTime={p.published_at} className="text-xs text-muted-foreground mb-1">
                  {date}
                </time>
                <h3 className="text-sm font-semibold text-foreground line-clamp-3 group-hover:text-primary transition-colors">
                  {p.title}
                </h3>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
