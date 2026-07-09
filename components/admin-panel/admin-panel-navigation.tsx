import type { LucideIcon } from 'lucide-react';
import type { AdminStats } from '../../types/admin';
import type { AdminPrimarySection, AdminTab } from '../admin-panel-nav';

type SectionMetaItem = {
  id: AdminPrimarySection;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
};

type SubTabItem = {
  id: AdminTab;
  label: string;
  icon: LucideIcon;
};

type AdminPanelNavigationProps = {
  sectionMeta: readonly SectionMetaItem[];
  subTabs: SubTabItem[];
  activePrimary: AdminPrimarySection;
  activeTab: AdminTab;
  stats: AdminStats;
  pendingModerationCount: number;
  shelterPendingCount: number;
  onSelectPrimary: (section: AdminPrimarySection) => void;
  onSelectTab: (tab: AdminTab) => void;
};

export function AdminPanelNavigation({
  sectionMeta,
  subTabs,
  activePrimary,
  activeTab,
  stats,
  pendingModerationCount,
  shelterPendingCount,
  onSelectPrimary,
  onSelectTab,
}: AdminPanelNavigationProps) {
  return (
    <div className="bg-card border-b border-border">
      <div className="page-container">
        <div className="flex gap-2 py-2 overflow-x-auto scrollbar-hide border-b border-border/80 dark:border-border/80">
          {sectionMeta.map((sec) => {
            const SecIcon = sec.icon;
            const isActive = activePrimary === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => onSelectPrimary(sec.id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-sm font-medium shrink-0 transition-colors ${
                  isActive
                    ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                    : 'text-muted-foreground hover:bg-muted dark:hover:bg-muted'
                }`}
              >
                <SecIcon className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">{sec.label}</span>
                <span className="sm:hidden">{sec.shortLabel}</span>
              </button>
            );
          })}
        </div>
        {activePrimary !== 'dashboard' ? (
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-1 min-w-max">
              {subTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onSelectTab(tab.id)}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-3 border-b-2 transition-colors whitespace-nowrap text-sm ${
                      activeTab === tab.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                    {tab.id === 'reports' && stats.pendingReports > 0 && (
                      <span className="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full text-xs font-medium">
                        {stats.pendingReports}
                      </span>
                    )}
                    {tab.id === 'moderation' && pendingModerationCount > 0 && (
                      <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full text-xs font-medium">
                        {pendingModerationCount}
                      </span>
                    )}
                    {tab.id === 'sheltersModeration' && shelterPendingCount > 0 && (
                      <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full text-xs font-medium">
                        {shelterPendingCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
