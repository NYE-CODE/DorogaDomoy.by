import { useEffect, useState } from 'react';
import { debounce } from '@/shared/lib/debounce';

/**
 * Возвращает debounced-версию value после задержки delayMs.
 * Полезно для поисковых полей и фильтров.
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

export { debounce };
