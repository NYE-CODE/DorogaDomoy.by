import { useParams, Link } from 'react-router';
import { useState, useEffect, type Dispatch, type SetStateAction } from 'react';
import { Activity, ChevronLeft, Download, Heart } from 'lucide-react';
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
import { PartnerAdSlot } from '@/features/partner-ads/PartnerAdSlot';
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
    const title = `${headline} — ${animal}${breedPart}, ${pet.city} | DorogaDomoy.by`;
    const description = truncateMetaDescription(`${headline}. ${animal}, ${pet.city}. ${pet.description}`);
    applySeo({
      title,
      description,
      canonicalUrl: `${getSiteOrigin()}/pet/${pet.id}`,
      robots: SEO_ROBOTS_PUBLIC,
      keywords: SEO_KEYWORDS,
      imageUrl: pet.photos?.[0] || `${getSiteOrigin()}/logo.png`,
      ogType: 'article',
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

  const marks = (pet.distinctiveMarks ?? []).map((m) => m.trim()).filter(Boolean);

  return (
    <>
      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-screen bg-landing pb-24 pt-6 outline-none md:py-8"
      >
        <div className="page-container">
          <div className="mb-5 sm:mb-6">
            <Link
              to={getHomePath()}
              className="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              <ChevronLeft size={20} aria-hidden />
              {t.petDetail.backToAds}
            </Link>
          </div>

          <PetDetailStatusBanners pet={pet} isShelterPet={isShelterPet} t={t} />

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
            <div className="space-y-6 lg:col-span-2 lg:space-y-8">
              <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
                <ImageCarousel
                  photos={pet.photos}
                  alt={t.pet.animalType[pet.animalType]}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
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
                <Button
                  type="button"
                  className={cn(appOutlineCtaClass, 'w-full rounded-xl')}
                  onClick={() => setShowFlyerModal(true)}
                >
                  <Download className="size-5" aria-hidden />
                  {t.petDetail.downloadFlyer}
                </Button>
              </div>

              <section>
                <div className="mb-3 flex items-center gap-2">
                  <h2 className="font-display text-lg font-semibold text-foreground sm:text-xl">
                    {t.pet.description}
                  </h2>
                  <Heart className="size-4 text-primary/70" aria-hidden />
                </div>
                <p className="max-w-prose whitespace-pre-line text-base leading-relaxed text-muted-foreground">
                  {pet.description}
                </p>
              </section>

              {marks.length > 0 ? (
                <section className="relative overflow-hidden rounded-3xl border border-shelter-border bg-shelter-soft p-5 sm:p-6">
                  <div className="relative z-[1]">
                    <div className="mb-2 flex items-center gap-2">
                      <Activity className="size-5 text-shelter" aria-hidden />
                      <h2 className="font-display text-base font-semibold text-shelter-foreground sm:text-lg">
                        {t.petDetail.marksTitle}
                      </h2>
                    </div>
                    <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-shelter-foreground/90 sm:text-base">
                      {marks.map((mark) => (
                        <li key={mark}>{mark}</li>
                      ))}
                    </ul>
                  </div>
                  <svg
                    className="pointer-events-none absolute -bottom-4 -right-4 size-28 text-shelter/15"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-4.5-2c.83 0 1.5-.67 1.5-1.5S8.33 5 7.5 5 6 5.67 6 6.5 6.67 8 7.5 8zm9 0c.83 0 1.5-.67 1.5-1.5S17.33 5 16.5 5 15 5.67 15 6.5 15.67 8 16.5 8zM8.5 14c.83 0 1.5-.67 1.5-1.5S9.33 11 8.5 11 7 11.67 7 12.5 7.67 14 8.5 14zm7 0c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zM12 16c-2.33 0-7 1.17-7 3.5V21h14v-1.5c0-2.33-4.67-3.5-7-3.5z" />
                  </svg>
                </section>
              ) : null}

              {(pet.registrationAuthority?.trim() || pet.registrationTokenNumber?.trim()) && (
                <section className="rounded-3xl border border-medallion-border bg-medallion-soft p-5 sm:p-6">
                  <h2 className="font-display mb-4 text-lg font-semibold text-medallion-foreground">
                    {t.petDetail.registrationTitle}
                  </h2>
                  <dl className="space-y-3 text-medallion-foreground/90">
                    {pet.registrationAuthority?.trim() ? (
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide opacity-80">
                          {t.petDetail.registrationAuthority}
                        </dt>
                        <dd className="mt-1 whitespace-pre-line leading-relaxed">
                          {pet.registrationAuthority.trim()}
                        </dd>
                      </div>
                    ) : null}
                    {pet.registrationTokenNumber?.trim() ? (
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide opacity-80">
                          {t.petDetail.registrationToken}
                        </dt>
                        <dd className="mt-1 font-mono text-sm">
                          {pet.registrationTokenNumber.trim()}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </section>
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

          <PartnerAdSlot placement="pet-detail-bottom" className="mt-10" />

          {!isShelterPet && !pet.isArchived && pet.moderationStatus === 'approved' && (
            <SimilarPetsSection petId={pet.id} className="mt-10" limit={6} />
          )}
        </div>
      </main>

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
