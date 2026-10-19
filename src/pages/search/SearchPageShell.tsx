import { useCallback, useEffect, useMemo, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { useAuth } from '@/app/providers/AuthContext';
import { useCity } from '@/app/providers/CityContext';
import { useI18n } from '@/app/providers/I18nContext';
import { Header } from '@/widgets/layout/Header';
import { Footer } from '@/widgets/layout/Footer';
import { CitySelectModal } from '../../../components/city-select-modal';
import { CityDetectPopup } from '../../../components/city-detect-popup';
import {
  EMPTY_FILTER_STATE,
  Filters,
  SearchQueryInput,
  countActiveFilters,
  type FilterState,
} from '../../../components/filters';
import { useIsMobile } from '@/shared/ui/use-mobile';
import { PageLoader } from '@/shared/ui/page-loader';
import { ActiveFilterChips } from '../../../components/search/active-filter-chips';
import { SearchLayoutToggle } from '../../../components/search/search-layout-toggle';
import { SearchSortSelect } from '../../../components/search/search-sort-select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import {
  readSearchLayoutMode,
  saveSearchLayoutMode,
  type SearchLayoutMode,
} from '@/shared/lib/home-route';
import { findCityBySlug } from '@/shared/lib/cities';
import {
  applySeo,
  canonicalUrlFromPath,
  getSiteOrigin,
  SEO_KEYWORDS,
  SEO_ROBOTS_PUBLIC,
  SEO_SEARCH_DESCRIPTION,
  SEO_SEARCH_TITLE,
  truncateMetaDescription,
} from '@/shared/lib/seo';
import { getPaginationMeta, paginateArray } from '@/shared/lib/pagination';
import { readSearchPageQuery } from './search-query';
import { readSearchView, writeSearchView, type SearchView } from './search-storage';
import { useSearchCitySetup } from './use-search-city-setup';
import { SEARCH_PETS_FETCH_LIMIT, useSearchPetsData } from './use-search-pets-data';
import {
  SEARCH_LIST_PAGE_SIZE,
  filterSearchPets,
  sortSearchPets,
  type SearchSortMode,
} from './search-list-helpers';
import { SearchListTitleBlock, SearchPageMainBody } from './search-page-main-body';
import { cn } from '@/shared/ui/utils';

/**
 * Каркас магазина:
 * Header
 * page-container → топбар (поиск / чипы / toggle / счётчик)
 *               → ряд: sidebar фильтров | контент (сетка или карта)
 * Footer (list)
 */
