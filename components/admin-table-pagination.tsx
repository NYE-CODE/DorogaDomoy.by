import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { adm } from './admin-panel-chrome';

/** Номера страниц с «…» между разрывами (например 1 … 4 5 6 … 20). */
export function getPaginationItems(current: number, total: number): (number | 'gap')[] {
  if (total <= 0) return [];
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const set = new Set<number>();
  set.add(1);
  set.add(total);
  set.add(current);
  if (current > 1) set.add(current - 1);
  if (current < total) set.add(current + 1);
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | 'gap')[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i]! - sorted[i - 1]! > 1) {
      out.push('gap');
    }
    out.push(sorted[i]!);
  }
  return out;
}

export type AdminTablePaginationLabels = {
  prev: string;
  next: string;
  goToPage: (page: number) => string;
};

type AdminTablePaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  labels: AdminTablePaginationLabels;
  /** Подпись под кнопками (например «Страница 2 из 5» и счётчик). */
  summary?: ReactNode;
  className?: string;
};

export function AdminTablePagination({
  currentPage,
  totalPages,
  onPageChange,
  labels,
  summary,
  className,
}: AdminTablePaginationProps) {
  if (totalPages <= 1) return null;

  const items = getPaginationItems(currentPage, totalPages);

  return (
    <div className={`flex flex-col gap-3 ${className ?? ''}`}>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          title={labels.prev}
          aria-label={labels.prev}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className={adm.paginationBtn}
        >
          <ChevronLeft className="w-4 h-4 shrink-0" />
          <span className="sr-only">{labels.prev}</span>
        </button>

        <div className="flex flex-wrap items-center justify-center gap-1">
          {items.map((item, idx) =>
            item === 'gap' ? (
              <span key={`gap-${idx}`} className={adm.paginationEllipsis} aria-hidden>
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                title={labels.goToPage(item)}
                aria-label={labels.goToPage(item)}
                aria-current={item === currentPage ? 'page' : undefined}
                onClick={() => onPageChange(item)}
                className={`${adm.paginationPageNum} ${item === currentPage ? adm.paginationPageNumActive : ''}`}
              >
                {item}
              </button>
            ),
          )}
        </div>

        <button
          type="button"
          title={labels.next}
          aria-label={labels.next}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className={adm.paginationBtn}
        >
          <span className="sr-only">{labels.next}</span>
          <ChevronRight className="w-4 h-4 shrink-0" />
        </button>
      </div>
      {summary != null ? (
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center">{summary}</div>
      ) : null}
    </div>
  );
}
