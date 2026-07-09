import { Bell, Lock, User } from 'lucide-react';
import type { ProfileTab } from './profile-page-types';

export interface ProfilePageTabsProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  personalLabel: string;
  securityLabel: string;
  notificationsLabel: string;
}

export function ProfilePageTabs({
  activeTab,
  onTabChange,
  personalLabel,
  securityLabel,
  notificationsLabel,
}: ProfilePageTabsProps) {
  const tabClass = (tab: ProfileTab) =>
    `flex-1 min-w-[150px] px-6 py-4 font-medium transition-colors flex items-center justify-center gap-2 ${
      activeTab === tab
        ? 'text-primary border-b-2 border-primary bg-primary/10'
        : 'text-muted-foreground hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
    }`;

  return (
    <div className="border-b border-border">
      <div className="flex overflow-x-auto">
        <button type="button" onClick={() => onTabChange('personal')} className={tabClass('personal')}>
          <User className="w-5 h-5" />
          <span>{personalLabel}</span>
        </button>
        <button type="button" onClick={() => onTabChange('security')} className={tabClass('security')}>
          <Lock className="w-5 h-5" />
          <span>{securityLabel}</span>
        </button>
        <button type="button" onClick={() => onTabChange('notifications')} className={tabClass('notifications')}>
          <Bell className="w-5 h-5" />
          <span>{notificationsLabel}</span>
        </button>
      </div>
    </div>
  );
}
