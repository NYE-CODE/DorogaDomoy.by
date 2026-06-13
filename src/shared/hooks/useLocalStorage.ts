import { useCallback, useEffect, useState } from 'react';

type SetValue<T> = T | ((prev: T) => T);

function readStorage<T>(key: string, initial: T, parse: (raw: string) => T): T {
  if (typeof window === 'undefined') return initial;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return initial;
    return parse(raw);
  } catch {
    return initial;
  }
}

function writeStorage<T>(key: string, value: T, serialize: (value: T) => string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, serialize(value));
  } catch {
    /* quota / private mode */
  }
}

/**
 * SSR-safe localStorage state с JSON сериализацией.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: {
    serialize?: (value: T) => string;
    deserialize?: (raw: string) => T;
  } = {},
): [T, (value: SetValue<T>) => void, () => void] {
  const serialize = options.serialize ?? JSON.stringify;
  const deserialize = options.deserialize ?? JSON.parse;

  const [stored, setStored] = useState<T>(() =>
    readStorage(key, initialValue, (raw) => deserialize(raw) as T),
  );

  useEffect(() => {
    writeStorage(key, stored, serialize);
  }, [key, stored, serialize]);

  const setValue = useCallback((value: SetValue<T>) => {
    setStored((prev) => (typeof value === 'function' ? (value as (p: T) => T)(prev) : value));
  }, []);

  const remove = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    }
    setStored(initialValue);
  }, [initialValue, key]);

  return [stored, setValue, remove];
}

/** Строковое значение без JSON-обёртки. */
export function useLocalStorageString(
  key: string,
  initialValue = '',
): [string, (value: SetValue<string>) => void, () => void] {
  return useLocalStorage(key, initialValue, {
    serialize: (v) => v,
    deserialize: (raw) => raw,
  });
}

export { readStorage, writeStorage };
