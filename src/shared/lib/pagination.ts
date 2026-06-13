export interface PaginationInput {
  page: number;
  pageSize: number;
  totalItems: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  hasPrev: boolean;
  hasNext: boolean;
}

/** Вычисляет метаданные пагинации (pure function). */
export function getPaginationMeta(input: PaginationInput): PaginationMeta {
  const { pageSize, totalItems } = input;
  const totalPages = Math.max(1, Math.ceil(totalItems / Math.max(1, pageSize)));
  const page = Math.min(Math.max(1, input.page), totalPages);
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    hasPrev: page > 1,
    hasNext: page < totalPages,
  };
}

/** Возвращает slice массива для текущей страницы. */
export function paginateArray<T>(items: T[], input: PaginationInput): T[] {
  const { startIndex, endIndex } = getPaginationMeta(input);
  return items.slice(startIndex, endIndex);
}
