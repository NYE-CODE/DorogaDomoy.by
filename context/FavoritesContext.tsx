import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { toast } from 'sonner';
import { favoritesApi } from '../api/client';
import { useAuth } from './AuthContext';
import { useI18n } from './I18nContext';

const STORAGE_KEY = 'dd_favorite_pet_ids_v1';
const MAX_GUEST_FAVORITES = 200;

/** Порядок id в локальном избранном (для гостевой страницы «Избранное»). */
export function readGuestFavoriteIdsFromStorage(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr)
      ? arr.filter((x): x is string => typeof x === 'string' && x.length > 0)
      : [];
  } catch {
    return [];
  }
}

function writeLocalIds(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* ignore quota */
  }
}

export type FavoritesContextValue = {
  hydrated: boolean;
  favoriteIds: ReadonlySet<string>;
  count: number;
  isFavorite: (petId: string) => boolean;
  toggleFavorite: (petId: string) => Promise<void>;
  refreshFromServer: () => Promise<void>;
  pendingPetId: string | null;
};

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const { t } = useI18n();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => new Set());
  const [hydrated, setHydrated] = useState(false);
  const [pendingPetId, setPendingPetId] = useState<string | null>(null);

  const refreshFromServer = useCallback(async () => {
    if (!isAuthenticated) return;
    const { ids } = await favoritesApi.ids();
    setFavoriteIds(new Set(ids));
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setFavoriteIds(new Set(readGuestFavoriteIdsFromStorage()));
      setHydrated(true);
      return;
    }

    let cancelled = false;

    (async () => {
      const local = readGuestFavoriteIdsFromStorage();
      if (local.length > 0) {
        try {
          await favoritesApi.importBatch(local);
          if (!cancelled) writeLocalIds([]);
        } catch {
          /* оставляем local — повтор при следующем заходе */
        }
      }
      if (cancelled) return;
      try {
        await refreshFromServer();
      } catch {
        if (!cancelled) setFavoriteIds(new Set());
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id, refreshFromServer]);

  const isFavorite = useCallback(
    (petId: string) => favoriteIds.has(petId),
    [favoriteIds],
  );

  const toggleFavorite = useCallback(
    async (petId: string) => {
      if (!petId) return;

      if (!isAuthenticated) {
        const cur = readGuestFavoriteIdsFromStorage();
        const next = new Set(cur);
        if (next.has(petId)) {
          next.delete(petId);
          writeLocalIds([...next]);
          setFavoriteIds(new Set(next));
          toast.success(t.favorites.removed);
          return;
        }
        if (next.size >= MAX_GUEST_FAVORITES) {
          toast.error(t.favorites.limitReached);
          return;
        }
        next.add(petId);
        writeLocalIds([...next]);
        setFavoriteIds(new Set(next));
        toast.success(t.favorites.added);
        return;
      }

      const was = favoriteIds.has(petId);
      setPendingPetId(petId);
      try {
        if (was) {
          setFavoriteIds((prev) => {
            const n = new Set(prev);
            n.delete(petId);
            return n;
          });
          await favoritesApi.remove(petId);
          toast.success(t.favorites.removed);
        } else {
          setFavoriteIds((prev) => new Set(prev).add(petId));
          await favoritesApi.add(petId);
          toast.success(t.favorites.added);
        }
      } catch (e) {
        try {
          await refreshFromServer();
        } catch {
          /* ignore */
        }
        toast.error(e instanceof Error ? e.message : t.common.error);
      } finally {
        setPendingPetId(null);
      }
    },
    [isAuthenticated, favoriteIds, refreshFromServer, t],
  );

  const value = useMemo(
    (): FavoritesContextValue => ({
      hydrated,
      favoriteIds,
      count: favoriteIds.size,
      isFavorite,
      toggleFavorite,
      refreshFromServer,
      pendingPetId,
    }),
    [hydrated, favoriteIds, isFavorite, toggleFavorite, refreshFromServer, pendingPetId],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return ctx;
}
