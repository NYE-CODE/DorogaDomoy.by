import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../context/AuthContext';
import '../landing/styles/theme-scoped.css';
import { useI18n } from '../context/I18nContext';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { PetForm, PetFormData, PetFormStepInfo } from '../components/pet-form';
import { ChevronLeft } from 'lucide-react';
import { ContactRequiredModal } from '../components/contact-required-modal';
import { petsApi, profilePetsApi } from '../api/client';
import { toast } from 'sonner';
import { buildPrefillFromProfilePet } from '../utils/profile-pet-prefill';

export default function CreateAdPage() {
  const { user, isAuthenticated, isLoading, openAuthModal } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const profilePetId = searchParams.get('petId')?.trim() || null;

  const [showContactRequired, setShowContactRequired] = useState(false);
  const [stepInfo, setStepInfo] = useState<PetFormStepInfo | null>(null);
  const [profilePrefill, setProfilePrefill] = useState<Partial<PetFormData> | null>(null);
  const [profilePrefillLoading, setProfilePrefillLoading] = useState(false);

  const prefillLabels = useMemo(
    () => ({
      labelName: t.myPets.form.labelName,
      labelChipNumber: t.myPets.form.labelChipNumber,
      labelChipped: t.myPets.form.labelChipped,
      medicalTitle: t.myPets.ownerProfile.medicalTitle,
      yes: t.myPets.form.yes,
    }),
    [t],
  );

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      openAuthModal();
    }
  }, [isLoading, isAuthenticated, openAuthModal]);

  useEffect(() => {
    if (isAuthenticated && user) {
      const hasContacts = user.contacts?.phone || user.contacts?.telegram || user.contacts?.viber;
      if (!hasContacts) setShowContactRequired(true);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!profilePetId || !user?.id) {
      setProfilePrefill(null);
      setProfilePrefillLoading(false);
      return;
    }
    let cancelled = false;
    setProfilePrefillLoading(true);
    profilePetsApi
      .get(profilePetId)
      .then((p) => {
        if (cancelled) return;
        if (p.owner_id !== user.id) {
          toast.error(t.myPets.createAdPrefillForbidden);
          setProfilePrefill(null);
          return;
        }
        setProfilePrefill(buildPrefillFromProfilePet(p, prefillLabels));
      })
      .catch(() => {
        if (!cancelled) {
          toast.error(t.myPets.createAdPrefillError);
          setProfilePrefill(null);
        }
      })
      .finally(() => {
        if (!cancelled) setProfilePrefillLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [profilePetId, user?.id, prefillLabels]);

  const handleCloseForm = () => navigate('/');

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
        ...(formData.status === 'searching'
          ? {
              rewardMode: formData.rewardMode,
              rewardAmountByn: formData.rewardAmountByn,
            }
          : {}),
        ...(authorName && { author_name: authorName }),
      });
      if (newPet.moderationStatus === 'approved') {
        toast.success(t.app.adPublished);
      } else {
        toast.success(t.app.adSentModeration, { description: 'После проверки оно появится на карте' });
      }
      // Микро-задержка, чтобы тост успел отрендериться до смены страницы
      requestAnimationFrame(() => {
        navigate('/my-ads', { replace: true, state: { fromCreate: true } });
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.common.error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (profilePetId && profilePrefillLoading) {
    return (
      <div className="landing-theme min-h-screen bg-gray-50 dark:bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="w-10 h-10 border-4 border-[#FF9800]/30 border-t-[#FF9800] rounded-full animate-spin mb-4" />
          <p className="text-gray-600 dark:text-muted-foreground text-center">{t.common.loading}</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="landing-theme min-h-screen bg-gray-50 dark:bg-background flex flex-col items-center justify-center px-4">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center text-center">
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            {(t.app as { loginToCreate?: string }).loginToCreate ?? 'Войдите или зарегистрируйтесь, чтобы создать объявление'}
          </p>
          <button
            onClick={openAuthModal}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
          >
            {(t.auth as { login?: string }).login ?? 'Войти'}
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="landing-theme min-h-screen bg-gray-50 dark:bg-background flex flex-col">
      <Header />

      {/* Секция шага — сразу под хедером, отдельно от формы */}
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
                <h1 className="text-2xl font-bold text-black dark:text-foreground truncate">{stepInfo.pageTitle}</h1>
                <p className="text-sm text-gray-600 dark:text-muted-foreground mt-1">
                  {t.petForm.step} {stepInfo.step} {t.petForm.of} {stepInfo.totalSteps}: {stepInfo.stepTitle}
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
            key={profilePetId ?? 'create'}
            variant="page"
            renderStepHeaderExternally
            onStepChange={setStepInfo}
            onClose={handleCloseForm}
            onSubmit={handleSubmit}
            prefillPartial={profilePrefill}
          />
        </div>
      </main>

      <ContactRequiredModal
        open={showContactRequired}
        onClose={() => setShowContactRequired(false)}
        onGoToProfile={() => {
          setShowContactRequired(false);
          navigate('/profile');
        }}
      />

      <Footer />
    </div>
  );
}
