import { useId, useState } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router';
import { useClickOutside } from '@/shared/hooks/useClickOutside';
import { useI18n } from '@/app/providers/I18nContext';
import { useShelterPetBrowse } from '@/app/providers/ShelterPetBrowseContext';
import { Footer } from '@/widgets/layout/Footer';
import { Header } from '@/widgets/layout/Header';
import { PageLoader } from '@/shared/ui/page-loader';
import { cn } from '@/shared/ui/utils';
import type { Pet } from '@/entities/pet/model/types';
import type { ShelterCampaignResponse, ShelterResponse } from '@/shared/api/client';
import type { PetShareBundle } from '@/shared/lib/pet-share-text';
import { BackQuickMenu } from '../../../components/navigation/BackQuickMenu';
import { PetDetailInstagramGuideModal } from '../pet-detail/pet-detail-instagram-guide-modal';
import { ShelterPetDetailAboutSection } from './shelter-pet-detail-about-section';
import { ShelterPetDetailBrowseArrows } from './shelter-pet-detail-browse-arrows';
import { ShelterPetDetailContactsSection } from './shelter-pet-detail-contacts-section';
import { ShelterPetFundraisingPanel } from './shelter-pet-detail-fundraising-panel';
import { ShelterPetDetailHeroGallery } from './shelter-pet-detail-hero-gallery';
import {
  getCampaignStats,
  getShelterContactDisplay,
  getShelterPetAdoptionLabel,
  getShelterPetDisplayTraits,
} from './shelter-pet-detail-glyphs';
import { ShelterPetDetailMobileTabs, type ShelterPetMobileTab } from './shelter-pet-detail-mobile-tabs';
import { useShelterPetDetailData } from './use-shelter-pet-detail-data';
import { useShelterPetDetailShare } from './use-shelter-pet-detail-share';

interface ShelterPetDetailPageContentProps {
  pet: Pet;
  shelter: ShelterResponse | null;
  campaigns: ShelterCampaignResponse[];
  campaignsLoading: boolean;
  photoIndex: number;
  setPhotoIndex: React.Dispatch<React.SetStateAction<number>>;
  isLg: boolean;
}

function ShelterPetDetailPageContent({
  pet,
  shelter,
  campaigns,
  campaignsLoading,
  photoIndex,
  setPhotoIndex,
  isLg,
}: ShelterPetDetailPageContentProps) {
  const { t, locale } = useI18n();
  const { canPrev, canNext, goPrev, goNext, nav: browseNav } = useShelterPetBrowse();
  const treatmentClipId = useId();
  const [fundraisingPanel, setFundraisingPanel] = useState<'fundraising' | 'fundraising_history'>('fundraising');
  const [mobileTab, setMobileTab] = useState<ShelterPetMobileTab>('about');

  const title = pet.name?.trim() || pet.breed || t.pet.animalType[pet.animalType];
  const adoption = getShelterPetAdoptionLabel(pet, t);
  const { health, coat, colors } = getShelterPetDisplayTraits(pet, t);
  const contacts = getShelterContactDisplay(pet, shelter);
  const campaignStats = getCampaignStats(campaigns);

  const share = useShelterPetDetailShare(pet, locale, t, title, adoption, shelter?.name);
  useClickOutside(share.shareMenuRef, () => share.setShowShareMenu(false), share.showShareMenu);

  const photos = (pet.photos?.length ?? 0) > 0 ? pet.photos! : [''];
  const showAbout = isLg || mobileTab === 'about';
  const showFundraisingSection =
    isLg || mobileTab === 'fundraising' || mobileTab === 'fundraising_history';

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
      <div className="flex min-h-screen flex-col bg-background">
        <Header showCitySelector={false} />
        <main className="flex-1 py-6 sm:py-10">
          <div className="page-container">
            <div className="mb-6">
              <BackQuickMenu />
            </div>

            <div className="flex flex-col gap-4 lg:grid lg:grid-cols-12 lg:items-start lg:gap-6">
              <div className="flex flex-col gap-4 lg:col-span-7 lg:col-start-6 lg:row-start-1 lg:self-start">
                <ShelterPetDetailHeroGallery
                  t={t}
                  petId={pet.id}
                  title={title}
                  photos={photos}
                  photoIndex={photoIndex}
                  setPhotoIndex={setPhotoIndex}
                />

                <div
                  className={cn(
                    'hidden rounded-lg border border-border bg-card p-6 shadow-sm lg:block',
                    !showFundraisingSection && 'hidden',
                  )}
                >
                  <ShelterPetFundraisingPanel
                    t={t}
                    isLg={isLg}
                    fundraisingPanel={fundraisingPanel}
                    setFundraisingPanel={setFundraisingPanel}
                    mobileTab={mobileTab}
                    campaignsLoading={campaignsLoading}
                    currentCampaign={campaignStats.currentCampaign}
                    historyCampaigns={campaignStats.historyCampaigns}
                    progressPercent={campaignStats.progressPercent}
                    currentCampaignEndsAt={campaignStats.currentCampaignEndsAt}
                    hasValidCurrentCampaignEndsAt={campaignStats.hasValidCurrentCampaignEndsAt}
                  />
                </div>
              </div>

              <ShelterPetDetailMobileTabs mobileTab={mobileTab} setMobileTab={setMobileTab} />

              <div className="contents lg:col-span-5 lg:col-start-1 lg:row-start-1 lg:flex lg:flex-col lg:gap-4 lg:self-start">
                <ShelterPetDetailAboutSection
                  t={t}
                  pet={pet}
                  title={title}
                  adoption={adoption}
                  health={health}
                  colors={colors}
                  coat={coat}
                  treatmentClipId={treatmentClipId}
                  showAbout={showAbout}
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

                <div
                  className={cn(
                    'rounded-lg border border-border bg-card p-6 shadow-sm lg:hidden',
                    !showFundraisingSection && 'hidden',
                  )}
                >
                  <ShelterPetFundraisingPanel
                    t={t}
                    isLg={isLg}
                    fundraisingPanel={fundraisingPanel}
                    setFundraisingPanel={setFundraisingPanel}
                    mobileTab={mobileTab}
                    campaignsLoading={campaignsLoading}
                    currentCampaign={campaignStats.currentCampaign}
                    historyCampaigns={campaignStats.historyCampaigns}
                    progressPercent={campaignStats.progressPercent}
                    currentCampaignEndsAt={campaignStats.currentCampaignEndsAt}
                    hasValidCurrentCampaignEndsAt={campaignStats.hasValidCurrentCampaignEndsAt}
                  />
                </div>

                <ShelterPetDetailContactsSection t={t} shelter={shelter} contacts={contacts} />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>

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

  const {
    loading,
    pet,
    shelter,
    campaigns,
    campaignsLoading,
    error,
    photoIndex,
    setPhotoIndex,
    isLg,
  } = useShelterPetDetailData(id, searchParams, t);

  if (!id) return <Navigate to="/shelters?tab=pets" replace />;
  if (loading) return <PageLoader />;
  if (error || !pet) return <Navigate to="/shelters?tab=pets" replace />;
  if ((pet.petScope ?? 'lost_found') !== 'shelter_pet') return <Navigate to={`/pet/${pet.id}`} replace />;

  return (
    <ShelterPetDetailPageContent
      pet={pet}
      shelter={shelter}
      campaigns={campaigns}
      campaignsLoading={campaignsLoading}
      photoIndex={photoIndex}
      setPhotoIndex={setPhotoIndex}
      isLg={isLg}
    />
  );
}
