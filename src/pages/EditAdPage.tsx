import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '@/app/providers/AuthContext';
import '../../landing/styles/theme-scoped.css';
import { useI18n } from '@/app/providers/I18nContext';
import { PetForm, PetFormData, PetFormStepInfo } from '../../components/pet-form';
import { AdFormPageShell } from '../../components/ad-form-page-shell';
import { AdFormStepHeader } from '../../components/ad-form-step-header';
import { petsApi } from '@/shared/api/client';
import { Pet } from '@/entities/pet/model/types';
import { toast } from 'sonner';
import { getHomePath } from '@/shared/lib/home-route';
import { cn } from '@/shared/lib/classNames';
import { surfacePage } from '@/shared/styles/surface-classes';

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
        distinctiveMarks: formData.distinctiveMarks,
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
      <div className={cn('flex min-h-screen items-center justify-center', surfacePage)}>
        <div className="size-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
      </div>
    );
  }

  if (!pet) return null;

  const stepHeader = stepInfo ? (
    <AdFormStepHeader
      pageTitle={stepInfo.pageTitle}
      stepLabel={`${t.petForm.step} ${stepInfo.step} ${t.petForm.of} ${stepInfo.totalSteps}: ${stepInfo.stepTitle}`}
      totalSteps={stepInfo.totalSteps}
      currentStep={stepInfo.step}
      progressLabel={`${t.petForm.step} ${stepInfo.step} ${t.petForm.of} ${stepInfo.totalSteps}`}
      backAriaLabel={t.common.back}
      closeLabel={t.petForm.close}
      onBack={stepInfo.onBack}
      onClose={handleCloseForm}
    />
  ) : null;

  return (
    <AdFormPageShell stepHeader={stepHeader}>
      <PetForm
        variant="page"
        renderStepHeaderExternally
        onStepChange={setStepInfo}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
        initialData={pet}
        isEditing
      />
    </AdFormPageShell>
  );
}
