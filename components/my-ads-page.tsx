import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Pet } from '../types/pet';
import { PetCard } from './pet-card';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { sightingsApi } from '../api/client';
import { Header } from './layout/Header';
import { CitySelectModal } from './city-select-modal';
import type { City } from '../utils/cities';
import type { ModerationStatus } from '../types/pet';

const STATUS_TABS: { value: ModerationStatus; labelKey: keyof { onReview: string; approved: string; rejected: string } }[] = [
  { value: 'approved', labelKey: 'approved' },
  { value: 'pending', labelKey: 'onReview' },
  { value: 'rejected', labelKey: 'rejected' },
];

interface MyAdsPageProps {
  pets: Pet[];
  onBack: () => void;
  onCreateClick: () => void;
  onEditPet: (pet: Pet) => void;
  onDeletePet: (pet: Pet) => void;
}

export function MyAdsPage({ pets, onBack, onCreateClick, onEditPet, onDeletePet }: MyAdsPageProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const perPage = 12;
  const [sightingCounts, setSightingCounts] = useState<Record<string, number>>({});

  const [selectedCity, setSelectedCity] = useState(() => {
    try {
      const saved = localStorage.getItem('pet_finder_user_location');
      if (saved) {
        const data = JSON.parse(saved);
        return (data.city || '').trim();
      }
    } catch {}
    return '';
  });
  const [showCityModal, setShowCityModal] = useState(false);

  const saveUserLocation = useCallback((loc: { lat: number; lng: number }, city?: string) => {
    try {
      const toSave: { lat: number; lng: number; city?: string } = { lat: loc.lat, lng: loc.lng };
      if (city) toSave.city = city;
      localStorage.setItem('pet_finder_user_location', JSON.stringify(toSave));
    } catch {}
  }, []);

  const handleCityModalSelect = useCallback((city: City | null) => {
    if (city) {
      setSelectedCity(city.name);
      saveUserLocation({ lat: city.coordinates[0], lng: city.coordinates[1] }, city.name);
    } else {
      setSelectedCity('');
      try { localStorage.removeItem('pet_finder_user_location'); } catch {}
    }
    try { localStorage.setItem('pet_finder_city_confirmed', 'true'); } catch {}
    setShowCityModal(false);
  }, [saveUserLocation]);

  const myAds = pets.filter(pet =>
    user && (pet.authorId === user.id || (user.id === 'user-demo' && pet.authorId === 'current-user'))
    && !pet.isArchived
  );

  type StatusTab = 'pending' | 'approved' | 'rejected';
  const [statusTab, setStatusTab] = useState<StatusTab>('approved');

  const filteredAds = useMemo(
    () => myAds.filter((p) => p.moderationStatus === statusTab),
    [myAds, statusTab]
  );

  useEffect(() => {
    setPage(1);
  }, [statusTab]);

  const searchPetIds = useMemo(
    () => pets
      .filter((p) => user && (p.authorId === user.id || (user.id === 'user-demo' && p.authorId === 'current-user')) && !p.isArchived && p.status === 'searching')
      .map((p) => p.id),
    [pets, user]
  );

  useEffect(() => {
    if (searchPetIds.length === 0) return;
    sightingsApi.getCounts(searchPetIds)
      .then(setSightingCounts)
      .catch(() => setSightingCounts({}));
  }, [searchPetIds.join(',')]);

  // Pagination (based on filtered ads)
  const totalPages = Math.ceil(filteredAds.length / perPage);
  const paginatedAds = filteredAds.slice((page - 1) * perPage, page * perPage);

  const tabLabel = (key: string) => t.moderation[key as keyof typeof t.moderation] ?? key;

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900 flex flex-col">
      <Header
        onViewChange={onBack}
        selectedCity={selectedCity}
        onCityClick={() => setShowCityModal(true)}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 py-8">
        {myAds.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t.myAds.noAds}</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Если вы потеряли питомца или нашли чужого, создайте объявление, чтобы помочь ему вернуться домой.
            </p>
            <button
              onClick={onCreateClick}
              className="inline-flex items-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t.myAds.createFirst}
            </button>
          </div>
        ) : (
          <>
            {/* Page title + Create button — above tabs */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t.myAds.title}
              </h2>
              <button
                onClick={onCreateClick}
                className="flex items-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm font-medium text-sm"
              >
                <Plus className="w-4 h-4" />
                {t.myAds.createNew}
              </button>
            </div>

            {/* Status tabs — styled like filters */}
            <div className="bg-card border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm mb-6">
              <div className="flex gap-2 p-2 overflow-x-auto">
                {STATUS_TABS.map((tab) => {
                  const count = myAds.filter((p) => p.moderationStatus === tab.value).length;
                  return (
                    <button
                      key={tab.value}
                      onClick={() => setStatusTab(tab.value)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                        statusTab === tab.value
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-muted dark:bg-accent/50 text-gray-700 dark:text-gray-300 border border-transparent hover:bg-accent dark:hover:bg-accent'
                      }`}
                    >
                      {tabLabel(tab.labelKey)}
                      {count > 0 && (
                        <span className={`min-w-[20px] h-5 px-1.5 flex items-center justify-center text-xs font-semibold rounded-full ${
                          statusTab === tab.value ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                        }`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {filteredAds.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2">{t.myAds.noAdsInTab}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {statusTab === 'approved' && t.myAds.createFirst}
                  {statusTab === 'pending' && t.myAds.noAdsInTabPending}
                  {statusTab === 'rejected' && t.myAds.noAdsInTabRejected}
                </p>
                {statusTab === 'approved' && (
                  <button
                    onClick={onCreateClick}
                    className="inline-flex items-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    {t.myAds.createFirst}
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedAds.map(pet => (
                <PetCard
                  key={pet.id}
                  pet={pet}
                  sightingCount={sightingCounts[pet.id] ?? 0}
                  onClick={() => window.open(`/pet/${pet.id}`, '_blank')}
                  onEdit={onEditPet}
                  onDelete={onDeletePet}
                  hideStatusBadge
                />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 ? (
                  <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-card border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-accent dark:hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      {t.common.back}
                    </button>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{page} / {totalPages}</span>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                      className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-card border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-accent dark:hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {t.common.forward}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </>
        )}
      </main>

      <CitySelectModal
        open={showCityModal}
        onClose={() => setShowCityModal(false)}
        onSelect={handleCityModalSelect}
        currentCity={selectedCity}
      />
    </div>
  );
}