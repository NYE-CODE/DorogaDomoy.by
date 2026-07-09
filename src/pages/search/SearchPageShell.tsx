import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/app/providers/AuthContext';
import { useCity } from '@/app/providers/CityContext';
import { useI18n } from '@/app/providers/I18nContext';
import { Header } from '@/widgets/layout/Header';
import { Footer } from '@/widgets/layout/Footer';
import { AuthModal } from '../../../components/auth/AuthModal';
import { ContactRequiredModal } from '../../../components/contact-required-modal';
import { toast } from 'sonner';
import { DeleteReasonModal } from '../../../components/delete-reason-modal';
import { CitySelectModal } from '../../../components/city-select-modal';
import { CityDetectPopup } from '../../../components/city-detect-popup';
import type { Pet } from '@/entities/pet/model/types';
import type { PetFormData } from '../../../components/pet-form';
import { EMPTY_FILTER_STATE, Filters, type FilterState } from '../../../components/filters';
import { petsApi } from '@/shared/api/client';
import { PetForm } from '../../../components/pet-form';
import { useIsMobile } from '@/shared/ui/use-mobile';
import { useAuthenticatedAction } from '@/shared/hooks/use-authenticated-action';
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
import { useSearchPetsData } from './use-search-pets-data';
import { SearchListTitleBlock, SearchPageMainBody } from './search-page-main-body';

export default function SearchPage() {
  const { user, closeAuthModal, isLoading } = useAuth();
  const { runWhenAuthed } = useAuthenticatedAction();
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

  const [showForm, setShowForm] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [deletingPet, setDeletingPet] = useState<Pet | null>(null);
  const [showContactRequiredModal, setShowContactRequiredModal] = useState(false);

  const approvedAllPets = pets.allPets.filter((p) => !p.isArchived && p.moderationStatus === 'approved');
  const sourcePets =
    view === 'main' ? (pets.mapBounds && pets.mapPetsLoaded ? pets.mapPets : approvedAllPets) : pets.allPets;

  const mapDisplayPets = useMemo(() => {
    if (filters.colors.length === 0) return sourcePets;
    return sourcePets.filter((p) => p.colors.some((c) => filters.colors.includes(c)));
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
        registrationAuthority: formData.registrationAuthority,
        registrationTokenNumber: formData.registrationTokenNumber,
      });
      pets.setAllPets((prev) => prev.map((p) => (p.id === editingPet.id ? updatedPet : p)));
      setEditingPet(null);
      setShowForm(false);
      if (updatedPet.moderationStatus === 'pending') {
        toast.success(t.common.toasts.adUpdatedModeration);
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
      t.deleteReason.reasons.returned,
      t.deleteReason.reasons.adopted,
      t.deleteReason.reasons.transferred,
    ];
    const isArchiveReason = archiveReasons.includes(reason);
    try {
      if (isArchiveReason) {
        const updated = await petsApi.update(deletingPet.id, {
          isArchived: true,
          archiveReason: reason,
          rewardHelperCode: payload.rewardHelperCode,
        });
        pets.setAllPets((prev) => prev.map((p) => (p.id === deletingPet.id ? updated : p)));
        toast.success(t.common.toasts.adArchived, {
          description: payload.rewardHelperCode
            ? t.common.toasts.pointsAwardedToUser.replace('{code}', payload.rewardHelperCode)
            : reason,
        });
      } else {
        await petsApi.delete(deletingPet.id);
        pets.setAllPets((prev) => prev.filter((p) => p.id !== deletingPet.id));
        toast.success(t.common.toasts.adDeleted);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.common.error);
    }
    setDeletingPet(null);
  };

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

      <AuthModal
        onNavigateToTerms={() => {
          closeAuthModal();
          setView('terms');
        }}
      />

      {deletingPet && (
        <DeleteReasonModal
          onClose={() => setDeletingPet(null)}
          onConfirm={handleDeletePet}
          enableRewardSection={deletingPet.status === 'searching' && deletingPet.rewardMode === 'points'}
          rewardPoints={deletingPet.rewardPoints ?? 50}
          petDescription={`${t.pet.animalType[deletingPet.animalType]} ${deletingPet.breed ? `(${deletingPet.breed})` : ''} - ${deletingPet.city}`}
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
