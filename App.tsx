import { useState, useMemo, useEffect } from 'react';
import { MyAdsPage } from './components/my-ads-page';
import { ProfilePage } from './components/profile-page';
import { UserProfilePage } from './components/user-profile-page';
import { TermsPage } from './components/terms-page';
import { AuthProvider, useAuth, User } from './context/AuthContext';
import { Header } from './components/layout/Header';
import { AuthModal } from './components/auth/AuthModal';
import { ContactRequiredModal } from './components/contact-required-modal';
import { toast, Toaster } from 'sonner';
import { DeleteReasonModal } from './components/delete-reason-modal';
import { ReportModal } from './components/report-modal';
import { City } from './utils/cities';
import { calculateDistance } from './utils/distance';
import { reverseGeocode } from './utils/geocode';
import { AdminPanel } from './components/admin-panel';
import { Report, ReportReason, reportReasonLabels } from './types/admin';
import { Pet } from './types/pet';
import { PetFormData } from './components/pet-form';
import { FilterState } from './components/filters';
import { petsApi, usersApi, reportsApi } from './api/client';
import { PetCard } from './components/pet-card';
import { PetModal } from './components/pet-modal';
import { PetForm } from './components/pet-form';
import { Filters } from './components/filters';
import { MapView } from './components/map-view';
import { StatisticsPanel } from './components/statistics';
import { Map as MapIcon, List } from 'lucide-react';
import { LatLngBounds } from 'leaflet';

type View = 'main' | 'my-ads' | 'profile' | 'admin' | 'user-profile' | 'terms';
type SortBy = 'date-new' | 'date-old' | 'distance';

