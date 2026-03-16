import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Search, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { Header } from '../components/layout/Header';
import { PetForm, PetFormData } from '../components/pet-form';
import { ContactRequiredModal } from '../components/contact-required-modal';
import { CitySelectModal } from '../components/city-select-modal';
import { petsApi } from '../api/client';
import { toast, Toaster } from 'sonner';
import type { PetStatus } from '../types/pet';
import type { City } from '../utils/cities';

export default function CreateAdPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [view, setView] = useState<'choice' | 'form'>('choice');
  const [chosenStatus, setChosenStatus] = useState<PetStatus | null>(null);
  const [showContactRequired, setShowContactRequired] = useState(false);
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

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      navigate('/', { replace: true });
      return;
    }
  }, [isLoading, isAuthenticated, navigate]);

  const handleChoose = (status: PetStatus) => {
    const hasContacts = user?.contacts?.phone || user?.contacts?.telegram || user?.contacts?.viber;
    if (!hasContacts) {
      setShowContactRequired(true);
      return;
    }
    setChosenStatus(status);
    setView('form');
  };

  const handleCloseForm = () => {
    setView('choice');
    setChosenStatus(null);
  };

  const handleSubmit = async (formData: PetFormData) => {
    if (!user) return;
    const contacts = formData.useProfileContacts
      ? { ...user.contacts }
      : { phone: formData.contactPhone || '' };
    const authorName = !formData.useProfileContacts && formData.contactName ? formData.contactName : undefined;
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
        contacts,
        ...(authorName && { author_name: authorName }),
      });
      if (newPet.moderationStatus === 'approved') {
        toast.success(t.app.adPublished);
      } else {
        toast.success(t.app.adSentModeration, { description: 'После проверки оно появится на карте' });
      }
      navigate('/my-ads');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.common.error);
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-gray-900">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900 flex flex-col">
      <Header
        onViewChange={() => navigate('/search')}
        selectedCity={selectedCity}
        onCityClick={() => setShowCityModal(true)}
      />

      <main className="flex-1 max-w-[1920px] w-full mx-auto px-4 md:px-6 py-6">
        {view === 'choice' && (
          <div className="max-w-md mx-auto">
            <div className="bg-card rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t.petForm.placeAdTitle}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-6">
                {t.petForm.placeAdSubtitle}
              </p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                {t.petForm.whatHappened}
              </p>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => handleChoose('searching')}
                  className="w-full flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-600 bg-card text-left hover:bg-accent dark:hover:bg-accent/80 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
                    <Search className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {t.petForm.myPetLost}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleChoose('found')}
                  className="w-full flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-600 bg-card text-left hover:bg-accent dark:hover:bg-accent/80 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {t.petForm.iFoundPet}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'form' && chosenStatus && (
          <div className="max-w-2xl mx-auto">
            <PetForm
              variant="page"
              onClose={handleCloseForm}
              onSubmit={handleSubmit}
              initialStatus={chosenStatus}
            />
          </div>
        )}
      </main>

      <ContactRequiredModal
        open={showContactRequired}
        onClose={() => setShowContactRequired(false)}
        onGoToProfile={() => {
          setShowContactRequired(false);
          navigate('/profile');
        }}
      />

      <CitySelectModal
        open={showCityModal}
        onClose={() => setShowCityModal(false)}
        onSelect={(city: City | null) => {
          if (city) {
            setSelectedCity(city.name);
            try {
              localStorage.setItem('pet_finder_user_location', JSON.stringify({
                lat: city.coordinates[0],
                lng: city.coordinates[1],
                city: city.name,
              }));
            } catch {}
          }
          setShowCityModal(false);
        }}
        currentCity={selectedCity}
      />

      <Toaster position="top-center" richColors />
    </div>
  );
}
