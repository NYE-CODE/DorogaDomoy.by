import { useState } from 'react';
import { Heart } from 'lucide-react';
import { Navigate, useParams, useSearchParams } from 'react-router';
import { useClickOutside } from '@/shared/hooks/useClickOutside';
import { useI18n } from '@/app/providers/I18nContext';
import { useShelterPetBrowse } from '@/app/providers/ShelterPetBrowseContext';
import { PageLoader } from '@/shared/ui/page-loader';
import type { Pet } from '@/entities/pet/model/types';
import type { ShelterCampaignResponse, ShelterResponse } from '@/shared/api/client';
import type { PetShareBundle } from '@/shared/lib/pet-share-text';
import { BackQuickMenu } from '../../../components/navigation/BackQuickMenu';
import { FavoriteHeartButton } from '../../../components/favorite-heart-button';
import { ShelterPetTraits } from '../../../components/ShelterPetTraits';
import { PartnerAdSlot } from '@/features/partner-ads/PartnerAdSlot';
import { ImageCarousel } from '../pet-detail/pet-detail-image-carousel';
import { PetDetailInstagramGuideModal } from '../pet-detail/pet-detail-instagram-guide-modal';
import { ShelterPetDetailBrowseArrows } from './shelter-pet-detail-browse-arrows';
import { ShelterPetFundraisingPanel } from './shelter-pet-detail-fundraising-panel';
import {
  getCampaignStats,
  getShelterContactDisplay,
  getShelterPetAdoptionLabel,
  getShelterPetDisplayTraits,
} from './shelter-pet-detail-glyphs';
import { ShelterPetDetailShareMenu } from './shelter-pet-detail-share-menu';
import { ShelterPetDetailSidebar } from './shelter-pet-detail-sidebar';
import { useShelterPetDetailData } from './use-shelter-pet-detail-data';
import { useShelterPetDetailShare } from './use-shelter-pet-detail-share';

interface ShelterPetDetailPageContentProps {
  pet: Pet;
  shelter: ShelterResponse | null;
  campaigns: ShelterCampaignResponse[];
  campaignsLoading: boolean;
}

function ShelterPetDetailPageContent({
  pet,
  shelter,
  campaigns,
  campaignsLoading,
}: ShelterPetDetailPageContentProps) {
  const { t, locale } = useI18n();
  const { canPrev, canNext, goPrev, goNext, nav: browseNav } = useShelterPetBrowse();
  const [fundraisingPanel, setFundraisingPanel] = useState<'fundraising' | 'fundraising_history'>(
    'fundraising',
  );

  const title = pet.name?.trim() || pet.breed || t.pet.animalType[pet.animalType];
  const adoption = getShelterPetAdoptionLabel(pet, t);
  const { health, coat, colors } = getShelterPetDisplayTraits(pet, t);
  const contacts = getShelterContactDisplay(pet, shelter);
  const campaignStats = getCampaignStats(campaigns);

  const share = useShelterPetDetailShare(pet, locale, t, title, adoption, shelter?.name);
  useClickOutside(share.shareMenuRef, () => share.setShowShareMenu(false), share.showShareMenu);

  const photos = (pet.photos ?? []).filter(Boolean);

  return (
    <>
      <ShelterPetDetailBrowseArrows
        t={t}
        show={!!(browseNav && browseNav.petIds.length > 1)}
        canPrev={canPrev}
        canNext={canNext}
        onPrev={goPrev}
        onNext={goNext}
      />

      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-screen bg-landing pb-24 pt-6 outline-none md:py-8"
      >
        <div className="page-container">
          <div className="mb-5 sm:mb-6">
            <BackQuickMenu />
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
            <div className="space-y-6 lg:col-span-2 lg:space-y-8">
              <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
                {photos.length > 0 ? (
                  <ImageCarousel
                    photos={photos}
                    alt={title}
                    overlay={<FavoriteHeartButton petId={pet.id} />}
                  />
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center bg-landing-muted text-muted-foreground">
                    {t.shelterPet.noPhoto}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-1 sm:gap-4">
                <ShelterPetDetailShareMenu
                  t={t}
                  showShareMenu={share.showShareMenu}
                  setShowShareMenu={share.setShowShareMenu}
                  shareMenuRef={share.shareMenuRef}
                  copiedKind={share.copiedKind}
                  cardLoading={share.cardLoading}
                  onShareTelegram={share.handleShareTelegram}
                  onShareInstagramPost={share.handleShareInstagramPost}
                  onShareInstagramStory={share.handleShareInstagramStory}
                  onCopyPostText={() => void share.handleCopyPostText()}
                  onCopyLinkOnly={() => void share.handleCopyLinkOnly()}
                />
              </div>

              <section>
                <div className="mb-3 flex items-center gap-2">
                  <h2 className="font-display text-lg font-semibold text-foreground sm:text-xl">
                    {t.pet.description}
                  </h2>
                  <Heart className="size-4 text-primary/70" aria-hidden />
                </div>
                <p className="max-w-prose whitespace-pre-line text-base leading-relaxed text-muted-foreground">
                  {pet.description || t.shelterPet.descriptionEmpty}
                </p>
              </section>

              <ShelterPetTraits pet={pet} />

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

              <section className="overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6">
                <ShelterPetFundraisingPanel
                  t={t}
                  isLg
                  fundraisingPanel={fundraisingPanel}
                  setFundraisingPanel={setFundraisingPanel}
                  mobileTab={fundraisingPanel}
                  campaignsLoading={campaignsLoading}
                  currentCampaign={campaignStats.currentCampaign}
                  historyCampaigns={campaignStats.historyCampaigns}
                  progressPercent={campaignStats.progressPercent}
                  currentCampaignEndsAt={campaignStats.currentCampaignEndsAt}
                  hasValidCurrentCampaignEndsAt={campaignStats.hasValidCurrentCampaignEndsAt}
                />
              </section>
            </div>

            <ShelterPetDetailSidebar
              pet={pet}
              t={t}
              title={title}
              adoption={adoption}
              health={health}
              colors={colors}
              coat={coat}
              shelter={shelter}
              contacts={contacts}
            />
          </div>

          <PartnerAdSlot placement="pet-detail-bottom" className="mt-10" />
        </div>
      </main>

      {share.instagramGuide ? (
        <PetDetailInstagramGuideModal
          pet={pet}
          t={t}
          instagramGuide={share.instagramGuide}
          shareBundle={share.shareBundle as PetShareBundle}
          onClose={share.closeInstagramGuide}
        />
      ) : null}
    </>
  );
}

export default function ShelterPetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { t } = useI18n();

  const { loading, pet, shelter, campaigns, campaignsLoading, error } = useShelterPetDetailData(
    id,
    searchParams,
    t,
  );

  if (!id) return <Navigate to="/shelters?tab=pets" replace />;
  if (loading) return <PageLoader />;
  if (error || !pet) return <Navigate to="/shelters?tab=pets" replace />;
  if ((pet.petScope ?? 'lost_found') !== 'shelter_pet') {
    return <Navigate to={`/pet/${pet.id}`} replace />;
  }

  return (
    <ShelterPetDetailPageContent
      pet={pet}
      shelter={shelter}
      campaigns={campaigns}
      campaignsLoading={campaignsLoading}
    />
  );
}
