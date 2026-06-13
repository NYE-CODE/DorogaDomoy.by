import { useCallback, useMemo, useState } from 'react';
import { getPaginationMeta, paginateArray, type PaginationInput } from '@/shared/lib/pagination';

export interface UsePaginationOptions {
  initialPage?: number;
  pageSize?: number;
  totalItems?: number;
}

/**
 * Управление пагинацией списков: page, pageSize, навигация prev/next.
 */
export function usePagination(options: UsePaginationOptions = {}) {
  const { initialPage = 1, pageSize: initialPageSize = 20, totalItems: initialTotal = 0 } = options;

  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalItems, setTotalItems] = useState(initialTotal);

  const meta = useMemo(
    () => getPaginationMeta({ page, pageSize, totalItems }),
    [page, pageSize, totalItems],
  );

  const goToPage = useCallback(
    (next: number) => setPage((current) => {
      const { totalPages } = getPaginationMeta({ page: current, pageSize, totalItems });
      return Math.min(Math.max(1, next), totalPages);
    }),
    [pageSize, totalItems],
  );

  const nextPage = useCallback(() => goToPage(page + 1), [goToPage, page]);
  const prevPage = useCallback(() => goToPage(page - 1), [goToPage, page]);

  const paginate = useCallback(
    <T,>(items: T[]) => paginateArray(items, { page, pageSize, totalItems: items.length }),
    [page, pageSize],
  );

  return {
    page: meta.page,
    pageSize,
    totalItems,
    totalPages: meta.totalPages,
    startIndex: meta.startIndex,
    endIndex: meta.endIndex,
    hasPrev: meta.hasPrev,
    hasNext: meta.hasNext,
    setPage: goToPage,
    setPageSize,
    setTotalItems,
    nextPage,
    prevPage,
    paginate,
  };
}

export type { PaginationInput };
