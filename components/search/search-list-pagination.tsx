import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '@/app/providers/I18nContext';
import { cn } from '@/shared/ui/utils';

interface SearchListPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

function pageWindow(page: number, totalPages: number): number[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages = new Set<number>([1, totalPages, page, page - 1, page + 1]);
  if (page <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }
  if (page >= totalPages - 2) {
    pages.add(totalPages - 1);
    pages.add(totalPages - 2);
    pages.add(totalPages - 3);
  }
  return [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
}

export function SearchListPagination({
  page,
  totalPages,
  onPageChange,
  className,
}: SearchListPaginationProps) {
  const { t } = useI18n();
  const pg = t.app.searchPagination;

  if (totalPages <= 1) return null;

  const pages = pageWindow(page, totalPages);

  return (
    <nav
      aria-label={pg.label}
      className={cn('flex flex-wrap items-center justify-center gap-2 pt-2', className)}
    >
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-landing-muted disabled:pointer-events-none disabled:opacity-40"
        aria-label={pg.prev}
      >
        <ChevronLeft className="size-4" aria-hidden />
      </button>

      {pages.map((p, index) => {
        const prev = pages[index - 1];
        const showEllipsis = prev != null && p - prev > 1;
        return (
          <span key={p} className="contents">
            {showEllipsis ? (
              <span className="px-1 text-sm text-muted-foreground" aria-hidden>
                …
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => onPageChange(p)}
              aria-label={pg.goToPage.replace('{n}', String(p))}
              aria-current={p === page ? 'page' : undefined}
              className={cn(
                'inline-flex size-10 items-center justify-center rounded-full text-sm font-medium transition-colors',
                p === page
                  ? 'bg-landing-dark text-on-landing-dark shadow-sm'
                  : 'border border-border bg-card text-foreground shadow-sm hover:bg-landing-muted',
              )}
            >
              {p}
            </button>
          </span>
        );
      })}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-landing-muted disabled:pointer-events-none disabled:opacity-40"
        aria-label={pg.next}
      >
        <ChevronRight className="size-4" aria-hidden />
      </button>
    </nav>
  );
}
