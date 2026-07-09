import type { ModerationStatus } from '../types/pet';
import { cn } from '../ui/utils';
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
    <div className="flex flex-wrap gap-1.5 border-b border-border bg-muted/40 p-2 sm:flex-nowrap sm:gap-1">
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
            onClick={() => onTabChange(tab.value)}
            className={cn(
              'flex min-w-[calc(33.333%-0.25rem)] flex-1 items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-all sm:min-w-0',
              isActive
                ? 'bg-card text-primary shadow-sm ring-1 ring-primary/20'
                : 'text-muted-foreground hover:bg-background/80 hover:text-foreground',
            )}
          >
            <Icon className="size-[1.125rem] shrink-0 opacity-90" aria-hidden />
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
  );
}