export default function SearchPage() {
  const { isLoading } = useAuth();
  const { selectedCity, saveCity, clearCity, setSelectedCity } = useCity();
  const { t } = useI18n();
  const routerNavigate = useNavigate();
  const location = useLocation();
  const { slug: citySlugParam } = useParams<{ slug?: string }>();
  const isMobile = useIsMobile();

  const [view, setViewRaw] = useState<SearchView>(readSearchView);
  const setView = useCallback((v: SearchView) => {
    setViewRaw(v);
    writeSearchView(v);
  }, []);

  const pageQuery = useMemo(() => {
    const q = readSearchPageQuery(location.search);
    const fromSlug = citySlugParam ? findCityBySlug(citySlugParam) : undefined;
    if (fromSlug) {
      return { ...q, cityName: fromSlug.name, city: fromSlug };
    }
    return q;
  }, [location.search, citySlugParam]);

  const [filters, setFilters] = useState<FilterState>(() => ({
    ...EMPTY_FILTER_STATE,
    statuses: readSearchPageQuery(typeof window !== 'undefined' ? window.location.search : '').statuses,
    animalType: readSearchPageQuery(typeof window !== 'undefined' ? window.location.search : '').animalType,
  }));

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      statuses: pageQuery.statuses,
      animalType: pageQuery.animalType,
    }));
  }, [pageQuery.statuses, pageQuery.animalType]);

  const pets = useSearchPetsData(view, filters);
  const city = useSearchCitySetup(saveCity, clearCity, pageQuery.cityName, setSelectedCity);

  useEffect(() => {
    const fromSlug = citySlugParam ? findCityBySlug(citySlugParam) : undefined;
    if (fromSlug) {
      const title = `Пропавшие и найденные животные — ${fromSlug.name} | DorogaDomoy.by`;
      const description = truncateMetaDescription(
        `Объявления о пропавших и найденных собаках и кошках в городе ${fromSlug.name}. Карта, фото и контакты на DorogaDomoy.by.`,
      );
      applySeo({
        title,
        description,
        canonicalUrl: canonicalUrlFromPath(`/city/${citySlugParam}`),
        robots: SEO_ROBOTS_PUBLIC,
        keywords: SEO_KEYWORDS,
        imageUrl: `${getSiteOrigin()}/logo.png`,
        ogType: 'website',
      });
      return;
    }
    if (!citySlugParam) {
      applySeo({
        title: SEO_SEARCH_TITLE,
        description: SEO_SEARCH_DESCRIPTION,
        canonicalUrl: canonicalUrlFromPath('/search'),
        robots: SEO_ROBOTS_PUBLIC,
        keywords: SEO_KEYWORDS,
        imageUrl: `${getSiteOrigin()}/logo.png`,
        ogType: 'website',
      });
    }
  }, [citySlugParam]);

  const [layoutMode, setLayoutMode] = useState<SearchLayoutMode>(() => readSearchLayoutMode());
  const handleLayoutModeChange = useCallback((mode: SearchLayoutMode) => {
    setLayoutMode(mode);
    saveSearchLayoutMode(mode);
  }, []);

  const [sortMode, setSortMode] = useState<SearchSortMode>('newest');
  const [listPage, setListPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const activeFilterCount =
    countActiveFilters(filters) + (selectedCity.trim() ? 1 : 0);

  const handleClearCity = useCallback(() => {
    city.handleCityModalSelect(null);
  }, [city]);

  const approvedAllPets = useMemo(
    () => pets.allPets.filter((p) => !p.isArchived && p.moderationStatus === 'approved'),
    [pets.allPets],
  );

  /** Список — все объявления; карта — объявления в viewport (когда уже подгружены). */
  const sourcePets = useMemo(() => {
    if (view !== 'main') return pets.allPets;
    if (layoutMode === 'map' && pets.mapBounds && pets.mapPetsLoaded) return pets.mapPets;
    return approvedAllPets;
  }, [
    view,
    layoutMode,
    pets.allPets,
    pets.mapPets,
    pets.mapBounds,
    pets.mapPetsLoaded,
    approvedAllPets,
  ]);

  const filteredPets = useMemo(
    () => filterSearchPets(sourcePets, filters, selectedCity),
    [sourcePets, filters, selectedCity],
  );

  const sortedPets = useMemo(
    () => sortSearchPets(filteredPets, sortMode),
    [filteredPets, sortMode],
  );

  const listPagination = useMemo(
    () =>
      getPaginationMeta({
        page: listPage,
        pageSize: SEARCH_LIST_PAGE_SIZE,
        totalItems: sortedPets.length,
      }),
    [listPage, sortedPets.length],
  );

  const listPagePets = useMemo(
    () =>
      paginateArray(sortedPets, {
        page: listPagination.page,
        pageSize: SEARCH_LIST_PAGE_SIZE,
        totalItems: sortedPets.length,
      }),
    [sortedPets, listPagination.page],
  );

  /** Карта показывает все отфильтрованные; список — текущую страницу. */
  const mapDisplayPets = sortedPets;
  const listDisplayPets = layoutMode === 'list' ? listPagePets : sortedPets;

  useEffect(() => {
    setListPage(1);
  }, [filters, selectedCity, sortMode, layoutMode]);

  useEffect(() => {
    if (listPage !== listPagination.page) {
      setListPage(listPagination.page);
    }
  }, [listPage, listPagination.page]);

  const handleListPageChange = useCallback((page: number) => {
    setListPage(page);
    document.getElementById('main-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const statistics = useMemo(() => {
    const activePets = sourcePets.filter((p) => !p.isArchived);
    return {
      searching: activePets.filter((p) => p.status === 'searching').length,
      found: activePets.filter((p) => p.status === 'found').length,
      fostering: 0,
    };
  }, [sourcePets]);

  const resultsMayBeTruncated =
    (layoutMode === 'map' && pets.mapBounds && pets.mapPetsLoaded
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
      color: t.pet.color as Record<string, string>,
      status: t.pet.status as Record<string, string>,
      reset: t.filters.reset,
      searchChip: t.filters.searchChip,
      regionChip: t.filters.regionChip,
    }),
    [t],
  );

  const handleResetAllFilters = useCallback(() => {
    setFilters(EMPTY_FILTER_STATE);
    handleClearCity();
  }, [handleClearCity]);

  if (isLoading || pets.dataLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-landing">
        {view === 'main' && <Header showCitySelector={false} />}
        <PageLoader label={t.common.loading} className="min-h-0 flex-1" />
      </div>
    );
  }

  if (view !== 'main') {
    return (
      <div className="flex min-h-screen flex-col bg-landing">
        <main id="main-content" tabIndex={-1} className="outline-none">
          <SearchPageMainBody
            view={view}
            isMobile={isMobile}
            layoutMode={layoutMode}
            selectedCity={selectedCity}
            hasActiveFilters={activeFilterCount > 0}
            listDisplayPets={listDisplayPets}
            mapDisplayPets={mapDisplayPets}
            listPage={listPagination.page}
            listTotalPages={listPagination.totalPages}
            onListPageChange={handleListPageChange}
            onResetFilters={handleResetAllFilters}
            mapCenter={city.mapCenter}
            mapZoom={city.mapZoom}
            t={t}
            onViewChange={setView}
            onLayoutModeChange={handleLayoutModeChange}
            onPetClick={openPetDetail}
            onBoundsChange={pets.setMapBounds}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-landing">
      <Header showCitySelector={false} />

      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        <div className="page-container py-5 sm:py-6 lg:py-8">
          {/* Поиск */}
          <div className="mb-6 flex flex-wrap items-center gap-2 sm:mb-8 sm:gap-3">
            <SearchQueryInput filters={filters} onFiltersChange={setFilters} />
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className={cn(
                'inline-flex min-h-12 shrink-0 items-center gap-1.5 rounded-3xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-search transition-colors hover:bg-landing-muted lg:hidden',
              )}
            >
              <SlidersHorizontal className="size-4 shrink-0" aria-hidden />
              <span>{t.filters.filters}</span>
              {activeFilterCount > 0 ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>
          </div>

          {/* Sidebar + результаты */}
          <div className="flex items-start gap-6 lg:gap-8">
            <aside className="sticky top-24 hidden w-64 shrink-0 self-start lg:block xl:w-72">
              <div className="overflow-hidden rounded-3xl bg-landing-muted/80">
                <Filters
                  filters={filters}
                  onFiltersChange={setFilters}
                  variant="sidebar"
                  hideSearch
                  selectedCity={selectedCity}
                  onCityClick={() => city.setShowCityModal(true)}
                  onClearCity={handleClearCity}
                />
              </div>
            </aside>

            <section className="min-w-0 flex-1 space-y-4 sm:space-y-5">
              <ActiveFilterChips
                filters={filters}
                labels={filterChipLabels}
                city={selectedCity}
                onClearCity={handleClearCity}
                onRemove={(next) => setFilters((prev) => ({ ...prev, ...next }))}
                onReset={handleResetAllFilters}
              />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <SearchListTitleBlock
                  selectedCity={selectedCity}
                  resultCount={sortedPets.length}
                  mapDisplayPets={mapDisplayPets}
                  statistics={statistics}
                  resultsMayBeTruncated={resultsMayBeTruncated}
                  fetchLimit={SEARCH_PETS_FETCH_LIMIT}
                  t={t}
                />
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  {layoutMode === 'list' ? (
                    <SearchSortSelect value={sortMode} onChange={setSortMode} />
                  ) : null}
                  <SearchLayoutToggle mode={layoutMode} onChange={handleLayoutModeChange} />
                </div>
              </div>

              <SearchPageMainBody
                view={view}
                isMobile={isMobile}
                layoutMode={layoutMode}
                selectedCity={selectedCity}
                hasActiveFilters={activeFilterCount > 0}
                listDisplayPets={listDisplayPets}
                mapDisplayPets={mapDisplayPets}
                listPage={listPagination.page}
                listTotalPages={listPagination.totalPages}
                onListPageChange={handleListPageChange}
                onResetFilters={handleResetAllFilters}
                mapCenter={city.mapCenter}
                mapZoom={city.mapZoom}
                t={t}
                onViewChange={setView}
                onLayoutModeChange={handleLayoutModeChange}
                onPetClick={openPetDetail}
                onBoundsChange={pets.setMapBounds}
              />
            </section>
          </div>
        </div>
      </main>

      {!isMobile && <Footer />}

      <Dialog open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <DialogContent
          showCloseButton={false}
          className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>{t.filters.filters}</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <Filters
              filters={filters}
              onFiltersChange={setFilters}
              variant="sidebar"
              hideSearch
              selectedCity={selectedCity}
              onCityClick={() => {
                setMobileFiltersOpen(false);
                city.setShowCityModal(true);
              }}
              onClearCity={handleClearCity}
            />
          </div>
        </DialogContent>
      </Dialog>

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
