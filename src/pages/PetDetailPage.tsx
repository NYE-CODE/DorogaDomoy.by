import { useParams, Link } from 'react-router';
import { useState, useEffect, type Dispatch, type SetStateAction } from 'react';
import { ChevronLeft, Download } from 'lucide-react';
import type { Pet } from '@/entities/pet/model/types';
import { toast } from 'sonner';
import { petsApi, reportsApi, sightingsApi } from '@/shared/api/client';
import { useAuth } from '@/app/providers/AuthContext';
import { useI18n } from '@/app/providers/I18nContext';
import { ReportModal } from '../../components/report-modal';
import { SightingForm } from '../../components/SightingForm';
import { SimilarPetsSection } from '../../components/similar-pets-section';
import type { ReportReason } from '@/entities/admin/model/types';
import {
  applySeo,
  canonicalUrlFromPath,
  getSiteOrigin,
  SEO_KEYWORDS,
  SEO_ROBOTS_PRIVATE,
  SEO_ROBOTS_PUBLIC,
  truncateMetaDescription,
} from '@/shared/lib/seo';
import { useClickOutside } from '@/shared/hooks/useClickOutside';
import { EmptyState } from '@/shared/ui/empty-state';
import { PageLoader } from '@/shared/ui/page-loader';
import { Button } from '@/shared/ui/button';
import { FavoriteHeartButton } from '../../components/favorite-heart-button';
import { cn } from '@/shared/ui/utils';
import { appOutlineCtaClass, appPrimaryCtaClass } from '@/shared/styles/cta-classes';
import { getHomePath } from '@/shared/lib/home-route';
import { getArchiveReasonBadge } from './pet-detail/pet-detail-archive-badge';
import { createPetFlyerHandlers } from './pet-detail/pet-detail-flyer';
import { PetDetailFlyerModal } from './pet-detail/pet-detail-flyer-modal';
import { ImageCarousel } from './pet-detail/pet-detail-image-carousel';
import { PetDetailInstagramGuideModal } from './pet-detail/pet-detail-instagram-guide-modal';
import { isAbortError } from './pet-detail/pet-detail-helpers';
import { PetDetailLocationSection } from './pet-detail/pet-detail-location-section';
import { PetDetailShareMenu } from './pet-detail/pet-detail-share-menu';
import { PetDetailSidebar } from './pet-detail/pet-detail-sidebar';
import { PetDetailStatusBanners } from './pet-detail/pet-detail-status-banners';
import { usePetDetailShare } from './pet-detail/use-pet-detail-share';

