import { Header } from '@/widgets/layout/Header';
import { Footer } from '@/widgets/layout/Footer';
import { BackQuickMenu } from '../../../components/navigation/BackQuickMenu';
import { PageLoader } from '@/shared/ui/page-loader';
import { buildMyPetProfileDisplay } from './my-pet-profile-display';
import { MyPetProfileDetailSections } from './my-pet-profile-detail-sections';
import { MyPetProfileMainInfoCard } from './my-pet-profile-main-info-card';
import { MyPetProfilePartnersModal } from './my-pet-profile-partners-modal';
import { MyPetProfilePhotoCard } from './my-pet-profile-photo-card';
import { MyPetProfileQrSidebar } from './my-pet-profile-qr-sidebar';
import { MyPetProfileTelegramBanner } from './my-pet-profile-telegram-banner';
import { useMyPetProfilePage } from './use-my-pet-profile-page';

export default function MyPetProfilePage() {
  const p = useMyPetProfilePage();

  if (p.pageLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <PageLoader label={p.t.common.loading} className="flex-1 bg-muted/30" />
        <Footer />
      </div>
    );
  }

  const display = buildMyPetProfileDisplay(p.pet, p.locale, p.f, p.pp);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-muted/45 via-background to-background">
      <Header />
      <main className="flex-1 py-6 sm:py-10">
        <div className="page-container">
          <div className="mb-6 sm:mb-8">
            <BackQuickMenu />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
            <div className="space-y-6 lg:col-span-2">
              {p.user != null && p.user.telegramId == null ? (
                <MyPetProfileTelegramBanner
                  title={p.op.telegramFoundSignalTitle}
                  hint={p.op.telegramFoundSignalHint}
                  ctaLabel={p.op.linkTelegramCta}
                />
              ) : null}

              <MyPetProfilePhotoCard
                pet={p.pet}
                photos={display.photos}
                photoIndex={p.photoIndex}
                speciesLine={display.speciesLine}
                op={p.op}
                menuEditLabel={p.t.myPets.menuEdit}
                menuCreateAdLabel={p.t.myPets.menuCreateAd}
                thumbRefs={p.thumbRefs}
                onPhotoIndexChange={p.setPhotoIndex}
                onPrevPhoto={p.goPrevPhoto}
                onNextPhoto={p.goNextPhoto}
                onEdit={() => p.navigate(`/my-pets/${p.id}/edit`)}
                onOpenPublicPage={() => {
                  window.open(`/pet-profile/${encodeURIComponent(p.id)}`, '_blank', 'noopener,noreferrer');
                }}
                onCreateAd={() => p.navigate(`/create?petId=${encodeURIComponent(p.id)}`)}
              />

              <MyPetProfileMainInfoCard
                pet={p.pet}
                f={p.f}
                op={p.op}
                ageDisplay={display.ageDisplay}
                colorsLine={display.colorsLine}
              />

              <MyPetProfileDetailSections
                pet={p.pet}
                f={p.f}
                op={p.op}
                addedAt={display.addedAt}
              />
            </div>

            <div className="lg:col-span-1">
              <MyPetProfileQrSidebar
                pet={p.pet}
                op={p.op}
                publicPetUrl={p.publicPetUrl}
                publicPetQrUrl={p.publicPetQrUrl}
                qrWrapRef={p.qrWrapRef}
                onDownloadQr={p.downloadQrSvg}
                onShareLink={() => void p.sharePublicLink()}
                onOpenPartners={p.openPartnersModal}
              />
            </div>
          </div>
        </div>
      </main>

      <MyPetProfilePartnersModal
        open={p.partnersModalOpen}
        onOpenChange={p.setPartnersModalOpen}
        op={p.op}
        loadingLabel={p.t.common.loading}
        partnersLoading={p.partnersLoading}
        partnersError={p.partnersError}
        medallionPartners={p.medallionPartners}
        onRetry={() => void p.loadPartners(true)}
      />

      <Footer />
    </div>
  );
}
