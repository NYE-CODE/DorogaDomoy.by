import { useCallback, useEffect, useRef, useState } from 'react';
import type { LatLngBounds } from 'leaflet';
import type { Pet } from '@/entities/pet/model/types';
import { petsApi } from '@/shared/api/client';
import type { FilterState } from '../../../components/filters';
import type { SearchView } from './search-storage';

/** Soft cap for list/map fetches — show truncation UX when result hits this. */
export const SEARCH_PETS_FETCH_LIMIT = 500;

export function useSearchPetsData(view: SearchView, filters: FilterState) {
  const [allPets, setAllPets] = useState<Pet[]>([]);
  const [mapPets, setMapPets] = useState<Pet[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [mapBounds, setMapBounds] = useState<LatLngBounds | null>(null);
  const [mapPetsLoaded, setMapPetsLoaded] = useState(false);

  const viewRef = useRef<SearchView>('main');
  viewRef.current = view;
  const mapBoundsRef = useRef<LatLngBounds | null>(null);
  const filtersRef = useRef<FilterState | null>(null);
  const mapRequestAbortRef = useRef<AbortController | null>(null);
  const listRequestAbortRef = useRef<AbortController | null>(null);
  const mapRequestSeqRef = useRef(0);
  const listRequestSeqRef = useRef(0);

  filtersRef.current = filters;

  const loadAllPets = useCallback((showLoading = false): Promise<void> => {
    if (showLoading) setDataLoading(true);
    listRequestAbortRef.current?.abort();
    const controller = new AbortController();
    listRequestAbortRef.current = controller;
    const requestId = ++listRequestSeqRef.current;
    return petsApi
      // Explicit for admin tokens: without is_archived=false the API returns archive too.
      .list(
        { moderation_status: 'approved', is_archived: false, limit: SEARCH_PETS_FETCH_LIMIT },
        { signal: controller.signal },
      )
      .then((list) => {
        if (requestId === listRequestSeqRef.current) setAllPets(list);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        console.warn('[SearchPage] loadAllPets failed', err);
        if (requestId === listRequestSeqRef.current) setAllPets([]);
      })
      .finally(() => {
        if (showLoading && requestId === listRequestSeqRef.current) {
          setDataLoading(false);
        }
      });
  }, []);

  const loadMapPets = useCallback((showLoading = false): Promise<void> => {
    if (showLoading) setDataLoading(true);
    const currentBounds = mapBoundsRef.current;
    const currentFilters = filtersRef.current;

    mapRequestAbortRef.current?.abort();
    const controller = new AbortController();
    mapRequestAbortRef.current = controller;
    const requestId = ++mapRequestSeqRef.current;

    const params: Parameters<typeof petsApi.list>[0] = {
      moderation_status: 'approved',
      is_archived: false,
      limit: SEARCH_PETS_FETCH_LIMIT,
    };

    if (currentBounds) {
      params.north = currentBounds.getNorth();
      params.south = currentBounds.getSouth();
      params.east = currentBounds.getEast();
      params.west = currentBounds.getWest();
    }

    if (currentFilters) {
      if (currentFilters.animalType !== 'all') {
        params.animal_type = currentFilters.animalType;
      }
      if (currentFilters.breed.trim()) {
        params.breed = currentFilters.breed.trim();
      }
      if (currentFilters.days !== 'all') {
        params.days = currentFilters.days;
      }
      if (currentFilters.searchQuery.trim()) {
        params.search = currentFilters.searchQuery.trim();
      }
      if (currentFilters.statuses.length > 0) {
        params.statuses = currentFilters.statuses.join(',');
      }
    }

    return petsApi
      .list(params, { signal: controller.signal })
      .then((list) => {
        if (requestId === mapRequestSeqRef.current) {
          setMapPets(list);
        }
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (requestId === mapRequestSeqRef.current) {
          setMapPets([]);
        }
        if (err instanceof Error && err.name === 'AbortError') return;
        console.warn('[SearchPage] loadMapPets failed', err);
      })
      .finally(() => {
        if (showLoading) setDataLoading(false);
      });
  }, []);

  const didInitRef = useRef(false);
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    loadAllPets(true);
  }, [loadAllPets]);

  useEffect(() => {
    let lastRefresh = Date.now();
    const THROTTLE_MS = 30_000;

    const refresh = () => {
      const now = Date.now();
      if (now - lastRefresh < THROTTLE_MS) return;
      lastRefresh = now;
      const petsPromise =
        viewRef.current === 'main' && mapBoundsRef.current ? loadMapPets(false) : loadAllPets(false);
      petsPromise.then(() => {});
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };

    document.addEventListener('visibilitychange', onVisibility);
    const interval = setInterval(refresh, 60_000);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      clearInterval(interval);
    };
  }, [loadMapPets, loadAllPets]);

  useEffect(() => {
    mapBoundsRef.current = mapBounds;
  }, [mapBounds]);

  useEffect(() => {
    if (view !== 'main') {
      loadAllPets(false).then(() => {});
      return;
    }
    if (mapBoundsRef.current) loadMapPets(false).then(() => {});
  }, [view, loadMapPets, loadAllPets]);

  useEffect(() => {
    if (view !== 'main' || !mapBounds) return;
    const timer = setTimeout(() => {
      loadMapPets(false).then(() => setMapPetsLoaded(true));
    }, 300);
    return () => clearTimeout(timer);
  }, [view, mapBounds, loadMapPets]);

  useEffect(() => {
    return () => {
      mapRequestAbortRef.current?.abort();
      listRequestAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (view !== 'main' || !mapBoundsRef.current) return;
    const timer = setTimeout(() => {
      loadMapPets(false).then(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [view, filters.animalType, filters.breed, filters.days, filters.searchQuery, filters.statuses, loadMapPets]);

  const listMayBeTruncated = allPets.length >= SEARCH_PETS_FETCH_LIMIT;
  const mapMayBeTruncated = mapPets.length >= SEARCH_PETS_FETCH_LIMIT;

  return {
    allPets,
    setAllPets,
    mapPets,
    setMapPets,
    dataLoading,
    mapBounds,
    setMapBounds,
    mapPetsLoaded,
    listMayBeTruncated,
    mapMayBeTruncated,
  };
}