export default function PetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser, isAuthenticated, openAuthModal } = useAuth();
  const { t, locale } = useI18n();
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reportingPetId, setReportingPetId] = useState<string | null>(null);
  const [showFlyerModal, setShowFlyerModal] = useState(false);
  const [sightings, setSightings] = useState<Awaited<ReturnType<typeof sightingsApi.listByPet>>>([]);
  const [showSightingForm, setShowSightingForm] = useState(false);

  useEffect(() => {
    if (!id) return;
    const ac = new AbortController();
    setLoading(true);
    setError(false);
    setPet(null);
    petsApi
      .get(id, { signal: ac.signal })
      .then((p) => {
        if (ac.signal.aborted) return;
        setPet(p);
      })
      .catch((e: unknown) => {
        if (isAbortError(e)) return;
        setError(true);
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });
    return () => ac.abort();
  }, [id]);

  useEffect(() => {
    if (loading || !id) return;
    if (error || !pet) {
      applySeo({
        title: 'Объявление не найдено | DorogaDomoy.by',
        description:
          'Объявление удалено или больше недоступно. DorogaDomoy.by — платформа поиска пропавших и найденных животных в Беларуси.',
        canonicalUrl: canonicalUrlFromPath(`/pet/${id}`),
        robots: SEO_ROBOTS_PRIVATE,
        keywords: SEO_KEYWORDS,
      });
    }
  }, [loading, error, pet, id]);

  useEffect(() => {
    if (!pet) return;
    const animal = t.pet.animalType[pet.animalType];
    const headline = pet.status === 'searching' ? t.petDetail.lostPet : t.petDetail.foundPet;
    const breedPart = pet.breed ? `, ${pet.breed}` : '';
    const title = `${headline} ? ${animal}${breedPart}, ${pet.city} | DorogaDomoy.by`;
    const description = truncateMetaDescription(`${headline}. ${animal}, ${pet.city}. ${pet.description}`);
    applySeo({
      title,
      description,
      canonicalUrl: `${getSiteOrigin()}/pet/${pet.id}`,
      robots: SEO_ROBOTS_PUBLIC,
      keywords: SEO_KEYWORDS,
    });
  }, [pet, locale, t]);

  useEffect(() => {
    if (!pet || pet.isArchived || pet.status !== 'searching' || (pet.petScope ?? 'lost_found') === 'shelter_pet') return;
    const ac = new AbortController();
    sightingsApi
      .listByPet(pet.id, 7, { signal: ac.signal })
      .then((rows) => {
        if (!ac.signal.aborted) setSightings(rows);
      })
      .catch((err: unknown) => {
        if (isAbortError(err)) return;
        console.warn('[PetDetailPage] sightings load failed', err);
        setSightings([]);
      });
    return () => ac.abort();
  }, [pet?.id, pet?.isArchived, pet?.status, pet?.petScope]);

  if (loading) {
    return <PageLoader label={t.petDetail.loading} />;
  }

  if (error || !pet) {
    return (
      <div className="flex min-h-screen flex-col bg-background px-4 pt-16 pb-24 md:py-16 dark:bg-background">
        <EmptyState
          title={t.petDetail.notFound}
          description={t.petDetail.notFoundDesc}
          action={
            <Button className={appPrimaryCtaClass} asChild>
              <Link to={getHomePath()}>{t.petDetail.toMain}</Link>
            </Button>
          }
          className="mx-auto max-w-lg border-dashed"
        />
      </div>
    );
  }

  return (
    <PetDetailPageContent
      pet={pet}
      currentUser={currentUser}
      isAuthenticated={isAuthenticated}
      openAuthModal={openAuthModal}
      t={t}
      locale={locale}
      reportingPetId={reportingPetId}
      setReportingPetId={setReportingPetId}
      showFlyerModal={showFlyerModal}
      setShowFlyerModal={setShowFlyerModal}
      sightings={sightings}
      setSightings={setSightings}
      showSightingForm={showSightingForm}
      setShowSightingForm={setShowSightingForm}
    />
  );
}

