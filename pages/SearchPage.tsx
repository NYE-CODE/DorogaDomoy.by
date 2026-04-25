import { useState, useMemo, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router';
import { TermsPage } from '../components/terms-page';
import { useAuth } from '../context/AuthContext';
import { useCity } from '../context/CityContext';
import { useI18n } from '../context/I18nContext';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { AuthModal } from '../components/auth/AuthModal';
import { ContactRequiredModal } from '../components/contact-required-modal';
import { toast } from 'sonner';
import { DeleteReasonModal } from '../components/delete-reason-modal';
import { City, findClosestCity, DEFAULT_CITY } from '../utils/cities';
import { reverseGeocodeLocality } from '../utils/geocode';
import { CitySelectModal } from '../components/city-select-modal';
import { CityDetectPopup } from '../components/city-detect-popup';
import { Pet } from '../types/pet';
import { PetFormData } from '../components/pet-form';
import { FilterState } from '../components/filters';
import { petsApi } from '../api/client';
import { PetCard } from '../components/pet-card';
import { PetForm } from '../components/pet-form';
import { Filters } from '../components/filters';
import { MobileListSheet } from '../components/mobile-list-sheet';
import { useIsMobile } from '../components/ui/use-mobile';
import { useAuthenticatedAction } from '../utils/use-authenticated-action';
import { PageLoader } from '../components/ui/page-loader';
import { EmptyState } from '../components/ui/empty-state';
import { ActiveFilterChips } from '../components/search/active-filter-chips';
const MapView = lazy(() => import('../components/map-view'));
import { SlidersHorizontal } from 'lucide-react';
import type { LatLngBounds } from 'leaflet';

type View = 'main' | 'terms';

export default function SearchPage() {
  const { user, closeAuthModal, isLoading } = useAuth();
  const { runWhenAuthed } = useAuthenticatedAction();
  const { selectedCity, saveCity, clearCity } = useCity();
  const { t } = useI18n();
  const routerNavigate = useNavigate();
  const [view, setViewRaw] = useState<View>(() => {
    try {
      const saved = sessionStorage.getItem('pet_finder_view');
      if (saved && ['main', 'terms'].includes(saved)) {
        return saved as View;
      }
    } catch (err: unknown) {
      console.warn('[SearchPage] read pet_finder_view from sessionStorage failed', err);
    }
    return 'main';
  });
  const setView = useCallback((v: View) => {
    setViewRaw(v);
    try {
      sessionStorage.setItem('pet_finder_view', v);
    } catch (err: unknown) {
      console.warn('[SearchPage] write pet_finder_view to sessionStorage failed', err);
    }
  }, []);
  const [allPets, setAllPets] = useState<Pet[]>([]);
  const [mapPets, setMapPets] = useState<Pet[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const isMobile = useIsMobile();
  const viewRef = useRef<View>('main');
  viewRef.current = view;
  const mapBoundsRef = useRef<LatLngBounds | null>(null);
  const filtersRef = useRef<FilterState | null>(null);
  const mapRequestAbortRef = useRef<AbortController | null>(null);
  const mapRequestSeqRef = useRef(0);


  const loadAllPets = useCallback((showLoading = false): Promise<void> => {
    if (showLoading) setDataLoading(true);
    return petsApi
      .list()
      .then(setAllPets)
      .catch((err: unknown) => {
        console.warn('[SearchPage] loadAllPets failed', err);
        setAllPets([]);
      })
      .finally(() => {
        if (showLoading) setDataLoading(false);
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

    return petsApi.list(params, { signal: controller.signal })
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
      const petsPromise = viewRef.current === 'main' && mapBoundsRef.current
        ? loadMapPets(false)
        : loadAllPets(false);
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
  const [showForm, setShowForm] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [deletingPet, setDeletingPet] = useState<Pet | null>(null);
  const [showContactRequiredModal, setShowContactRequiredModal] = useState(false);
  const [listFilterOpen, setListFilterOpen] = useState(false);
  const [mapBounds, setMapBounds] = useState<LatLngBounds | null>(null);
  const [mapPetsLoaded, setMapPetsLoaded] = useState(false);
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
    };
  }, []);
  const getSavedLocation = useCallback((): { lat: number; lng: number; city?: string } | null => {
    try {
      const saved = localStorage.getItem('pet_finder_user_location');
      if (!saved) return null;
      const data = JSON.parse(saved);
      const { lat, lng } = data;
      if (typeof lat === 'number' && typeof lng === 'number') {
        return { lat, lng, city: (data.city || '').trim() };
      }
    } catch (err: unknown) {
      console.warn('[SearchPage] getSavedLocation parse failed', err);
    }
    return null;
  }, []);

  const savedLoc = getSavedLocation();
  const initialSavedLocRef = useRef(savedLoc);

  const cityConfirmed = (() => {
    try {
      return localStorage.getItem('pet_finder_city_confirmed') === 'true';
    } catch (err: unknown) {
      console.warn('[SearchPage] read pet_finder_city_confirmed failed', err);
      return false;
    }
  })();

  const belarusCenter: [number, number] = [53.7098, 27.9534];
  const belarusZoom = 7;

  const [mapCenter, setMapCenter] = useState<[number, number]>(
    savedLoc ? [savedLoc.lat, savedLoc.lng] : (cityConfirmed ? belarusCenter : [53.9006, 27.5590])
  );
  const [mapZoom, setMapZoom] = useState(
    savedLoc ? (savedLoc.city ? 13 : belarusZoom) : (cityConfirmed ? belarusZoom : 12)
  );

  const saveUserLocation = (loc: { lat: number; lng: number }, city?: string) => {
    try {
      const toSave: { lat: number; lng: number; city?: string } = { lat: loc.lat, lng: loc.lng };
      if (city) toSave.city = city;
      localStorage.setItem('pet_finder_user_location', JSON.stringify(toSave));
    } catch (err: unknown) {
      console.warn('[SearchPage] saveUserLocation storage failed', err);
    }
  };
  const [showCityModal, setShowCityModal] = useState(false);
  const [showCityDetectPopup, setShowCityDetectPopup] = useState(false);
  const [detectedCityName, setDetectedCityName] = useState('');
  const detectedCityRef = useRef<City | null>(null);

  useEffect(() => {
    if (cityConfirmed) return;

    const ac = new AbortController();
    const timeoutMs = 5000;
    const timeoutId = window.setTimeout(() => ac.abort(), timeoutMs);

    const detectCity = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/', { signal: ac.signal });
        clearTimeout(timeoutId);
        const data = await res.json();
        if (ac.signal.aborted) return;
        if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
          const closest = findClosestCity(data.latitude, data.longitude);
          detectedCityRef.current = closest;
          setDetectedCityName(closest.name);
          setShowCityDetectPopup(true);
          return;
        }
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        if (
          (err instanceof DOMException || err instanceof Error) &&
          err.name === 'AbortError'
        )
          return;
        console.warn('[SearchPage] IP geolocation (ipapi.co) failed', err);
      }

      if (ac.signal.aborted) return;
      detectedCityRef.current = DEFAULT_CITY;
      setDetectedCityName(DEFAULT_CITY.name);
      setShowCityDetectPopup(true);
    };

    void detectCity();

    return () => {
      clearTimeout(timeoutId);
      ac.abort();
    };
  }, [cityConfirmed]);

  const [filters, setFilters] = useState<FilterState>({
    animalType: 'all',
    breed: '',
    colors: [],
    statuses: [],
    days: 'all',
    searchQuery: '',
  });
  filtersRef.current = filters;

  useEffect(() => {
    const initialSavedLoc = initialSavedLocRef.current;
    if (!initialSavedLoc?.city || !initialSavedLoc.city.includes(',')) return;

    let cancelled = false;
    reverseGeocodeLocality(initialSavedLoc.lat, initialSavedLoc.lng).then((locality) => {
      if (cancelled || !locality || locality === initialSavedLoc.city) return;

      saveCity(initialSavedLoc.lat, initialSavedLoc.lng, locality);
      saveUserLocation({ lat: initialSavedLoc.lat, lng: initialSavedLoc.lng }, locality);
    });

    return () => {
      cancelled = true;
    };
  }, [saveCity]);

  useEffect(() => {
    if (view !== 'main' || !mapBoundsRef.current) return;
    const timer = setTimeout(() => {
      loadMapPets(false).then(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [
    view,
    filters.animalType,
    filters.breed,
    filters.days,
    filters.searchQuery,
    filters.statuses,
    loadMapPets,
  ]);

  const confirmCity = (city: City) => {
    saveCity(city.coordinates[0], city.coordinates[1], city.name);
    setMapCenter(city.coordinates);
    setMapZoom(city.zoom || 12);
    saveUserLocation({ lat: city.coordinates[0], lng: city.coordinates[1] }, city.name);
  };

  const handleCityModalSelect = (city: City | null) => {
    if (city) {
      confirmCity(city);
    } else {
      clearCity();
      setMapCenter([53.7098, 27.9534]);
      setMapZoom(7);
    }
    setShowCityModal(false);
  };

  const handleCityDetectConfirm = () => {
    const city = detectedCityRef.current;
    if (city) confirmCity(city);
    setShowCityDetectPopup(false);
  };

  const handleCityDetectReject = () => {
    setShowCityDetectPopup(false);
    setShowCityModal(true);
  };

  const approvedAllPets = allPets.filter(p => !p.isArchived && p.moderationStatus === 'approved');
  const sourcePets = view === 'main'
    ? (mapBounds && mapPetsLoaded ? mapPets : approvedAllPets)
    : allPets;

  const mapDisplayPets = useMemo(() => {
    if (filters.colors.length === 0) return sourcePets;
    return sourcePets.filter(p =>
      p.colors.some(c => filters.colors.includes(c))
    );
  }, [sourcePets, filters.colors]);

  const listDisplayPets = useMemo(() => {
    if (!selectedCity.trim()) return mapDisplayPets;
    const cityLower = selectedCity.toLowerCase().trim();
    return mapDisplayPets.filter(p => p.city.toLowerCase().includes(cityLower));
  }, [mapDisplayPets, selectedCity]);

  const statistics = useMemo(() => {
    const activePets = sourcePets.filter(p => !p.isArchived);
    return {
      searching: activePets.filter(p => p.status === 'searching').length,
      found: activePets.filter(p => p.status === 'found').length,
      fostering: 0,
    };
  }, [sourcePets]);

  if (isLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-background dark:bg-gray-900 flex flex-col">
        {view === 'main' && <Header selectedCity={selectedCity} onCityClick={() => setShowCityModal(true)} />}
        <PageLoader label={t.common.loading} className="min-h-0 flex-1" />
      </div>
    );
  }

  const handleUpdatePet = async (formData: PetFormData) => {
    if (!editingPet) return;
    try {
      const updatedPet = await petsApi.update(editingPet.id, {
        photos: formData.photos,
        animalType: formData.animalType,
        breed: formData.breed,
        colors: formData.colors,
        gender: formData.gender,
        approximateAge: formData.approximateAge,
        status: formData.status,
        description: formData.description,
        city: formData.city,
        location: formData.location,
        contacts: formData.contacts,
      });
      setAllPets((prev) => prev.map((p) => (p.id === editingPet.id ? updatedPet : p)));
      setEditingPet(null);
      setShowForm(false);
      if (updatedPet.moderationStatus === 'pending') {
        toast.success('Объявление обновлено и отправлено на модерацию');
      } else {
        toast.success(t.app.adUpdated);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.common.error);
    }
  };

  const handleDeletePet = async (payload: { reason: string; rewardHelperCode?: string }) => {
    if (!deletingPet) return;
    const reason = payload.reason;
    const archiveReasons = [
      'Питомец вернулся домой / найден хозяин',
      'Питомец пристроен в новую семью',
      'Питомец передан в приют',
    ];
    const isArchiveReason = archiveReasons.includes(reason);
    try {
      if (isArchiveReason) {
        const updated = await petsApi.update(deletingPet.id, {
          isArchived: true,
          archiveReason: reason,
          rewardHelperCode: payload.rewardHelperCode,
        });
        setAllPets((prev) => prev.map((p) => (p.id === deletingPet.id ? updated : p)));
        toast.success('Объявление перемещено в архив', {
          description: payload.rewardHelperCode
            ? `Начислены очки пользователю ${payload.rewardHelperCode}`
            : reason,
        });
      } else {
        await petsApi.delete(deletingPet.id);
        setAllPets((prev) => prev.filter((p) => p.id !== deletingPet.id));
        toast.success('Объявление удалено');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.common.error);
    }
    setDeletingPet(null);
  };

  const handleCreateClick = () => {
    runWhenAuthed(() => {
      const hasContacts = user?.contacts?.phone || user?.contacts?.telegram || user?.contacts?.viber;
      if (!hasContacts) {
        setShowContactRequiredModal(true);
        return;
      }
      routerNavigate('/create');
    });
  };

  const openEditForm = (pet: Pet) => {
    setEditingPet(pet);
    setShowForm(true);
  };

  const activeFilterCount = [
    filters.animalType !== 'all',
    filters.breed !== '',
    filters.colors.length > 0,
    filters.statuses.length > 0,
    filters.days !== 'all',
    filters.searchQuery.trim() !== '',
  ].filter(Boolean).length;

  const renderContent = () => {
    if (view === 'terms') {
      return <TermsPage onBack={() => setView('main')} />;
    }

    const listTitleRow = (
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground">
            {selectedCity.trim()
              ? `${selectedCity}: ${listDisplayPets.length}`
              : `${t.app.found} ${listDisplayPets.length}`}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {t.stats.searching}: {statistics.searching} · {t.stats.found}: {statistics.found} ·{' '}
            {t.stats.fostering}: {statistics.fostering}
          </p>
          {selectedCity.trim() && listDisplayPets.length === 0 && mapDisplayPets.length > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">{t.app.mapHasOtherCities}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setListFilterOpen((o) => !o)}
          aria-expanded={listFilterOpen}
          aria-controls="search-list-filters-panel"
          className={`relative inline-flex shrink-0 items-center gap-2 rounded-xl border border-transparent px-2 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground ${listFilterOpen ? 'border-border bg-accent text-foreground' : ''}`}
          title={t.filters.filters}
        >
          <SlidersHorizontal className="size-5 shrink-0" aria-hidden />
          <span className="hidden max-w-[7rem] truncate text-sm font-medium sm:inline">{t.filters.filters}</span>
          {activeFilterCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>
    );

    const listFiltersPanel = listFilterOpen && (
      <div id="search-list-filters-panel" className="mt-4" role="region" aria-label={t.filters.filters}>
        <Filters
          filters={filters}
          onFiltersChange={setFilters}
          embedded
          onClose={() => setListFilterOpen(false)}
        />
      </div>
    );

    const listChips = (
      <ActiveFilterChips
        filters={filters}
        labels={{
          animalType: t.pet.animalType as Record<string, string>,
          daysAll: t.common.all,
          daysLabel: (days) => `${t.filters.period}: ${days}`,
          color: t.pet.color as Record<string, string>,
          status: t.pet.status as Record<string, string>,
          reset: t.filters.reset,
          searchChip: t.filters.searchChip,
        }}
        onRemove={(next) => setFilters((prev) => ({ ...prev, ...next }))}
        onReset={() =>
          setFilters({
            animalType: 'all',
            breed: '',
            colors: [],
            statuses: [],
            days: 'all',
            searchQuery: '',
          })
        }
      />
    );

    const listBodyContent = listDisplayPets.length === 0 ? (
      <div className="p-4">
        <EmptyState
          title={selectedCity.trim()
            ? t.app.noPetsInCity.replace('{city}', selectedCity)
            : t.app.noPetsFound}
          description={selectedCity.trim()
            ? 'В выбранном городе сейчас нет объявлений в видимой области карты.'
            : 'По текущим фильтрам объявлений не найдено.'}
          hint={selectedCity.trim()
            ? 'Переместите карту к нужному городу или измените город в шапке.'
            : 'Попробуйте изменить масштаб карты или сбросить часть фильтров.'}
          className="p-6 md:p-8"
        />
      </div>
    ) : (
      <div className="space-y-3 p-3 sm:space-y-4 sm:p-4">
        {listDisplayPets.map((pet) => (
          <PetCard
            key={pet.id}
            pet={pet}
            onClick={() => window.open(`/pet/${pet.id}`, '_blank')}
            compact
          />
        ))}
      </div>
    );

    /** Десктоп: фильтры в шапке карточки. Мобильная нижняя полка — см. listMobileSheetScroll. */
    const listHeaderContent = (
      <div className="border-b border-border p-4">
        {listTitleRow}
        {listFiltersPanel}
        {listChips}
      </div>
    );

    /** Мобильная полка: только заголовок и чипы; панель фильтров — в прокрутке со списком. */
    const listMobileSheetHeader = (
      <div className="border-b border-border p-4">
        {listTitleRow}
        {listChips}
      </div>
    );

    const listMobileSheetScroll = (
      <>
        {listFilterOpen && (
          <div
            id="search-list-filters-panel"
            className="border-b border-border px-4 pb-4 pt-2"
            role="region"
            aria-label={t.filters.filters}
          >
            <Filters
              filters={filters}
              onFiltersChange={setFilters}
              embedded
              onClose={() => setListFilterOpen(false)}
            />
          </div>
        )}
        {listBodyContent}
      </>
    );

    if (isMobile) {
      return (
        <div className="flex-1 flex flex-col min-h-0 w-full">
          <div className="flex-1 min-h-0 relative w-full">
            <div className="absolute inset-0">
              <Suspense fallback={
                <div className="h-full w-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-600 border-t-primary rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm">{t.app.mapLoading}</p>
                  </div>
                </div>
              }>
                <MapView
                  pets={mapDisplayPets}
                  onPetClick={(pet) => window.open(`/pet/${pet.id}`, '_blank')}
                  onBoundsChange={setMapBounds}
                  center={mapCenter}
                  zoom={mapZoom}
                />
              </Suspense>
            </div>
            <MobileListSheet header={listMobileSheetHeader}>{listMobileSheetScroll}</MobileListSheet>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 min-h-0">
          <div className="md:col-span-5 lg:col-span-4 flex flex-col md:h-[700px]">
            <div className="flex h-full max-h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              {listHeaderContent}
              <div className="overflow-y-auto flex-1 min-h-0">
                {listBodyContent}
              </div>
            </div>
          </div>

          <div className="md:col-span-7 lg:col-span-8 h-[500px] md:h-[700px]">
            <Suspense fallback={
              <div className="h-full w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-600 border-t-primary rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm">{t.app.mapLoading}</p>
                </div>
              </div>
            }>
              <MapView
                pets={mapDisplayPets}
                onPetClick={(pet) => window.open(`/pet/${pet.id}`, '_blank')}
                onBoundsChange={setMapBounds}
                center={mapCenter}
                zoom={mapZoom}
              />
            </Suspense>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900 flex flex-col">
      {view === 'main' && <Header selectedCity={selectedCity} onCityClick={() => setShowCityModal(true)} />}

      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {renderContent()}
      </div>

      {view === 'main' && !isMobile && <Footer />}

      {showForm && editingPet && (
        <PetForm
          onClose={() => {
            setShowForm(false);
            setEditingPet(null);
          }}
          onSubmit={handleUpdatePet}
          initialData={editingPet}
          isEditing
        />
      )}

      <AuthModal onNavigateToTerms={() => {
        closeAuthModal();
        setView('terms');
      }} />

      {deletingPet && (
        <DeleteReasonModal
          onClose={() => setDeletingPet(null)}
          onConfirm={handleDeletePet}
          enableRewardSection={
            deletingPet.status === 'searching' && deletingPet.rewardMode === 'points'
          }
          rewardPoints={deletingPet.rewardPoints ?? 50}
          petDescription={`${deletingPet.animalType === 'cat' ? 'Кот' : deletingPet.animalType === 'dog' ? 'Собака' : 'Животное'} ${deletingPet.breed ? '(' + deletingPet.breed + ')' : ''} - ${deletingPet.city}`}
        />
      )}

      <ContactRequiredModal
        open={showContactRequiredModal}
        onClose={() => setShowContactRequiredModal(false)}
        onGoToProfile={() => {
          setShowContactRequiredModal(false);
          routerNavigate('/profile');
        }}
      />

      <CitySelectModal
        open={showCityModal}
        onClose={() => setShowCityModal(false)}
        onSelect={handleCityModalSelect}
        currentCity={selectedCity}
      />

      <CityDetectPopup
        open={showCityDetectPopup}
        detectedCity={detectedCityName}
        onConfirm={handleCityDetectConfirm}
        onReject={handleCityDetectReject}
      />

    </div>
  );
}
