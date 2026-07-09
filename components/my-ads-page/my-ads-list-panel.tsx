import { Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { EmptyState } from '../ui/empty-state';
import { appPrimaryCtaClass } from '../../styles/cta-classes';
import { MyAdsCard } from './my-ads-card';
import { MyAdsStatusTabs } from './my-ads-status-tabs';
import { MyAdsTabEmptyState } from './my-ads-tab-empty-state';
import type { useMyAdsPage } from './use-my-ads-page';

type MyAdsPageState = ReturnType<typeof useMyAdsPage>;

export interface MyAdsListPanelProps {
  state: MyAdsPageState;
  instagramBoostEnabled: boolean;
  onCreateClick: () => void;
}

export function MyAdsListPanel({ state, instagramBoostEnabled, onCreateClick }: MyAdsListPanelProps) {
  const {
    t,
    dateLocale,
    statusTab,
    setStatusTab,
    filteredAds,
    sightingCounts,
    openMenuId,
    setOpenMenuId,
    hoveredTooltipId,
    setHoveredTooltipId,
    publishedCount,
    pendingCount,
    rejectedCount,
    handleEdit,
    handleDelete,
    handleBoost,
    handleRenew,
    onRenewPet,
  } = state;

  return (
    <div className="overflow-visible rounded-lg border border-border bg-card shadow-sm">
      <MyAdsStatusTabs
        statusTab={statusTab}
        moderationLabels={t.moderation}
        publishedCount={publishedCount}
        pendingCount={pendingCount}
        rejectedCount={rejectedCount}
        onTabChange={setStatusTab}
      />

      <div className="p-4 sm:p-6">
        {filteredAds.length === 0 ? (
          <MyAdsTabEmptyState
            statusTab={statusTab}
            labels={t.myAds}
            onCreateClick={onCreateClick}
          />
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredAds.map((pet) => (
              <MyAdsCard
                key={pet.id}
                pet={pet}
                dateLocale={dateLocale}
                t={t}
                sightingCount={sightingCounts[pet.id] ?? 0}
                openMenuId={openMenuId}
                hoveredTooltipId={hoveredTooltipId}
                instagramBoostEnabled={instagramBoostEnabled}
                onRenewPet={onRenewPet}
                onToggleMenu={(petId) => setOpenMenuId(openMenuId === petId ? null : petId)}
                onCloseMenu={() => setOpenMenuId(null)}
                onHoverTooltip={setHoveredTooltipId}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onBoost={handleBoost}
                onRenew={handleRenew}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export interface MyAdsEmptyPageProps {
  title: string;
  description: string;
  createLabel: string;
  onCreateClick: () => void;
}

export function MyAdsEmptyPage({ title, description, createLabel, onCreateClick }: MyAdsEmptyPageProps) {
  return (
    <EmptyState
      title={title}
      description={description}
      icon={<Plus className="size-7" />}
      action={
        <Button className={appPrimaryCtaClass} onClick={onCreateClick}>
          <Plus className="size-5" aria-hidden />
          {createLabel}
        </Button>
      }
      className="border-dashed shadow-sm"
    />
  );
}

export interface MyAdsCreateAnotherProps {
  label: string;
  onCreateClick: () => void;
}

export function MyAdsCreateAnother({ label, onCreateClick }: MyAdsCreateAnotherProps) {
  return (
    <div className="mt-8 flex justify-center">
      <Button className={appPrimaryCtaClass} onClick={onCreateClick}>
        <Plus className="size-5" aria-hidden />
        {label}
      </Button>
    </div>
  );
}
