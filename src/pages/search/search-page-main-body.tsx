import { lazy, Suspense } from 'react';
import { List } from 'lucide-react';
import type { Pet } from '@/entities/pet/model/types';
import type { useI18n } from '@/app/providers/I18nContext';
import { TermsPage } from '../../../components/terms-page';
import { PetCard } from '../../../components/pet-card';
import { MobileListSheet } from '../../../components/mobile-list-sheet';
import { EmptyState } from '@/shared/ui/empty-state';
import type { SearchLayoutMode } from '@/shared/lib/home-route';
import { MapLoadingFallback } from './map-loading-fallback';
import type { SearchView } from './search-storage';

const MapView = lazy(() => import('../../../components/map-view'));

export type SearchPageT = ReturnType<typeof useI18n>['t'];

export interface SearchPageMainBodyProps {
  view: SearchView;
  isMobile: boolean;
  layoutMode: SearchLayoutMode;
  listDisplayPets: Pet[];
  mapDisplayPets: Pet[];
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
  listDisplayPets,
  mapDisplayPets,
  mapCenter,
  mapZoom,
  t,
  onViewChange,
  onLayoutModeChange,
  onPetClick,
  onBoundsChange,
}: SearchPageMainBodyProps) {
  const showList = layoutMode === 'split' || layoutMode === 'list';
  const showMap = layoutMode === 'split' || layoutMode === 'map';

  if (view === 'terms') {
    return <TermsPage onBack={() => onViewChange('main')} />;
  }

  const listBodyContent =
    listDisplayPets.length === 0 ? (
      <div className="p-4">
        <EmptyState
          title={
            selectedCity.trim()
              ? t.app.noPetsInCity.replace('{city}', selectedCity)
              : t.app.noPetsFound
          }
          description={selectedCity.trim() ? t.app.noPetsInCityDesc : t.app.noPetsFoundDesc}
          hint={selectedCity.trim() ? t.app.noPetsInCityHint : t.app.noPetsFoundHint}
          className="p-6 md:p-8"
        />
      </div>
    ) : (
      <div className="space-y-3 p-3 sm:space-y-4 sm:p-4">
        {listDisplayPets.map((pet) => (
          <PetCard key={pet.id} pet={pet} onClick={() => onPetClick(pet.id)} compact />
        ))}
      </div>
    );

  const mapView = (
    <Suspense fallback={<MapLoadingFallback label={t.app.mapLoading} />}>
      <MapView
        pets={mapDisplayPets}
        onPetClick={(pet) => onPetClick(pet.id)}
        onBoundsChange={onBoundsChange}
        center={mapCenter}
        zoom={mapZoom}
      />
    </Suspense>
  );

  if (isMobile) {
    if (layoutMode === 'list') {
      return (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-card">{listBodyContent}</div>
      );
    }

    if (layoutMode === 'map') {
      return (
        <div className="relative min-h-0 flex-1">
          <div className="absolute inset-0">{mapView}</div>
          <button
            type="button"
            onClick={() => onLayoutModeChange('list')}
            className="absolute bottom-20 left-1/2 z-30 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-lg"
          >
            <List className="size-4 shrink-0" aria-hidden />
            {t.app.found} {listDisplayPets.length}
          </button>
        </div>
      );
    }

    return (
      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0">{mapView}</div>
        <MobileListSheet header={<div className="h-1" aria-hidden />}>{listBodyContent}</MobileListSheet>
      </div>
    );
  }

  return (
    <div className="page-container min-h-0 flex-1 px-4 py-4 sm:px-6 sm:py-6">
      <div
        className={`grid min-h-0 gap-6 ${
          layoutMode === 'split' ? 'md:grid-cols-12' : 'grid-cols-1'
        }`}
      >
        {showList && (
          <div
            className={`flex flex-col md:h-[700px] ${
              layoutMode === 'split' ? 'md:col-span-5 lg:col-span-4' : 'md:col-span-12'
            }`}
          >
            <div className="flex h-full max-h-full flex-col overflow-hidden rounded-md border border-border bg-card shadow-sm">
              <div className="min-h-0 flex-1 overflow-y-auto">{listBodyContent}</div>
            </div>
          </div>
        )}

        {showMap && (
          <div
            className={`h-[500px] md:h-[700px] ${
              layoutMode === 'split' ? 'md:col-span-7 lg:col-span-8' : 'md:col-span-12'
            }`}
          >
            <div className="h-full overflow-hidden rounded-md border border-border">{mapView}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export function SearchListTitleBlock({
  selectedCity,
  listDisplayPets,
  mapDisplayPets,
  statistics,
  t,
}: {
  selectedCity: string;
  listDisplayPets: Pet[];
  mapDisplayPets: Pet[];
  statistics: { searching: number; found: number; fostering: number };
  t: SearchPageT;
}) {
  return (
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
  );
}
