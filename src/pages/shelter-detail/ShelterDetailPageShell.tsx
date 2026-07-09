import { Header } from '@/widgets/layout/Header';
import { Footer } from '@/widgets/layout/Footer';
import { BackQuickMenu } from '../../../components/navigation/BackQuickMenu';
import { ScrollToTop } from '../../../components/scroll-to-top';
import { ShelterDetailDesktopBody } from './shelter-detail-desktop-body';
import { ShelterDetailHero } from './shelter-detail-hero';
import { ShelterDetailMobileBody } from './shelter-detail-mobile-body';
import { ShelterDetailLoadingView, ShelterDetailNotFoundView } from './shelter-detail-page-states';
import { useShelterDetailPage } from './use-shelter-detail-page';

export default function ShelterDetailPage() {
  const p = useShelterDetailPage();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header showCitySelector={false} />
      <main className="overflow-x-clip overflow-y-visible pt-0 pb-0">
        {p.loading ? (
          <ShelterDetailLoadingView />
        ) : p.notFound || !p.row ? (
          <ShelterDetailNotFoundView
            title={p.s.detailNotFound}
            hint={p.s.detailNotFoundHint}
            backLabel={p.s.detailBack}
          />
        ) : (
          <div className="bg-muted/30">
            <div className="page-container w-full pt-4 sm:pt-6 lg:pt-8">
              <div className="mb-4 sm:mb-6">
                <BackQuickMenu />
              </div>
              <ShelterDetailHero
                row={p.row}
                s={p.s}
                logo={p.logo}
                cover={p.cover}
                subCount={p.subCount}
                subLoading={p.subLoading}
                subscribed={p.subscribed}
                subBusy={p.subBusy}
                authLoading={p.authLoading}
                onSubscribeToggle={p.handleSubscribeToggle}
              />
            </div>

            <div className="page-container w-full py-5 md:py-7 lg:py-10">
              <ShelterDetailMobileBody
                row={p.row}
                s={p.s}
                addressLabel={p.t.pet.address}
                locationLine={p.locationLine}
                websiteHref={p.websiteHref}
                hasAnyContact={p.hasAnyContact}
                shelterPets={p.shelterPets}
                mobileTab={p.mobileTab}
                onMobileTabChange={p.setMobileTab}
              />

              <ShelterDetailDesktopBody
                row={p.row}
                s={p.s}
                addressLabel={p.t.pet.address}
                locationLine={p.locationLine}
                websiteHref={p.websiteHref}
                hasAnyContact={p.hasAnyContact}
                shelterPets={p.shelterPets}
                totalPets={p.totalPets}
                foundPets={p.foundPets}
                searchingPets={p.searchingPets}
                activeTab={p.activeTab}
                onActiveTabChange={p.setActiveTab}
                aboutMenuOpen={p.aboutMenuOpen}
                aboutMenuRef={p.aboutMenuRef}
                onToggleAboutMenu={() => p.setAboutMenuOpen((v) => !v)}
                onShare={() => {
                  p.setAboutMenuOpen(false);
                  void p.handleShare();
                }}
              />
            </div>
          </div>
        )}
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