function MainApp() {
  const { user, isAuthenticated, openAuthModal, closeAuthModal, isLoading } = useAuth();
  const [view, setView] = useState<View>('main');
  const [pets, setPets] = useState<Pet[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const loadData = (showLoading = false): Promise<void> => {
    if (showLoading) setDataLoading(true);
    return Promise.all([
      petsApi.list().then(setPets).catch(() => setPets([])),
      usersApi.list().then(setUsers).catch(() => setUsers([])),
      reportsApi.list().then(setReports).catch(() => setReports([])),
    ])
      .then(() => {})
      .finally(() => {
        if (showLoading) setDataLoading(false);
      });
  };

  useEffect(() => {
    loadData(true);
  }, []);

  useEffect(() => {
    const refresh = () => loadData(false);
    const onVisibility = () => document.visibilityState === 'visible' && refresh();
    document.addEventListener('visibilitychange', onVisibility);
    const interval = setInterval(refresh, 60_000);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      clearInterval(interval);
    };
  }, []);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [deletingPet, setDeletingPet] = useState<Pet | null>(null);
  const [reportingPetId, setReportingPetId] = useState<string | null>(null);
  const [showContactRequiredModal, setShowContactRequiredModal] = useState(false);
  const [mobileView, setMobileView] = useState<'map' | 'list'>('list');
  const [mapBounds, setMapBounds] = useState<LatLngBounds | null>(null);
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
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    savedLoc ? [savedLoc.lat, savedLoc.lng] : [53.9006, 27.5590]
  );
  const [mapZoom, setMapZoom] = useState(savedLoc ? 13 : 12);
  const [userLocation, setUserLocationState] = useState<{ lat: number; lng: number } | null>(
    savedLoc ? { lat: savedLoc.lat, lng: savedLoc.lng } : null
  );

  const setUserLocation = (loc: { lat: number; lng: number } | null, city?: string) => {
    setUserLocationState(loc);
    if (loc) {
      try {
        const toSave: { lat: number; lng: number; city?: string } = { lat: loc.lat, lng: loc.lng };
        if (city) toSave.city = city;
        localStorage.setItem('pet_finder_user_location', JSON.stringify(toSave));
      } catch {}
    } else {
      try { localStorage.removeItem('pet_finder_user_location'); } catch {}
    }
  };
  const [sortBy, setSortBy] = useState<SortBy>('date-new');
  
  const [filters, setFilters] = useState<FilterState>({
    animalType: 'all',
    breed: '',
    colors: [],
    statuses: [],
    city: savedLoc?.city ?? '',
    days: 'all',
    distance: 'all',
    searchQuery: '',
  });

  const handleCitySelect = (city: City) => {
    setMapCenter(city.coordinates);
    setMapZoom(city.zoom || 12);
    toast.success(`Карта центрирована на ${city.name}`);
  };

  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Геолокация не поддерживается вашим браузером');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(location);
        setMapCenter([location.lat, location.lng]);
        setMapZoom(13);
        const city = await reverseGeocode(location.lat, location.lng);
        if (city) {
          setFilters((prev) => ({ ...prev, city }));
          setUserLocation(location, city);
        }
        toast.success('Местоположение определено');
      },
      (error) => {
        console.error('Error getting location:', error);
        toast.error('Не удалось определить местоположение');
      }
    );
  };

  // Filter pets based on current filters AND map bounds
  const filteredPets = useMemo(() => {
    // Show only approved and non-archived pets on main page
    let filtered = pets.filter(p => !p.isArchived && p.moderationStatus === 'approved');

    // Filter by map bounds if available
    if (mapBounds && view === 'main') {
      filtered = filtered.filter(p => 
        mapBounds.contains([p.location.lat, p.location.lng])
      );
    }

    if (filters.animalType !== 'all') {
      filtered = filtered.filter(p => p.animalType === filters.animalType);
    }

    if (filters.breed) {
      filtered = filtered.filter(p => 
        p.breed?.toLowerCase().includes(filters.breed.toLowerCase())
      );
    }

    if (filters.colors.length > 0) {
      filtered = filtered.filter(p => 
        p.colors.some(c => filters.colors.includes(c))
      );
    }

    if (filters.statuses.length > 0) {
      filtered = filtered.filter(p => filters.statuses.includes(p.status));
    }

    if (filters.city) {
      filtered = filtered.filter(p => 
        p.city.toLowerCase().includes(filters.city.toLowerCase())
      );
    }

    if (filters.days !== 'all') {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - filters.days);
      filtered = filtered.filter(p => p.publishedAt >= daysAgo);
    }

    if (filters.distance !== 'all' && userLocation) {
      const distanceThreshold = typeof filters.distance === 'number' ? filters.distance : parseInt(String(filters.distance), 10);
      filtered = filtered.filter(p => 
        calculateDistance(userLocation.lat, userLocation.lng, p.location.lat, p.location.lng) <= distanceThreshold
      );
    }

    if (filters.searchQuery) {
      filtered = filtered.filter(p => 
        p.description.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        p.breed?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        p.city.toLowerCase().includes(filters.searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [pets, filters, mapBounds, view, userLocation]);

  // Calculate real-time statistics from active (non-archived) pets
  const statistics = useMemo(() => {
    const activePets = pets.filter(p => !p.isArchived);
    return {
      searching: activePets.filter(p => p.status === 'searching').length,
      found: activePets.filter(p => p.status === 'found').length,
      fostering: 0,
    };
  }, [pets]);

  // Show loading state while auth or data is initializing
  if (isLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-gray-600">Загрузка...</p>
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
      setPets((prev) => [newPet, ...prev]);
      setView('my-ads');
      toast.success('Объявление отправлено на модерацию!', {
        description: 'После проверки оно появится на карте',
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка создания объявления');
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
      setPets((prev) => prev.map((p) => (p.id === editingPet.id ? updatedPet : p)));
      setEditingPet(null);
      setShowForm(false);
      toast.success('Объявление обновлено и снова отправлено на модерацию');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка обновления объявления');
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
        setPets((prev) => prev.map((p) => (p.id === deletingPet.id ? updated : p)));
        toast.success('Объявление перемещено в архив', { description: reason });
      } else {
        await petsApi.delete(deletingPet.id);
        setPets((prev) => prev.filter((p) => p.id !== deletingPet.id));
        toast.success('Объявление удалено');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка');
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

  const handleReportPet = (petId: string) => {
    if (!isAuthenticated) {
      toast.error('Войдите, чтобы пожаловаться на объявление');
      openAuthModal();
      return;
    }
    setSelectedPet(null); // Close pet modal
    setReportingPetId(petId);
  };

  const handleSubmitReport = async (reason: ReportReason, description: string) => {
    if (!reportingPetId || !user) return;
    try {
      const r = await reportsApi.create(reportingPetId, reason, description);
      setReports((prev) => [
        ...prev,
        {
          id: r.id,
          petId: r.pet_id,
          reporterId: r.reporter_id,
          reporterName: r.reporter_name,
          reason: r.reason as ReportReason,
          description: r.description,
          createdAt: new Date(r.created_at),
          status: r.status,
          reviewedBy: r.reviewed_by,
          reviewedAt: r.reviewed_at ? new Date(r.reviewed_at) : undefined,
          resolution: r.resolution,
        },
      ]);
      setReportingPetId(null);
      toast.success('Жалоба отправлена', {
        description: 'Модератор рассмотрит её в ближайшее время',
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка отправки жалобы');
    }
  };

  const renderContent = () => {
    if (view === 'my-ads') {
      return (
        <MyAdsPage 
          pets={pets} 
          onBack={() => setView('main')} 
          onCreateClick={handleCreateClick}
          onEditPet={openEditForm}
          onDeletePet={setDeletingPet}
        />
      );
    }

    if (view === 'profile') {
      return <ProfilePage onBack={() => setView('main')} />;
    }

    if (view === 'admin') {
      return (
        <AdminPanel 
          pets={pets}
          users={users} 
          reports={reports} 
          onBack={() => setView('main')}
          onUpdatePet={async (updatedPet) => {
            try {
              const p = await petsApi.update(updatedPet.id, {
                isArchived: updatedPet.isArchived,
                archiveReason: updatedPet.archiveReason,
                moderationStatus: updatedPet.moderationStatus,
                moderationReason: updatedPet.moderationReason,
              });
              setPets((prev) => prev.map((x) => (x.id === p.id ? p : x)));
            } catch (err) {
              toast.error(err instanceof Error ? err.message : 'Ошибка');
              return;
            }
            const msg = updatedPet.moderationStatus === 'approved' ? 'Объявление одобрено' : updatedPet.moderationStatus === 'rejected' ? 'Объявление отклонено' : 'Объявление обновлено';
            toast.success(msg);
          }}
          onDeletePet={async (petId) => {
            try {
              await petsApi.delete(petId);
            } catch (err) {
              toast.error(err instanceof Error ? err.message : 'Ошибка');
              return;
            }
            setPets((prev) => prev.filter((p) => p.id !== petId));
            toast.success('Объявление удалено');
          }}
          onUpdateUser={async (updatedUser) => {
            try {
              const u = await usersApi.update(updatedUser.id, {
                role: updatedUser.role,
                is_blocked: updatedUser.isBlocked,
                blocked_reason: updatedUser.blockedReason,
              });
              setUsers((prev) => prev.map((x) => (x.id === u.id ? u : x)));
            } catch (err) {
              toast.error(err instanceof Error ? err.message : 'Ошибка');
              return;
            }
            toast.success('Пользователь обновлён');
          }}
          onUpdateReport={async (updatedReport) => {
            try {
              await reportsApi.update(updatedReport.id, {
                status: updatedReport.status,
                resolution: updatedReport.resolution,
              });
              const list = await reportsApi.list();
              setReports(list);
              if (updatedReport.status === 'resolved' && updatedReport.petId) {
                const reasonLabel = reportReasonLabels[updatedReport.reason as ReportReason] || updatedReport.reason;
                const pet = pets.find((p) => p.id === updatedReport.petId);
                if (pet) {
                  const reasonText = `Жалоба одобрена: ${reasonLabel}`;
                  if (['spam', 'inappropriate', 'fake', 'other'].includes(updatedReport.reason)) {
                    const p = await petsApi.update(pet.id, {
                      moderationStatus: 'rejected',
                      moderationReason: reasonText,
                    });
                    setPets((prev) => prev.map((x) => (x.id === p.id ? p : x)));
                  } else if (updatedReport.reason === 'duplicate') {
                    const p = await petsApi.update(pet.id, {
                      isArchived: true,
                      archiveReason: reasonText,
                    });
                    setPets((prev) => prev.map((x) => (x.id === p.id ? p : x)));
                  } else if (updatedReport.reason === 'found') {
                    const p = await petsApi.update(pet.id, {
                      status: 'found',
                      isArchived: true,
                      archiveReason: reasonText,
                    });
                    setPets((prev) => prev.map((x) => (x.id === p.id ? p : x)));
                  }
                }
              }
            } catch (err) {
              toast.error(err instanceof Error ? err.message : 'Ошибка');
              return;
            }
            toast.success('Жалоба обработана');
          }}
          onDeleteReport={async (reportId) => {
            try {
              await reportsApi.delete(reportId);
            } catch (err) {
              toast.error(err instanceof Error ? err.message : 'Ошибка');
              return;
            }
            setReports((prev) => prev.filter((r) => r.id !== reportId));
            toast.success('Жалоба удалена');
          }}
        />
      );
    }

    if (view === 'user-profile') {
      return (
        <UserProfilePage
          userId={viewingUserId}
          onBack={() => {
            setView('main');
            setViewingUserId(null);
          }}
          onPetClick={setSelectedPet}
          users={users}
          pets={pets}
        />
      );
    }

    if (view === 'terms') {
      return <TermsPage onBack={() => setView('main')} />;
    }

    return (
      <div className="flex-1 max-w-[1920px] mx-auto w-full px-4 md:px-6 py-6 flex flex-col gap-6">
        {/* Statistics & Filters Area */}
        <div className="shrink-0 space-y-6">
          <StatisticsPanel stats={statistics} />
          
          {/* Mobile View Toggle */}
          <div className="md:hidden flex gap-2">
            <button
              onClick={() => setMobileView('list')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                mobileView === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200'
              }`}
            >
              <List className="w-4 h-4" />
              Список
            </button>
            <button
              onClick={() => setMobileView('map')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                mobileView === 'map'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200'
              }`}
            >
              <MapIcon className="w-4 h-4" />
              Карта
            </button>
          </div>

          {/* Filters - Now at the top */}
          <div className={mobileView === 'map' ? 'hidden md:block' : ''}>
            <Filters 
              filters={filters} 
              onFiltersChange={setFilters} 
              onCitySelect={handleCitySelect}
              userLocation={userLocation}
              onRequestLocation={handleRequestLocation}
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 min-h-0">
          {/* Left Sidebar - List */}
          <div className={`md:col-span-5 lg:col-span-4 flex flex-col ${mobileView === 'map' ? 'hidden md:flex' : 'flex'} md:h-[700px]`}>
            <div className="bg-white border border-gray-200 rounded-lg flex flex-col h-full max-h-full">
              <div className="p-4 border-b shrink-0">
                <h3 className="font-semibold text-gray-900">
                  Найдено в этой области: {filteredPets.length}
                </h3>
              </div>
              
              <div className="p-4 space-y-3 overflow-y-auto flex-1">
                {filteredPets.length === 0 ? (
                  <div className="text-center py-8">
                      <p className="text-gray-600">Питомцы не найдены</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {mapBounds ? 'Попробуйте изменить масштаб карты или фильтры' : 'Загрузка карты...'}
                      </p>
                  </div>
                ) : (
                  filteredPets.map((pet) => (
                    <PetCard
                      key={pet.id}
                      pet={pet}
                      onClick={() => setSelectedPet(pet)}
                      compact
                      // We can pass onEdit/onDelete here too if we want them editable in main list
                      // But usually user manages ads in My Ads
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Map */}
          <div className={`md:col-span-7 lg:col-span-8 h-[500px] md:h-[700px] ${mobileView === 'list' ? 'hidden md:block' : 'block'}`}>
            <MapView
              pets={filteredPets}
              onPetClick={setSelectedPet}
              onBoundsChange={setMapBounds}
              center={mapCenter}
              zoom={mapZoom}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      {view === 'main' && (
        <Header 
          onViewChange={setView} 
          onCreateClick={handleCreateClick}
          currentView={view}
        />
      )}

      {renderContent()}

      {/* Modals */}
      {selectedPet && (
        <PetModal 
          pet={selectedPet} 
          onClose={() => setSelectedPet(null)}
          onReport={handleReportPet}
          onAuthorClick={(authorId) => {
            setViewingUserId(authorId);
            setView('user-profile');
            setSelectedPet(null);
          }}
        />
      )}
      
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

      {reportingPetId && (
        <ReportModal
          petId={reportingPetId}
          onClose={() => setReportingPetId(null)}
          onSubmit={handleSubmitReport}
        />
      )}

      <ContactRequiredModal
        open={showContactRequiredModal}
        onClose={() => setShowContactRequiredModal(false)}
        onGoToProfile={() => {
          setShowContactRequiredModal(false);
          setView('profile');
        }}
      />

      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}