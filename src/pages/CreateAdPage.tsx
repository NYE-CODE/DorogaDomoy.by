import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '@/app/providers/AuthContext';
import '../../landing/styles/theme-scoped.css';
import { useI18n } from '@/app/providers/I18nContext';
import { PetForm, PetFormData, PetFormStepInfo } from '../../components/pet-form';
import { Search, HandHelping, Home, Plus, PawPrint, X, ChevronLeft } from 'lucide-react';
import { ContactRequiredModal } from '../../components/contact-required-modal';
import { CreateAdContactBanner } from '../../components/create-ad-contact-banner';
import { AdFormPageShell } from '../../components/ad-form-page-shell';
import { AdFormStepHeader } from '../../components/ad-form-step-header';
import { petsApi, profilePetsApi } from '@/shared/api/client';
import { toast } from 'sonner';
import { buildPrefillFromProfilePet } from '@/shared/lib/profile-pet-prefill';
import { getHomePath } from '@/shared/lib/home-route';
import { cn } from '@/shared/lib/classNames';
import { profilePetToListCard, type ProfilePetListCard } from '../../utils/profile-pet-display';
import { PageLoader } from '@/shared/ui/page-loader';
import {
  surfaceChoiceCard,
  surfaceChoiceIconBrand,
  surfaceChoiceIconFound,
  surfaceChoiceIconLost,
  surfaceChoiceIconMuted,
  surfaceCtaOutline,
  surfaceCtaPrimary,
  surfaceEmpty,
  surfaceIconButton,
  surfacePage,
} from '@/shared/styles/surface-classes';

const MIN_DESCRIPTION = 20;

type FlowStep = 'scenario' | 'lost-role' | 'select-pet' | 'form';
type Scenario = 'lost' | 'found' | null;
type LostSubflow = 'owner' | 'helping' | null;

