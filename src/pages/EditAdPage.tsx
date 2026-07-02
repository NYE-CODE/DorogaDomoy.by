import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '@/app/providers/AuthContext';
import '../../landing/styles/theme-scoped.css';
import { useI18n } from '@/app/providers/I18nContext';
import { Header } from '@/widgets/layout/Header';
import { Footer } from '@/widgets/layout/Footer';
import { PetForm, PetFormData, PetFormStepInfo } from '../../components/pet-form';
import { ChevronLeft } from 'lucide-react';
import { petsApi } from '@/shared/api/client';
import { Pet } from '@/entities/pet/model/types';
import { toast } from 'sonner';
import { getHomePath } from '@/shared/lib/home-route';
import { RouteProgress } from '@/shared/ui/molecules';

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
      navigate(getHomePath(), { replace: true });
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
        ...(formData.status === 'searching'
          ? {
              rewardMode: formData.rewardMode,
              rewardAmountByn: formData.rewardAmountByn,
            }
          : {}),
        ...(authorName && { author_name: authorName }),
        registrationAuthority: formData.registrationAuthority,
        registrationTokenNumber: formData.registrationTokenNumber,
      });
      if (updatedPet.moderationStatus === 'pending') {
        toast.success(t.common.toasts.adUpdatedModeration);
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
    <div className="landing-theme min-h-screen bg-muted/30 dark:bg-background flex flex-col">
      <Header />

      {/* ������ ���� � ��� � CreateAdPage */}
      {stepInfo && (
        <section className="bg-white dark:bg-card border-b border-border px-4 sm:px-6 lg:px-8">
          <div className="max-w-[736px] mx-auto py-4">
            <div className="flex items-center gap-4 mb-4">
              <button
                type="button"
                onClick={stepInfo.onBack}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                aria-label={t.common.back}
              >
                <ChevronLeft className="w-6 h-6 text-muted-foreground" />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="typo-h1 truncate">
                  {stepInfo.pageTitle}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {t.petForm.step} {stepInfo.step} {t.petForm.of} {stepInfo.totalSteps}:{' '}
                  {stepInfo.stepTitle}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseForm}
                className="text-muted-foreground hover:text-black dark:text-muted-foreground dark:hover:text-foreground whitespace-nowrap transition-colors"
              >
                {t.petForm.close}
              </button>
            </div>
            <RouteProgress
              totalSteps={stepInfo.totalSteps}
              currentStep={stepInfo.step}
              label={`${t.petForm.step} ${stepInfo.step} ${t.petForm.of} ${stepInfo.totalSteps}`}
              className="max-w-sm"
            />
          </div>
        </section>
      )}

      <main className="flex-1 px-4 py-8">
        <div className="max-w-[736px] mx-auto bg-white dark:bg-card rounded-lg shadow-sm border border-border p-8">
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
