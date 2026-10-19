import { lazy, Suspense, Fragment } from 'react';
import { List } from 'lucide-react';
import type { Pet } from '@/entities/pet/model/types';
import type { useI18n } from '@/app/providers/I18nContext';
import { TermsPage } from '../../../components/terms-page';
import { PetCard } from '../../../components/pet-card';
import { EmptyState } from '@/shared/ui/empty-state';
import { Button } from '@/shared/ui/button';
import type { SearchLayoutMode } from '@/shared/lib/home-route';
import { SearchListPagination } from '../../../components/search/search-list-pagination';
import { MapLoadingFallback } from './map-loading-fallback';
import type { SearchView } from './search-storage';
import { PartnerAdSlot } from '@/features/partner-ads/PartnerAdSlot';
import { PARTNER_AD_SEARCH_FEED_INTERVAL } from '@/shared/lib/partner-ad-placements';

const MapView = lazy(() => import('../../../components/map-view'));

/** Сетка как в макете: 1 → 2 → 3 колонки, наши compact-карточки. */
const CARD_GRID = 'grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3';

export type SearchPageT = ReturnType<typeof useI18n>['t'];

export interface SearchPageMainBodyProps {
  view: SearchView;
  isMobile: boolean;
  layoutMode: SearchLayoutMode;
  selectedCity: string;
  /** Есть ли активные фильтры (включая регион) — для текста empty state */
  hasActiveFilters: boolean;
  listDisplayPets: Pet[];
  mapDisplayPets: Pet[];
  listPage: number;
  listTotalPages: number;
  onListPageChange: (page: number) => void;
  onResetFilters?: () => void;
  mapCenter: [number, number];
  mapZoom: number;
  t: SearchPageT;
  onViewChange: (view: SearchView) => void;
  onLayoutModeChange: (mode: SearchLayoutMode) => void;
  onPetClick: (petId: string) => void;
  onBoundsChange: (bounds: import('leaflet').LatLngBounds | null) => void;
}

export function SearchPageMainBody({
  view,
  isMobile,
  layoutMode,
  selectedCity,
  hasActiveFilters,
  listDisplayPets,
  mapDisplayPets,
  listPage,
  listTotalPages,
  onListPageChange,
  onResetFilters,
  mapCenter,
  mapZoom,
  t,
  onViewChange,
  onLayoutModeChange,
  onPetClick,
  onBoundsChange,
}: SearchPageMainBodyProps) {
  if (view === 'terms') {
    return <TermsPage onBack={() => onViewChange('main')} />;
  }

  if (layoutMode === 'map') {
    return (
      <div className="relative h-[min(70vh,44rem)] w-full overflow-hidden rounded-3xl border border-border bg-card shadow-search sm:h-[min(75vh,48rem)]">
        <Suspense fallback={<MapLoadingFallback label={t.app.mapLoading} />}>
          <MapView
            pets={mapDisplayPets}
            onPetClick={(pet) => onPetClick(pet.id)}
            onBoundsChange={onBoundsChange}
            center={mapCenter}
            zoom={mapZoom}
          />
        </Suspense>
        {isMobile ? (
          <button
            type="button"
            onClick={() => onLayoutModeChange('list')}
            className="absolute bottom-6 left-1/2 z-30 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-lg"
          >
            <List className="size-4 shrink-0" aria-hidden />
            {t.app.found} {mapDisplayPets.length}
          </button>
        ) : null}
      </div>
    );
  }

  if (listDisplayPets.length === 0 && listTotalPages <= 1) {
    const city = selectedCity.trim();
    const title = city
      ? t.app.noPetsInCity.replace('{city}', city)
      : t.app.noPetsFound;
    const description = city
      ? t.app.noPetsInCityDesc
      : hasActiveFilters
        ? t.app.noPetsFilteredDesc
        : t.app.noPetsFoundDesc;
    const hint = city
      ? t.app.noPetsInCityHint
      : hasActiveFilters
        ? t.app.noPetsFilteredHint
        : t.app.noPetsFoundHint;

    return (
      <div className="max-w-md">
        <EmptyState
          title={title}
          description={description}
          hint={hint}
          className="rounded-3xl p-6 md:p-8"
          action={
            hasActiveFilters && onResetFilters ? (
              <Button type="button" variant="outline" onClick={onResetFilters}>
                {t.app.resetFiltersCta}
              </Button>
            ) : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={CARD_GRID}>
        {listDisplayPets.map((pet, index) => (
          <Fragment key={pet.id}>
            <PetCard pet={pet} onClick={() => onPetClick(pet.id)} compact />
            {(index + 1) % PARTNER_AD_SEARCH_FEED_INTERVAL === 0 ? (
              <PartnerAdSlot
                placement="search-feed"
                className="col-span-full max-w-none"
              />
            ) : null}
          </Fragment>
        ))}
      </div>
      <SearchListPagination
        page={listPage}
        totalPages={listTotalPages}
        onPageChange={onListPageChange}
      />
    </div>
  );
}

export function SearchListTitleBlock({
  selectedCity,
  resultCount,
  mapDisplayPets,
  statistics,
  resultsMayBeTruncated = false,
  fetchLimit = 500,
  t,
}: {
  selectedCity: string;
  resultCount: number;
  mapDisplayPets: Pet[];
  statistics: { searching: number; found: number; fostering: number };
  resultsMayBeTruncated?: boolean;
  fetchLimit?: number;
  t: SearchPageT;
}) {
  return (
    <div className="min-w-0">
      <h2 className="font-display text-base font-semibold text-foreground sm:text-lg">
        {selectedCity.trim() ? (
          <>
            {selectedCity}:{' '}
            <span className="tabular-nums text-primary">{resultCount}</span>
          </>
        ) : (
          <>
            {t.app.found}{' '}
            <span className="tabular-nums text-primary">{resultCount}</span>
          </>
        )}
      </h2>
      <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
        {t.stats.searching}: {statistics.searching} · {t.stats.found}: {statistics.found}
      </p>
      {resultsMayBeTruncated && (
        <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
          {t.app.resultsLimited.replace('{limit}', String(fetchLimit))}
        </p>
      )}
      {selectedCity.trim() && resultCount === 0 && mapDisplayPets.length > 0 && (
        <p className="mt-1 text-xs text-muted-foreground">{t.app.mapHasOtherCities}</p>
      )}
    </div>
  );
}