export default function CreateAdPage() {
  const { user, isAuthenticated, isLoading, openAuthModal } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlPetId = searchParams.get('petId')?.trim() || null;

  const [flowStep, setFlowStep] = useState<FlowStep>('scenario');
  const [scenario, setScenario] = useState<Scenario>(null);
  const [lostSubflow, setLostSubflow] = useState<LostSubflow>(null);
  const [selectedProfilePetId, setSelectedProfilePetId] = useState<string | null>(null);

  const [myPets, setMyPets] = useState<ProfilePetListCard[]>([]);
  const [loadingPets, setLoadingPets] = useState(false);

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
      labelRegistrationAuthority: t.myPets.form.labelRegistrationAuthority,
      labelRegistrationToken: t.myPets.form.labelRegistrationToken,
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
    if (!urlPetId) return;
    setSelectedProfilePetId(urlPetId);
    setScenario('lost');
    setLostSubflow('owner');
    setFlowStep('form');
  }, [urlPetId]);

  const createReturnPath = `${location.pathname}${location.search}`;

  const hasContacts = Boolean(
    user?.contacts?.phone || user?.contacts?.telegram || user?.contacts?.viber,
  );
  const showContactBanner =
    isAuthenticated &&
    user &&
    !hasContacts &&
    flowStep !== 'scenario' &&
    flowStep !== 'lost-role' &&
    flowStep !== 'select-pet';

  useEffect(() => {
    if (!selectedProfilePetId || !user?.id || flowStep !== 'form') {
      setProfilePrefill(null);
      setProfilePrefillLoading(false);
      return;
    }
    let cancelled = false;
    setProfilePrefillLoading(true);
    profilePetsApi
      .get(selectedProfilePetId)
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
      setProfilePrefillLoading(false);
    };
  }, [selectedProfilePetId, user?.id, prefillLabels, flowStep]);

  const loadMyPets = async () => {
    setLoadingPets(true);
    try {
      const arr = await profilePetsApi.my();
      setMyPets(arr.map((pet) => profilePetToListCard(pet, t.myPets.form)));
    } catch {
      toast.error(t.common.error);
    } finally {
      setLoadingPets(false);
    }
  };

  const hub = t.createAd.hub;

  const handleScenarioSelect = (selected: Scenario) => {
    setScenario(selected);
    setSelectedProfilePetId(null);
    if (selected === 'found') {
      setLostSubflow(null);
      setFlowStep('form');
    } else if (selected === 'lost') {
      setLostSubflow(null);
      setFlowStep('lost-role');
    }
  };

  const handleLostRoleSelect = (subflow: LostSubflow) => {
    setLostSubflow(subflow);
    if (subflow === 'owner') {
      setFlowStep('select-pet');
      void loadMyPets();
    } else {
      setSelectedProfilePetId(null);
      setFlowStep('form');
    }
  };

  const clearPetIdFromUrl = useCallback(() => {
    if (!searchParams.get('petId')) return;
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleFormBack = useCallback(() => {
    if (scenario === 'found') {
      setFlowStep('scenario');
      return;
    }
    if (lostSubflow === 'owner') {
      clearPetIdFromUrl();
      setFlowStep('select-pet');
      return;
    }
    if (lostSubflow === 'helping') {
      setFlowStep('lost-role');
    }
  }, [scenario, lostSubflow, clearPetIdFromUrl]);

  const handleCloseForm = useCallback(() => navigate(getHomePath()), [navigate]);

  const handleSubmit = async (formData: PetFormData) => {
    if (!user) return;

    const contacts = formData.useProfileContacts
      ? { ...user.contacts }
      : { phone: formData.contactPhone || '' };

    const hasContacts = Boolean(
      contacts.phone?.trim() || contacts.telegram?.trim() || contacts.viber?.trim(),
    );
    if (!hasContacts) {
      setShowContactRequired(true);
      toast.error(t.profile.atLeastOneContact);
      throw new Error(t.profile.atLeastOneContact);
    }

    const authorName = !formData.useProfileContacts && formData.contactName ? formData.contactName : undefined;
    try {
      const newPet = await petsApi.create({
        photos: formData.photos,
        animalType: formData.animalType,
        breed: formData.breed,
        colors: formData.colors,
        gender: formData.gender,
        approximateAge: formData.approximateAge,
        ...(formData.approximateAgeRaw?.trim()
          ? { approximateAgeRaw: formData.approximateAgeRaw.trim() }
          : {}),
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
        ...(selectedProfilePetId ? { profilePetId: selectedProfilePetId } : {}),
      });
      if (newPet.moderationStatus === 'approved') {
        toast.success(t.app.adPublished);
      } else {
        toast.success(t.app.adSentModeration, { description: t.common.toasts.moderationPendingDesc });
      }
      const mod = newPet.moderationStatus === 'approved' ? 'approved' : 'pending';
      navigate(`/create/success/${newPet.id}?moderation=${mod}`, { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.common.error);
      throw err;
    }
  };

  if (isLoading) {
    return (
      <div className={cn('flex min-h-screen items-center justify-center', surfacePage)}>
        <div className="size-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AdFormPageShell bare>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="mb-6 text-lg text-muted-foreground">{t.app.loginToCreate}</p>
          <button type="button" onClick={openAuthModal} className={cn(surfaceCtaPrimary, 'w-auto px-8')}>
            {t.auth.login}
          </button>
        </div>
      </AdFormPageShell>
    );
  }

  const stepHeader =
    stepInfo && flowStep === 'form' ? (
      <AdFormStepHeader
        pageTitle={stepInfo.pageTitle}
        stepLabel={`${t.petForm.step} ${stepInfo.step} ${t.petForm.of} ${stepInfo.totalSteps}: ${stepInfo.stepTitle}`}
        totalSteps={stepInfo.totalSteps}
        currentStep={stepInfo.step}
        progressLabel={`${t.petForm.step} ${stepInfo.step} ${t.petForm.of} ${stepInfo.totalSteps}`}
        backAriaLabel={t.common.back}
        closeLabel={t.petForm.close}
        onBack={stepInfo.step > 1 ? stepInfo.onBack : handleFormBack}
        onClose={handleCloseForm}
      />
    ) : null;

  return (
    <AdFormPageShell
      stepHeader={stepHeader}
      overlay={
        <ContactRequiredModal
          open={showContactRequired}
          returnPath={createReturnPath}
          onClose={() => setShowContactRequired(false)}
        />
      }
    >
      {showContactBanner ? <CreateAdContactBanner returnPath={createReturnPath} /> : null}

      {flowStep === 'scenario' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="mb-6 flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-2">
              <h1 className="typo-h2 font-display">{hub.title}</h1>
              <p className="typo-lead max-w-md text-muted-foreground">{hub.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={handleCloseForm}
              className={surfaceIconButton}
              aria-label={t.petForm.close}
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <button type="button" onClick={() => handleScenarioSelect('lost')} className={surfaceChoiceCard}>
              <div className={surfaceChoiceIconLost}>
                <Search className="size-7" aria-hidden />
              </div>
              <h3 className="text-base font-semibold text-foreground sm:text-lg">{hub.lostTitle}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{hub.lostDesc}</p>
            </button>
            <button type="button" onClick={() => handleScenarioSelect('found')} className={surfaceChoiceCard}>
              <div className={surfaceChoiceIconFound}>
                <Home className="size-7" aria-hidden />
              </div>
              <h3 className="text-base font-semibold text-foreground sm:text-lg">{hub.foundTitle}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{hub.foundDesc}</p>
            </button>
          </div>
        </div>
      )}

      {flowStep === 'lost-role' && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="mb-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setFlowStep('scenario')}
              className={surfaceIconButton}
              aria-label={t.common.back}
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <h1 className="typo-h2 min-w-0 flex-1 truncate font-display">{hub.lostRoleTitle}</h1>
            <button
              type="button"
              onClick={handleCloseForm}
              className={surfaceIconButton}
              aria-label={t.petForm.close}
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <p className="mb-8 typo-lead max-w-md text-muted-foreground">{hub.lostRoleSubtitle}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <button type="button" onClick={() => handleLostRoleSelect('owner')} className={surfaceChoiceCard}>
              <div className={surfaceChoiceIconBrand}>
                <PawPrint className="size-7" aria-hidden />
              </div>
              <h3 className="text-base font-semibold text-foreground sm:text-lg">{hub.lostRoleOwnerTitle}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{hub.lostRoleOwnerDesc}</p>
            </button>
            <button type="button" onClick={() => handleLostRoleSelect('helping')} className={surfaceChoiceCard}>
              <div className={surfaceChoiceIconMuted}>
                <HandHelping className="size-7" aria-hidden />
              </div>
              <h3 className="text-base font-semibold text-foreground sm:text-lg">{hub.lostRoleHelpingTitle}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{hub.lostRoleHelpingDesc}</p>
            </button>
          </div>
        </div>
      )}

      {flowStep === 'select-pet' && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="mb-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setFlowStep('lost-role')}
              className={surfaceIconButton}
              aria-label={t.common.back}
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <h1 className="typo-h2 min-w-0 flex-1 truncate font-display">{hub.selectPetTitle}</h1>
            <button
              type="button"
              onClick={handleCloseForm}
              className={surfaceIconButton}
              aria-label={t.petForm.close}
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <p className="mb-6 text-muted-foreground">{hub.selectPetDesc}</p>

          {loadingPets ? (
            <div className="flex justify-center py-12">
              <PageLoader />
            </div>
          ) : (
            <div className="space-y-4">
              {myPets.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {myPets.map((pet) => (
                    <button
                      key={pet.id}
                      type="button"
                      onClick={() => {
                        setSelectedProfilePetId(pet.id);
                        setFlowStep('form');
                      }}
                      className={cn(
                        surfaceChoiceCard,
                        'flex-row items-center gap-4 p-4 text-left',
                      )}
                    >
                      {pet.photo ? (
                        <img
                          src={pet.photo}
                          alt={pet.name}
                          className="size-14 shrink-0 rounded-full object-cover ring-[3px] ring-medallion"
                        />
                      ) : (
                        <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-landing-muted">
                          <PawPrint className="size-6 text-muted-foreground/50" aria-hidden />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-semibold text-foreground group-hover:text-primary">
                          {pet.name}
                        </h3>
                        <p className="truncate text-sm text-muted-foreground">{pet.subtitle}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className={surfaceEmpty}>
                  <PawPrint className="mx-auto mb-3 size-12 text-muted-foreground/30" aria-hidden />
                  <p className="mb-1 font-medium text-foreground">{hub.emptyPetsTitle}</p>
                  <p className="text-sm text-muted-foreground">{hub.emptyPetsDesc}</p>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row">
                <button type="button" className={surfaceCtaOutline} onClick={() => navigate('/my-pets/add')}>
                  <Plus className="size-4" aria-hidden />
                  {hub.createProfile}
                </button>
                <button
                  type="button"
                  className={surfaceCtaPrimary}
                  onClick={() => {
                    setSelectedProfilePetId(null);
                    setFlowStep('form');
                  }}
                >
                  {hub.skipProfile}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {flowStep === 'form' && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          {profilePrefillLoading ? (
            <div className="flex justify-center py-12">
              <PageLoader />
            </div>
          ) : (
            <>
              {profilePrefill &&
                (profilePrefill.description?.trim().length ?? 0) < MIN_DESCRIPTION && (
                  <div
                    role="status"
                    className="mb-4 rounded-2xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-foreground"
                  >
                    {t.petForm.descriptionTooShortSearchHint}
                  </div>
                )}
              <PetForm
                key={`${selectedProfilePetId ?? 'create'}-${scenario}`}
                variant="page"
                renderStepHeaderExternally
                closeOnSubmit={false}
                onStepChange={setStepInfo}
                onClose={handleCloseForm}
                onSubmit={handleSubmit}
                prefillPartial={profilePrefill}
                aiPhotoAssistEnabled={!selectedProfilePetId}
                initialStatus={scenario === 'found' ? 'found' : 'searching'}
              />
            </>
          )}
        </div>
      )}

    </AdFormPageShell>
  );
}
