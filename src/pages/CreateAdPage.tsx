import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '@/app/providers/AuthContext';
import '../../landing/styles/theme-scoped.css';
import { useI18n } from '@/app/providers/I18nContext';
import { Header } from '@/widgets/layout/Header';
import { Footer } from '@/widgets/layout/Footer';
import { PetForm, PetFormData, PetFormStepInfo } from '../../components/pet-form';
import { ChevronLeft, Search, HandHelping, Home, Plus, PawPrint, X } from 'lucide-react';
import { ContactRequiredModal } from '../../components/contact-required-modal';
import { CreateAdContactBanner } from '../../components/create-ad-contact-banner';
import { petsApi, profilePetsApi } from '@/shared/api/client';
import { toast } from 'sonner';
import { buildPrefillFromProfilePet } from '@/shared/lib/profile-pet-prefill';
import { getHomePath } from '@/shared/lib/home-route';
import { Button } from '@/shared/ui/button';
import { RouteProgress } from '@/shared/ui/molecules';
import { profilePetToListCard, type ProfilePetListCard } from '../../utils/profile-pet-display';
import { PageLoader } from '@/shared/ui/page-loader';

const MIN_DESCRIPTION = 20;

type FlowStep = 'scenario' | 'lost-role' | 'select-pet' | 'form';
type Scenario = 'lost' | 'found' | null;
type LostSubflow = 'owner' | 'helping' | null;

