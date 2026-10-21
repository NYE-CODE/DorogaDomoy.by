import { cn } from '@/shared/ui/utils';

export type ShelterPetMobileTab = 'about' | 'fundraising' | 'fundraising_history';

export interface ShelterPetDetailMobileTabsProps {
  mobileTab: ShelterPetMobileTab;
  setMobileTab: (tab: ShelterPetMobileTab) => void;
  aboutLabel?: string;
  fundraisingLabel?: string;
  historyLabel?: string;
}

const DEFAULT_LABELS = {
  about: 'О питомце',
  fundraising: 'Сбор',
  history: 'История сборов',
} as const;

export function ShelterPetDetailMobileTabs({
  mobileTab,
  setMobileTab,
  aboutLabel = DEFAULT_LABELS.about,
  fundraisingLabel = DEFAULT_LABELS.fundraising,
  historyLabel = DEFAULT_LABELS.history,
}: ShelterPetDetailMobileTabsProps) {
  const tabs: { id: ShelterPetMobileTab; label: string }[] = [
    { id: 'about', label: aboutLabel },
    { id: 'fundraising', label: fundraisingLabel },
    { id: 'fundraising_history', label: historyLabel },
  ];

  return (
    <div
      className="inline-flex w-full rounded-full border border-border bg-card p-1 shadow-sm lg:hidden"
      role="tablist"
      aria-label="Разделы карточки питомца"
    >
      {tabs.map(({ id, label }) => {
        const selected = mobileTab === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => setMobileTab(id)}
            className={cn(
              'min-w-0 flex-1 rounded-full px-2.5 py-2.5 text-center text-xs font-medium transition-colors sm:text-sm',
              selected
                ? 'bg-landing-dark text-on-landing-dark shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <span className="line-clamp-1">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
