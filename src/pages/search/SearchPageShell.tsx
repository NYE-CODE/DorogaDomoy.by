import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/app/providers/AuthContext';
import { useCity } from '@/app/providers/CityContext';
import { useI18n } from '@/app/providers/I18nContext';
import { Header } from '@/widgets/layout/Header';
import { Footer } from '@/widgets/layout/Footer';
import { CitySelectModal } from '../../../components/city-select-modal';
import { CityDetectPopup } from '../../../components/city-detect-popup';
import { EMPTY_FILTER_STATE, Filters, type FilterState } from '../../../components/filters';
import { useIsMobile } from '@/shared/ui/use-mobile';
import { PageLoader } from '@/shared/ui/page-loader';
import { ActiveFilterChips } from '../../../components/search/active-filter-chips';
import { SearchLayoutToggle } from '../../../components/search/search-layout-toggle';
import {
  readSearchLayoutMode,
  saveSearchLayoutMode,
  type SearchLayoutMode,
} from '@/shared/lib/home-route';
import { readSearchView, writeSearchView, type SearchView } from './search-storage';
import { useSearchCitySetup } from './use-search-city-setup';
import { SEARCH_PETS_FETCH_LIMIT, useSearchPetsData } from './use-search-pets-data';
import { SearchListTitleBlock, SearchPageMainBody } from './search-page-main-body';

export default function SearchPage() {
  const { isLoading } = useAuth();
  const { selectedCity, saveCity, clearCity } = useCity();
  const { t } = useI18n();
  const routerNavigate = useNavigate();
  const isMobile = useIsMobile();

  const [view, setViewRaw] = useState<SearchView>(readSearchView);
  const setView = useCallback((v: SearchView) => {
    setViewRaw(v);
    writeSearchView(v);
  }, []);

  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTER_STATE);
  const pets = useSearchPetsData(view, filters);
  const city = useSearchCitySetup(saveCity, clearCity);

  const [layoutMode, setLayoutMode] = useState<SearchLayoutMode>(() => readSearchLayoutMode());
  const handleLayoutModeChange = useCallback((mode: SearchLayoutMode) => {
    setLayoutMode(mode);
    saveSearchLayoutMode(mode);
  }, []);

  const approvedAllPets = pets.allPets.filter((p) => !p.isArchived && p.moderationStatus === 'approved');
  const sourcePets =
    view === 'main' ? (pets.mapBounds && pets.mapPetsLoaded ? pets.mapPets : approvedAllPets) : pets.allPets;

  const mapDisplayPets = useMemo(() => {
    // Always drop archived — mapPets may stay stale after archive until reload.
    const active = sourcePets.filter((p) => !p.isArchived && p.moderationStatus === 'approved');
    if (filters.colors.length === 0) return active;
    return active.filter((p) => p.colors.some((c) => filters.colors.includes(c)));
  }, [sourcePets, filters.colors]);

  const listDisplayPets = useMemo(() => {
    if (!selectedCity.trim()) return mapDisplayPets;
    const cityLower = selectedCity.toLowerCase().trim();
    return mapDisplayPets.filter((p) => p.city.toLowerCase().includes(cityLower));
  }, [mapDisplayPets, selectedCity]);

  const statistics = useMemo(() => {
    const activePets = sourcePets.filter((p) => !p.isArchived);
    return {
      searching: activePets.filter((p) => p.status === 'searching').length,
      found: activePets.filter((p) => p.status === 'found').length,
      fostering: 0,
    };
  }, [sourcePets]);

  const resultsMayBeTruncated =
    (view === 'main' && pets.mapBounds && pets.mapPetsLoaded
      ? pets.mapMayBeTruncated
      : pets.listMayBeTruncated) || false;

  const openPetDetail = useCallback(
    (petId: string) => {
      if (isMobile) {
        routerNavigate(`/pet/${petId}`);
        return;
      }
      window.open(`/pet/${petId}`, '_blank', 'noopener,noreferrer');
    },
    [isMobile, routerNavigate],
  );

  const filterChipLabels = useMemo(
    () => ({
      animalType: t.pet.animalType as Record<string, string>,
      daysAll: t.common.all,
      daysLabel: (days: number) => `${t.filters.period}: ${days}`,
      color: t.pet.color as Record<string, string>,
      status: t.pet.status as Record<string, string>,
      reset: t.filters.reset,
      searchChip: t.filters.searchChip,
    }),
    [t],
  );

  if (isLoading || pets.dataLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background dark:bg-background">
        {view === 'main' && <Header selectedCity={selectedCity} onCityClick={() => city.setShowCityModal(true)} />}
        <PageLoader label={t.common.loading} className="min-h-0 flex-1" />
      </div>
    );
  }

  const searchToolbar =
    view === 'main' ? (
      <div className="shrink-0 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="page-container space-y-3 px-4 py-3 sm:px-6">
          <Filters filters={filters} onFiltersChange={setFilters} variant="page" />
          <ActiveFilterChips
            filters={filters}
            labels={filterChipLabels}
            onRemove={(next) => setFilters((prev) => ({ ...prev, ...next }))}
            onReset={() => setFilters(EMPTY_FILTER_STATE)}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SearchListTitleBlock
              selectedCity={selectedCity}
              listDisplayPets={listDisplayPets}
              mapDisplayPets={mapDisplayPets}
              statistics={statistics}
              resultsMayBeTruncated={resultsMayBeTruncated}
              fetchLimit={SEARCH_PETS_FETCH_LIMIT}
              t={t}
            />
            <SearchLayoutToggle mode={layoutMode} onChange={handleLayoutModeChange} />
          </div>
        </div>
      </div>
    ) : null;

  return (
    <div className="flex min-h-screen flex-col bg-background dark:bg-background">
      {view === 'main' && <Header selectedCity={selectedCity} onCityClick={() => city.setShowCityModal(true)} />}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {searchToolbar}
        <SearchPageMainBody
          view={view}
          isMobile={isMobile}
          layoutMode={layoutMode}
          selectedCity={selectedCity}
          listDisplayPets={listDisplayPets}
          mapDisplayPets={mapDisplayPets}
          mapCenter={city.mapCenter}
          mapZoom={city.mapZoom}
          t={t}
          onViewChange={setView}
          onLayoutModeChange={handleLayoutModeChange}
          onPetClick={openPetDetail}
          onBoundsChange={pets.setMapBounds}
        />
      </div>

      {view === 'main' && !isMobile && <Footer />}

      <CitySelectModal
        open={city.showCityModal}
        onClose={() => city.setShowCityModal(false)}
        onSelect={city.handleCityModalSelect}
        currentCity={selectedCity}
      />

      <CityDetectPopup
        open={city.showCityDetectPopup}
        detectedCity={city.detectedCityName}
        onConfirm={city.handleCityDetectConfirm}
        onReject={city.handleCityDetectReject}
      />
    </div>
  );
}
