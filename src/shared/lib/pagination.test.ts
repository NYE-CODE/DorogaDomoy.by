import { describe, expect, it } from 'vitest';
import { getPaginationMeta, paginateArray } from './pagination';

describe('getPaginationMeta', () => {
  it('computes page boundaries', () => {
    const meta = getPaginationMeta({ page: 2, pageSize: 10, totalItems: 25 });
    expect(meta.page).toBe(2);
    expect(meta.totalPages).toBe(3);
    expect(meta.startIndex).toBe(10);
    expect(meta.endIndex).toBe(20);
    expect(meta.hasPrev).toBe(true);
    expect(meta.hasNext).toBe(true);
  });

  it('clamps page to valid range', () => {
    const meta = getPaginationMeta({ page: 99, pageSize: 10, totalItems: 5 });
    expect(meta.page).toBe(1);
    expect(meta.totalPages).toBe(1);
  });
});

describe('paginateArray', () => {
  it('returns slice for current page', () => {
    const items = [1, 2, 3, 4, 5];
    expect(paginateArray(items, { page: 2, pageSize: 2, totalItems: 5 })).toEqual([3, 4]);
  });
});
