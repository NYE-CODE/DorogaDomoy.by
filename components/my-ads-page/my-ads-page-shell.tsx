import '../../landing/styles/theme-scoped.css';
import { Header } from '../layout/Header';
import { Footer } from '../layout/Footer';
import {
  MyAdsCreateAnother,
  MyAdsEmptyPage,
  MyAdsListPanel,
} from './my-ads-list-panel';
import { MyAdsPageHeader } from './my-ads-page-header';
import type { MyAdsPageProps } from './my-ads-types';
import { useMyAdsPage } from './use-my-ads-page';
import { cn } from '@/shared/lib/classNames';
import { pageContainer } from '@/shared/styles/layout-classes';
import { surfacePage } from '@/shared/styles/surface-classes';

export function MyAdsPage({
  pets,
  onBack,
  onCreateClick,
  onEditPet,
  onDeletePet,
  onRenewPet,
  renewPromptWithinDays = 3,
}: MyAdsPageProps) {
  const state = useMyAdsPage({
    pets,
    onEditPet,
    onDeletePet,
    onRenewPet,
  });

  return (
    <div className={cn('landing-theme flex min-h-screen flex-col', surfacePage)}>
      <Header />

      <main className="flex-1 py-6 sm:py-8">
        <div className={cn(pageContainer, 'mx-auto px-4')}>
          <MyAdsPageHeader
            backLabel={state.t.header.searchAds}
            title={state.t.myAds.title}
            subtitle={state.t.myAds.subtitle}
            totalLabel={state.t.myAds.totalAds}
            totalCount={state.totalActive}
            onBack={onBack}
          />

          {state.myAds.length === 0 ? (
            <MyAdsEmptyPage
              title={state.t.myAds.noAds}
              description={state.t.myAds.emptyNoAdsHint}
              createLabel={state.t.myAds.createFirst}
              onCreateClick={onCreateClick}
            />
          ) : (
            <>
              <MyAdsListPanel
                state={state}
                renewPromptWithinDays={renewPromptWithinDays}
                onCreateClick={onCreateClick}
              />

              {state.filteredAds.length > 0 ? (
                <MyAdsCreateAnother
                  label={state.t.myAds.createAnother}
                  onCreateClick={onCreateClick}
                />
              ) : null}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
