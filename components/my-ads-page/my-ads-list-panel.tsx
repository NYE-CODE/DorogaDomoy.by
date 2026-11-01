import { Plus } from 'lucide-react';
import { EmptyState } from '../ui/empty-state';
import { MyAdsCard } from './my-ads-card';
import { MyAdsStatusTabs } from './my-ads-status-tabs';
import { MyAdsTabEmptyState } from './my-ads-tab-empty-state';
import type { useMyAdsPage } from './use-my-ads-page';
import { cn } from '@/shared/lib/classNames';
import { surfaceCtaPrimary, surfaceEmpty, surfacePanel } from '@/shared/styles/surface-classes';

type MyAdsPageState = ReturnType<typeof useMyAdsPage>;

export interface MyAdsListPanelProps {
  state: MyAdsPageState;
  renewPromptWithinDays?: number;
  onCreateClick: () => void;
}

export function MyAdsListPanel({
  state,
  renewPromptWithinDays = 3,
  onCreateClick,
}: MyAdsListPanelProps) {
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
    handleRenew,
    onRenewPet,
  } = state;

  return (
    <div className={cn(surfacePanel, 'overflow-visible')}>
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
                renewPromptWithinDays={renewPromptWithinDays}
                onRenewPet={onRenewPet}
                onToggleMenu={(petId) => setOpenMenuId(openMenuId === petId ? null : petId)}
                onCloseMenu={() => setOpenMenuId(null)}
                onHoverTooltip={setHoveredTooltipId}
                onEdit={handleEdit}
                onDelete={handleDelete}
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
      tone="brand"
      icon={<Plus className="size-7" aria-hidden />}
      className={cn(surfaceEmpty, 'w-full px-6 py-12 sm:py-16')}
      action={
        <button type="button" className={cn(surfaceCtaPrimary, 'w-auto min-w-[12rem] px-7')} onClick={onCreateClick}>
          <Plus className="size-5" aria-hidden />
          {createLabel}
        </button>
      }
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
      <button type="button" className={cn(surfaceCtaPrimary, 'w-auto min-w-[12rem] px-7')} onClick={onCreateClick}>
        <Plus className="size-5" aria-hidden />
        {label}
      </button>
    </div>
  );
}
