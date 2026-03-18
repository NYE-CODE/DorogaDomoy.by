import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '../context/AuthContext';
import '../landing/styles/theme-scoped.css';
import { useI18n } from '../context/I18nContext';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { PetForm, PetFormData, PetFormStepInfo } from '../components/pet-form';
import { ChevronLeft } from 'lucide-react';
import { petsApi } from '../api/client';
import { Pet } from '../types/pet';
import { toast } from 'sonner';

export default function EditAdPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [pet, setPet] = useState<Pet | null>(null);
  const [petLoading, setPetLoading] = useState(true);
  const [stepInfo, setStepInfo] = useState<PetFormStepInfo | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      navigate('/', { replace: true });
      return;
    }
  }, [isLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!id) {
      navigate('/my-ads', { replace: true });
      return;
    }
    setPetLoading(true);
    petsApi
      .get(id)
      .then((p) => {
        if (p.authorId !== user?.id && !(user?.id === 'user-demo' && p.authorId === 'current-user')) {
          navigate('/my-ads', { replace: true });
          return;
        }
        setPet(p);
      })
      .catch(() => navigate('/my-ads', { replace: true }))
      .finally(() => setPetLoading(false));
  }, [id, user?.id, navigate]);

  const handleCloseForm = () => navigate('/my-ads');

  const handleSubmit = async (formData: PetFormData) => {
    if (!pet || !user) return;
    const contacts = formData.useProfileContacts ? { ...user.contacts } : formData.contacts;
    const authorName = !formData.useProfileContacts && formData.contactName ? formData.contactName : undefined;
    try {
      const updatedPet = await petsApi.update(pet.id, {
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
      if (updatedPet.moderationStatus === 'pending') {
        toast.success('Объявление обновлено и отправлено на модерацию');
      } else {
        toast.success(t.app.adUpdated);
      }
      requestAnimationFrame(() => {
        navigate('/my-ads', { replace: true });
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.common.error);
      throw err;
    }
  };

  if (isLoading || !isAuthenticated || petLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!pet) return null;

  return (
    <div className="landing-theme min-h-screen bg-gray-50 dark:bg-background flex flex-col">
      <Header />

      {/* Секция шага — как в CreateAdPage */}
      {stepInfo && (
        <section className="bg-white dark:bg-card border-b border-gray-200 dark:border-border px-4 sm:px-6 lg:px-8">
          <div className="max-w-[736px] mx-auto py-4">
            <div className="flex items-center gap-4 mb-4">
              <button
                type="button"
                onClick={stepInfo.onBack}
                className="p-2 hover:bg-gray-100 dark:hover:bg-muted rounded-lg transition-colors"
                aria-label={t.common.back}
              >
                <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-muted-foreground" />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-black dark:text-foreground truncate">
                  {stepInfo.pageTitle}
                </h1>
                <p className="text-sm text-gray-600 dark:text-muted-foreground mt-1">
                  {t.petForm.step} {stepInfo.step} {t.petForm.of} {stepInfo.totalSteps}:{' '}
                  {stepInfo.stepTitle}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseForm}
                className="text-gray-600 hover:text-black dark:text-muted-foreground dark:hover:text-foreground whitespace-nowrap transition-colors"
              >
                {t.petForm.close}
              </button>
            </div>
            <div className="w-full bg-gray-200 dark:bg-muted rounded-full h-2">
              <div
                className="bg-gradient-to-r from-[#FDB913] to-[#FF9800] h-2 rounded-full transition-all duration-300"
                style={{ width: `${(stepInfo.step / stepInfo.totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </section>
      )}

      <main className="flex-1 px-4 py-8">
        <div className="max-w-[736px] mx-auto bg-white dark:bg-card rounded-2xl shadow-sm border border-gray-200 dark:border-border p-8">
          <PetForm
            variant="page"
            renderStepHeaderExternally
            onStepChange={setStepInfo}
            onClose={handleCloseForm}
            onSubmit={handleSubmit}
            initialData={pet}
            isEditing
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