export default function CreateAdPage() {
  const { user, isAuthenticated, isLoading, openAuthModal } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
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
    if (urlPetId) {
      setSelectedProfilePetId(urlPetId);
      setScenario('lost');
      setLostSubflow('owner');
      setFlowStep('form');
    } else {
      setFlowStep('scenario');
      setScenario(null);
      setLostSubflow(null);
      setSelectedProfilePetId(null);
    }
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

  const handleFormBack = () => {
    if (scenario === 'found') {
      setFlowStep('scenario');
      return;
    }
    if (lostSubflow === 'owner') {
      setFlowStep('select-pet');
      return;
    }
    if (lostSubflow === 'helping') {
      setFlowStep('lost-role');
    }
  };

  const handleCloseForm = () => navigate(getHomePath());

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="landing-theme min-h-screen bg-muted/30 dark:bg-background flex flex-col items-center justify-center px-4">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center text-center">
          <p className="text-lg text-muted-foreground mb-6">
            {t.app.loginToCreate}
          </p>
          <button
            onClick={openAuthModal}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium"
          >
            {t.auth.login}
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="landing-theme min-h-screen bg-muted/30 dark:bg-background flex flex-col">
      <Header />

      {stepInfo && flowStep === 'form' && (
        <section className="bg-white dark:bg-card border-b border-border px-4 sm:px-6 lg:px-8">
          <div className="max-w-[736px] mx-auto py-4">
            <div className="flex items-center gap-4 mb-4">
              {stepInfo.step > 1 ? (
                <button
                  type="button"
                  onClick={stepInfo.onBack}
                  className="p-2 hover:bg-muted rounded-md transition-colors"
                  aria-label={t.common.back}
                >
                  <ChevronLeft className="w-6 h-6 text-muted-foreground" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFormBack}
                  className="p-2 hover:bg-muted rounded-md transition-colors"
                  aria-label={t.common.back}
                >
                  <ChevronLeft className="w-6 h-6 text-muted-foreground" />
                </button>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="typo-h1 truncate">{stepInfo.pageTitle}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {t.petForm.step} {stepInfo.step} {t.petForm.of} {stepInfo.totalSteps}: {stepInfo.stepTitle}
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
        <div className="max-w-[736px] mx-auto bg-white dark:bg-card rounded-md shadow-sm border border-border p-6 sm:p-8">
          {showContactBanner ? (
            <CreateAdContactBanner returnPath={createReturnPath} />
          ) : null}

          {flowStep === 'scenario' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between mb-6">
                <h1 className="typo-h1">{hub.title}</h1>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-muted-foreground mb-8">{hub.subtitle}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleScenarioSelect('lost')}
                  className="flex flex-col items-center text-center p-6 rounded-md border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all group"
                >
                  <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Search className="w-7 h-7" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{hub.lostTitle}</h3>
                  <p className="text-sm text-muted-foreground">{hub.lostDesc}</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleScenarioSelect('found')}
                  className="flex flex-col items-center text-center p-6 rounded-md border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all group"
                >
                  <div className="w-14 h-14 rounded-full bg-sky-500/10 text-sky-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Home className="w-7 h-7" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{hub.foundTitle}</h3>
                  <p className="text-sm text-muted-foreground">{hub.foundDesc}</p>
                </button>
              </div>
            </div>
          )}

          {flowStep === 'lost-role' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setFlowStep('scenario')}
                  className="p-2 hover:bg-muted rounded-md transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                </button>
                <h1 className="typo-h1 flex-1 truncate">{hub.lostRoleTitle}</h1>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-muted-foreground mb-8">{hub.lostRoleSubtitle}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleLostRoleSelect('owner')}
                  className="flex flex-col items-center text-center p-6 rounded-md border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all group"
                >
                  <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <PawPrint className="w-7 h-7" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{hub.lostRoleOwnerTitle}</h3>
                  <p className="text-sm text-muted-foreground">{hub.lostRoleOwnerDesc}</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleLostRoleSelect('helping')}
                  className="flex flex-col items-center text-center p-6 rounded-md border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all group"
                >
                  <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <HandHelping className="w-7 h-7" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{hub.lostRoleHelpingTitle}</h3>
                  <p className="text-sm text-muted-foreground">{hub.lostRoleHelpingDesc}</p>
                </button>
              </div>
            </div>
          )}

          {flowStep === 'select-pet' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setFlowStep('lost-role')}
                  className="p-2 hover:bg-muted rounded-md transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                </button>
                <h1 className="typo-h1 flex-1 truncate">{hub.selectPetTitle}</h1>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-muted-foreground mb-6">{hub.selectPetDesc}</p>

              {loadingPets ? (
                <div className="py-12 flex justify-center">
                  <PageLoader />
                </div>
              ) : (
                <div className="space-y-4">
                  {myPets.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {myPets.map((pet) => (
                        <button
                          key={pet.id}
                          type="button"
                          onClick={() => {
                            setSelectedProfilePetId(pet.id);
                            setFlowStep('form');
                          }}
                          className="flex items-center gap-4 p-4 rounded-md border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all text-left group"
                        >
                          {pet.photo ? (
                            <img src={pet.photo} alt={pet.name} className="w-14 h-14 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center shrink-0">
                              <PawPrint className="w-6 h-6 text-muted-foreground/50" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                              {pet.name}
                            </h3>
                            <p className="text-sm text-muted-foreground truncate">{pet.subtitle}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 px-4 border border-dashed border-border rounded-md bg-muted/30">
                      <PawPrint className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-foreground font-medium mb-1">{hub.emptyPetsTitle}</p>
                      <p className="text-sm text-muted-foreground">{hub.emptyPetsDesc}</p>
                    </div>
                  )}

                  <div className="pt-6 mt-6 border-t border-border flex flex-col sm:flex-row gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => navigate('/my-pets/add')}>
                      <Plus className="w-4 h-4 mr-2" />
                      {hub.createProfile}
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => {
                        setSelectedProfilePetId(null);
                        setFlowStep('form');
                      }}
                    >
                      {hub.skipProfile}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {flowStep === 'form' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              {profilePrefillLoading ? (
                <div className="py-12 flex justify-center">
                  <PageLoader />
                </div>
              ) : (
                <>
                  {profilePrefill &&
                    (profilePrefill.description?.trim().length ?? 0) < MIN_DESCRIPTION && (
                      <div
                        role="status"
                        className="mb-4 rounded-lg border border-amber-300/80 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-100"
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
        </div>
      </main>

      <ContactRequiredModal
        open={showContactRequired}
        returnPath={createReturnPath}
        onClose={() => setShowContactRequired(false)}
      />

      <Footer />
    </div>
  );
}
