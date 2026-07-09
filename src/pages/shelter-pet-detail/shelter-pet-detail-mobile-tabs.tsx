import { cn } from '@/shared/ui/utils';

export type ShelterPetMobileTab = 'about' | 'fundraising' | 'fundraising_history';

export interface ShelterPetDetailMobileTabsProps {
  mobileTab: ShelterPetMobileTab;
  setMobileTab: (tab: ShelterPetMobileTab) => void;
}

export function ShelterPetDetailMobileTabs({ mobileTab, setMobileTab }: ShelterPetDetailMobileTabsProps) {
  return (
    <div
      className="flex gap-1 rounded-md border border-border bg-background p-1 lg:hidden"
      role="tablist"
      aria-label="Разделы карточки питомца"
    >
      <button
        type="button"
        role="tab"
        aria-selected={mobileTab === 'about'}
        onClick={() => setMobileTab('about')}
        className={cn(
          'min-w-0 flex-1 rounded-lg px-2 py-2.5 text-center text-xs font-medium transition-colors sm:text-sm',
          mobileTab === 'about'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-muted',
        )}
      >
        О питомце
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mobileTab === 'fundraising'}
        onClick={() => setMobileTab('fundraising')}
        className={cn(
          'min-w-0 flex-1 rounded-lg px-2 py-2.5 text-center text-xs font-medium transition-colors sm:text-sm',
          mobileTab === 'fundraising'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-muted',
        )}
      >
        Сбор
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mobileTab === 'fundraising_history'}
        onClick={() => setMobileTab('fundraising_history')}
        className={cn(
          'min-w-0 flex-1 rounded-lg px-2 py-2.5 text-center text-xs font-medium transition-colors sm:text-sm',
          mobileTab === 'fundraising_history'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-muted',
        )}
      >
        История сборов
      </button>
    </div>
  );
}