function PetDetailPageContent({
  pet,
  currentUser,
  isAuthenticated,
  openAuthModal,
  t,
  locale,
  reportingPetId,
  setReportingPetId,
  showFlyerModal,
  setShowFlyerModal,
  sightings,
  setSightings,
  showSightingForm,
  setShowSightingForm,
}: {
  pet: Pet;
  currentUser: ReturnType<typeof useAuth>['user'];
  isAuthenticated: boolean;
  openAuthModal: () => void;
  t: ReturnType<typeof useI18n>['t'];
  locale: ReturnType<typeof useI18n>['locale'];
  reportingPetId: string | null;
  setReportingPetId: (id: string | null) => void;
  showFlyerModal: boolean;
  setShowFlyerModal: (open: boolean) => void;
  sightings: Awaited<ReturnType<typeof sightingsApi.listByPet>>;
  setSightings: Dispatch<SetStateAction<Awaited<ReturnType<typeof sightingsApi.listByPet>>>>;
  showSightingForm: boolean;
  setShowSightingForm: (open: boolean) => void;
}) {
  const isShelterPet = (pet.petScope ?? 'lost_found') === 'shelter_pet';
  const archiveBadge = getArchiveReasonBadge(pet, t);
  const share = usePetDetailShare(pet, locale, t);
  const { handleFlyerClassic, handleFlyerQR } = createPetFlyerHandlers(pet, t, locale, () => setShowFlyerModal(false));

  useClickOutside(share.shareMenuRef, () => share.setShowShareMenu(false), share.showShareMenu);

  const handleReportPet = () => {
    if (!isAuthenticated) {
      toast.error(t.common.toasts.reportLoginRequired);
      openAuthModal();
      return;
    }
    setReportingPetId(pet.id);
  };

  const handleSubmitReport = async (reason: ReportReason, description: string) => {
    if (!reportingPetId || !currentUser) return;
    try {
      await reportsApi.create(reportingPetId, reason, description);
      setReportingPetId(null);
      toast.success(t.common.toasts.reportSent, {
        description: t.common.toasts.reportSentDesc,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.common.toasts.reportSendError);
    }
  };

  const canAddSighting = !isShelterPet && pet.status === 'searching' && !pet.isArchived
    && !(currentUser && (pet.authorId === currentUser.id || (currentUser.id === 'user-demo' && pet.authorId === 'current-user')));

  return (
    <>
      <div className="min-h-screen bg-background pt-8 pb-24 md:py-8">
        <div className="page-container">
          <div className="mb-6">
            <Link
              to={getHomePath()}
              className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-primary"
            >
              <ChevronLeft size={20} aria-hidden />
              {t.petDetail.backToAds}
            </Link>
          </div>

          <PetDetailStatusBanners pet={pet} isShelterPet={isShelterPet} t={t} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                <ImageCarousel
                  photos={pet.photos}
                  alt={t.pet.animalType[pet.animalType]}
                  overlay={<FavoriteHeartButton petId={pet.id} />}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <PetDetailShareMenu
                  t={t}
                  showShareMenu={share.showShareMenu}
                  setShowShareMenu={share.setShowShareMenu}
                  shareMenuRef={share.shareMenuRef}
                  copiedKind={share.copiedKind}
                  cardLoading={share.cardLoading}
                  onShareTelegram={share.handleShareTelegram}
                  onShareInstagramPost={share.handleShareInstagramPost}
                  onShareInstagramStory={share.handleShareInstagramStory}
                  onCopyPostText={share.handleCopyPostText}
                  onCopyLinkOnly={share.handleCopyLinkOnly}
                />
                <div>
                  <Button
                    type="button"
                    className={cn(appOutlineCtaClass, 'w-full')}
                    onClick={() => setShowFlyerModal(true)}
                  >
                    <Download className="size-5" aria-hidden />
                    {t.petDetail.downloadFlyer}
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <h2 className="typo-h2 mb-4">{t.pet.description}</h2>
                <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{pet.description}</p>
              </div>

              {(pet.registrationAuthority?.trim() || pet.registrationTokenNumber?.trim()) && (
                <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                  <h2 className="typo-h2 mb-4">{t.petDetail.registrationTitle}</h2>
                  <dl className="space-y-3 text-muted-foreground">
                    {pet.registrationAuthority?.trim() ? (
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-foreground/70">
                          {t.petDetail.registrationAuthority}
                        </dt>
                        <dd className="mt-1 whitespace-pre-line leading-relaxed">{pet.registrationAuthority.trim()}</dd>
                      </div>
                    ) : null}
                    {pet.registrationTokenNumber?.trim() ? (
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-foreground/70">
                          {t.petDetail.registrationToken}
                        </dt>
                        <dd className="mt-1 font-mono text-sm">{pet.registrationTokenNumber.trim()}</dd>
                      </div>
                    ) : null}
                  </dl>
                </div>
              )}

              {!isShelterPet && (
                <PetDetailLocationSection
                  pet={pet}
                  t={t}
                  sightings={sightings}
                  canAddSighting={canAddSighting}
                  onOpenSightingForm={() => setShowSightingForm(true)}
                />
              )}
            </div>

            <PetDetailSidebar
              pet={pet}
              t={t}
              archiveBadge={archiveBadge}
              onReport={handleReportPet}
            />
          </div>

          {!isShelterPet && !pet.isArchived && pet.moderationStatus === 'approved' && (
            <SimilarPetsSection petId={pet.id} className="mt-8" limit={6} />
          )}
        </div>
      </div>

      {showFlyerModal && (
        <PetDetailFlyerModal
          t={t}
          onClose={() => setShowFlyerModal(false)}
          onFlyerQR={handleFlyerQR}
          onFlyerClassic={handleFlyerClassic}
        />
      )}

      {share.instagramGuide && (
        <PetDetailInstagramGuideModal
          pet={pet}
          t={t}
          instagramGuide={share.instagramGuide}
          shareBundle={share.shareBundle}
          onClose={share.closeInstagramGuide}
        />
      )}

      {reportingPetId && (
        <ReportModal
          onClose={() => setReportingPetId(null)}
          onSubmit={handleSubmitReport}
        />
      )}

      {pet && !isShelterPet && (
        <SightingForm
          pet={pet}
          open={showSightingForm}
          onClose={() => setShowSightingForm(false)}
          onSuccess={() => {
            sightingsApi
              .listByPet(pet.id, 7)
              .then(setSightings)
              .catch((err: unknown) => {
                console.warn('[PetDetailPage] sightings refresh after sighting failed', err);
              });
            toast.success(t.petDetail.sightingSuccess);
          }}
        />
      )}
    </>
  );
}
