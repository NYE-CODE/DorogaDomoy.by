import { Bell, Lock, User } from 'lucide-react';
import { cn } from '@/shared/lib/classNames';
import { interactiveTransitionClass } from '@/shared/styles/interactive-classes';
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
  const tabs: { id: ProfileTab; label: string; icon: typeof User }[] = [
    { id: 'personal', label: personalLabel, icon: User },
    { id: 'security', label: securityLabel, icon: Lock },
    { id: 'notifications', label: notificationsLabel, icon: Bell },
  ];

  return (
    <div className="border-b border-border bg-landing-muted/40">
      <div className="flex overflow-x-auto" role="tablist">
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onTabChange(id)}
              className={cn(
                interactiveTransitionClass,
                'flex min-h-12 min-w-[9.5rem] flex-1 items-center justify-center gap-2 px-5 py-3.5 text-sm font-medium',
                active
                  ? 'border-b-2 border-primary bg-card text-primary'
                  : 'border-b-2 border-transparent text-muted-foreground hover:bg-landing-muted/80 hover:text-foreground',
              )}
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
