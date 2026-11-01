import type { ModerationStatus } from '@/entities/pet/model/types';
import { cn } from '@/shared/lib/classNames';
import { interactiveTransitionClass } from '@/shared/styles/interactive-classes';
import { MY_ADS_STATUS_TABS } from './my-ads-types';

export interface MyAdsStatusTabsProps {
  statusTab: ModerationStatus;
  moderationLabels: Record<string, string>;
  publishedCount: number;
  pendingCount: number;
  rejectedCount: number;
  onTabChange: (tab: ModerationStatus) => void;
}

export function MyAdsStatusTabs({
  statusTab,
  moderationLabels,
  publishedCount,
  pendingCount,
  rejectedCount,
  onTabChange,
}: MyAdsStatusTabsProps) {
  return (
    <div className="border-b border-border bg-landing-muted/40">
      <div className="flex overflow-x-auto" role="tablist">
        {MY_ADS_STATUS_TABS.map((tab) => {
          const Icon = tab.icon;
          const count =
            tab.value === 'approved'
              ? publishedCount
              : tab.value === 'pending'
                ? pendingCount
                : rejectedCount;
          const isActive = statusTab === tab.value;

          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.value)}
              className={cn(
                interactiveTransitionClass,
                'flex min-h-12 min-w-[7.5rem] flex-1 items-center justify-center gap-2 px-3 py-3.5 text-sm font-medium sm:min-w-[9.5rem] sm:px-5',
                isActive
                  ? 'border-b-2 border-primary bg-card text-primary'
                  : 'border-b-2 border-transparent text-muted-foreground hover:bg-landing-muted/80 hover:text-foreground',
              )}
            >
              <Icon className="size-4 shrink-0 opacity-90 sm:size-5" aria-hidden />
              <span className="truncate">{moderationLabels[tab.labelKey]}</span>
              {count > 0 ? (
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
                    isActive ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
