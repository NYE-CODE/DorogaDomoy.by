import { useState, useMemo, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router';
import { TermsPage } from './components/terms-page';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { useI18n } from './context/I18nContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { AuthModal } from './components/auth/AuthModal';
import { ContactRequiredModal } from './components/contact-required-modal';
import { toast, Toaster } from 'sonner';
import { DeleteReasonModal } from './components/delete-reason-modal';
import { City, findClosestCity, DEFAULT_CITY } from './utils/cities';
import { reverseGeocodeLocality } from './utils/geocode';
import { CitySelectModal } from './components/city-select-modal';
import { CityDetectPopup } from './components/city-detect-popup';
import { Pet } from './types/pet';
import { PetFormData } from './components/pet-form';
import { FilterState } from './components/filters';
import { petsApi } from './api/client';
import { PetCard } from './components/pet-card';
import { PetForm } from './components/pet-form';
import { Filters } from './components/filters';
import { useIsMobile } from './components/ui/use-mobile';
const MapView = lazy(() => import('./components/map-view'));
import { Map as MapIcon, List } from 'lucide-react';
import type { LatLngBounds } from 'leaflet';

type View = 'main' | 'terms';
function MainApp() {
  const { user, isAuthenticated, openAuthModal, closeAuthModal, isLoading } = useAuth();
  const { theme } = useTheme();
  const { t } = useI18n();
  const routerNavigate = useNavigate();
  const [view, setViewRaw] = useState<View>(() => {
    try {
      const saved = sessionStorage.getItem('pet_finder_view');
      if (saved && ['main', 'terms'].includes(saved)) {
        return saved as View;
      }
    } catch {}
    return 'main';
  });
  const setView = useCallback((v: View) => {
    setViewRaw(v);
    try { sessionStorage.setItem('pet_finder_view', v); } catch {}
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
    return petsApi.list()
      .then(setAllPets)
      .catch(() => setAllPets([]))
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
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (requestId === mapRequestSeqRef.current) {
          setMapPets([]);
        }
        if (err instanceof Error && err.name === 'AbortError') return;
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
  const [mobileView, setMobileView] = useState<'map' | 'list'>('list');
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
  const savedLoc = (() => {
    try {
      const saved = localStorage.getItem('pet_finder_user_location');
      if (saved) {
        const data = JSON.parse(saved);
        const { lat, lng } = data;
        if (typeof lat === 'number' && typeof lng === 'number') {
          return { lat, lng, city: (data.city || '').trim() };
        }
      }
    } catch {}
    return null;
  })();
  const initialSavedLocRef = useRef(savedLoc);

  const cityConfirmed = (() => {
    try { return localStorage.getItem('pet_finder_city_confirmed') === 'true'; } catch { return false; }
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
    } catch {}
  };
  const [selectedCity, setSelectedCity] = useState(savedLoc?.city ?? '');
  const [showCityModal, setShowCityModal] = useState(false);
  const [showCityDetectPopup, setShowCityDetectPopup] = useState(false);
  const [detectedCityName, setDetectedCityName] = useState('');
  const detectedCityRef = useRef<City | null>(null);

  useEffect(() => {
    if (cityConfirmed) return;

    const detectCity = async () => {
      try {
        const res = await fetch('http://ip-api.com/json/?fields=status,lat,lon', { signal: AbortSignal.timeout(5000) });
        const data = await res.json();
        if (data.status === 'success' && typeof data.lat === 'number' && typeof data.lon === 'number') {
          const closest = findClosestCity(data.lat, data.lon);
          detectedCityRef.current = closest;
          setDetectedCityName(closest.name);
          setShowCityDetectPopup(true);
          return;
        }
      } catch {}

      detectedCityRef.current = DEFAULT_CITY;
      setDetectedCityName(DEFAULT_CITY.name);
      setShowCityDetectPopup(true);
    };

    detectCity();
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

      setSelectedCity((prev: string) => (prev === initialSavedLoc.city ? locality : prev));
      saveUserLocation({ lat: initialSavedLoc.lat, lng: initialSavedLoc.lng }, locality);
    });

    return () => {
      cancelled = true;
    };
  }, []);

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
    setSelectedCity(city.name);
    setMapCenter(city.coordinates);
    setMapZoom(city.zoom || 12);
    saveUserLocation({ lat: city.coordinates[0], lng: city.coordinates[1] }, city.name);
    try { localStorage.setItem('pet_finder_city_confirmed', 'true'); } catch {}
  };

  const handleCityModalSelect = (city: City | null) => {
    if (city) {
      confirmCity(city);
    } else {
      setSelectedCity('');
      setMapCenter([53.7098, 27.9534]);
      setMapZoom(7);
      try { localStorage.removeItem('pet_finder_user_location'); } catch {}
    }
    try { localStorage.setItem('pet_finder_city_confirmed', 'true'); } catch {}
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

  // Calculate real-time statistics from active (non-archived) pets
  const statistics = useMemo(() => {
    const activePets = sourcePets.filter(p => !p.isArchived);
    return {
      searching: activePets.filter(p => p.status === 'searching').length,
      found: activePets.filter(p => p.status === 'found').length,
      fostering: 0,
    };
  }, [sourcePets]);

  // Show loading state while auth or data is initializing
  if (isLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  const handleCreatePet = async (formData: PetFormData) => {
    if (!user) return;
    try {
      const newPet = await petsApi.create({
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
      setAllPets((prev) => [newPet, ...prev]);
      setShowForm(false);
      routerNavigate('/my-ads');
      if (newPet.moderationStatus === 'approved') {
        toast.success(t.app.adPublished);
      } else {
        toast.success(t.app.adSentModeration, {
          description: 'После проверки оно появится на карте',
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.common.error);
    }
  };

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

  const handleDeletePet = async (reason: string) => {
    if (!deletingPet) return;
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
        });
        setAllPets((prev) => prev.map((p) => (p.id === deletingPet.id ? updated : p)));
        toast.success('Объявление перемещено в архив', { description: reason });
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
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }
    
    // Check if user has at least one contact
    const hasContacts = user?.contacts?.phone || user?.contacts?.telegram || user?.contacts?.viber;
    
    if (!hasContacts) {
      setShowContactRequiredModal(true);
      return;
    }
    
    setEditingPet(null);
    setShowForm(true);
  };

  const openEditForm = (pet: Pet) => {
    setEditingPet(pet);
    setShowForm(true);
  };

  const renderContent = () => {
    if (view === 'terms') {
      return <TermsPage onBack={() => setView('main')} />;
    }

    return (
      <div className="flex-1 max-w-[1920px] mx-auto w-full px-4 md:px-6 py-6 flex flex-col gap-6">
        {/* Filters Area */}
        <div className="shrink-0 space-y-6">
          {/* Filters - First on mobile */}
          <Filters 
            filters={filters} 
            onFiltersChange={setFilters} 
            onCreateClick={handleCreateClick}
          />

          {/* Mobile View Toggle - under filters */}
          <div className="md:hidden flex gap-2">
            <button
              onClick={() => setMobileView('list')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                mobileView === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600'
              }`}
            >
              <List className="w-4 h-4" />
              {t.app.list}
            </button>
            <button
              onClick={() => setMobileView('map')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                mobileView === 'map'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600'
              }`}
            >
              <MapIcon className="w-4 h-4" />
              {t.app.map}
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 min-h-0">
          {/* Left Sidebar - List */}
          <div className={`md:col-span-5 lg:col-span-4 flex flex-col ${mobileView === 'map' ? 'hidden md:flex' : 'flex'} md:h-[700px]`}>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex flex-col h-full max-h-full">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {selectedCity.trim()
                    ? `${selectedCity}: ${listDisplayPets.length}`
                    : `${t.app.found} ${listDisplayPets.length}`
                  }
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t.stats.searching}: {statistics.searching} · {t.stats.found}: {statistics.found} · {t.stats.fostering}: {statistics.fostering}
                </p>
                {selectedCity.trim() && listDisplayPets.length === 0 && mapDisplayPets.length > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t.app.mapHasOtherCities}
                  </p>
                )}
              </div>
              
              <div className="p-4 space-y-3 overflow-y-auto flex-1">
                {listDisplayPets.length === 0 ? (
                  <div className="text-center py-8">
                      <p className="text-gray-600 dark:text-gray-400">
                        {selectedCity.trim()
                          ? t.app.noPetsInCity.replace('{city}', selectedCity)
                          : t.app.noPetsFound
                        }
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {selectedCity.trim()
                          ? 'Переместите карту к нужному городу или измените город в шапке'
                          : 'Попробуйте изменить масштаб карты или фильтры'
                        }
                      </p>
                  </div>
                ) : (
                  listDisplayPets.map((pet) => (
                    <PetCard
                      key={pet.id}
                      pet={pet}
                      onClick={() => window.open(`/pet/${pet.id}`, '_blank')}
                      compact
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Map */}
          <div className={`md:col-span-7 lg:col-span-8 h-[500px] md:h-[700px] ${mobileView === 'list' ? 'max-h-0 overflow-hidden md:max-h-none md:overflow-visible' : 'block'}`}>
            {(!isMobile || mobileView === 'map') ? (
              <Suspense fallback={
                <div className="h-full w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-600 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
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
            ) : (
              <div className="h-full w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">{t.app.switchToMap}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header — shown for main */}
      {view === 'main' && (
        <Header 
          onViewChange={setView}
          selectedCity={selectedCity}
          onCityClick={() => setShowCityModal(true)}
        />
      )}

      {renderContent()}

      {view === 'main' && <Footer />}

      {/* Modals */}
      {showForm && (
        <PetForm 
          onClose={() => {
            setShowForm(false);
            setEditingPet(null);
          }}
          onSubmit={editingPet ? handleUpdatePet : handleCreatePet}
          initialData={editingPet || undefined}
          isEditing={!!editingPet}
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

      <Toaster theme={theme} />
    </div>
  );
}

export default function App() {
  return <MainApp />;
}