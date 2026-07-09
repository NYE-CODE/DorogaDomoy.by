import type { Pet } from '@/entities/pet/model/types';
import type { ShelterResponse } from '@/shared/api/client';
import { ShelterPetsSection } from '../../../components/shelter-pets-section';
import { ShelterDetailAboutSection } from './shelter-detail-about-section';
import { ShelterDetailFundraisersPanel } from './shelter-detail-fundraisers-panel';
import { ShelterDetailStatsRow } from './shelter-detail-stats-row';

export interface ShelterDetailDesktopBodyProps {
  row: ShelterResponse;
  s: Record<string, string>;
  addressLabel: string;
  locationLine: string;
  websiteHref: string | null;
  hasAnyContact: boolean;
  shelterPets: Pet[];
  totalPets: number;
  foundPets: number;
  searchingPets: number;
  activeTab: 'pets' | 'fundraisers';
  onActiveTabChange: (tab: 'pets' | 'fundraisers') => void;
  aboutMenuOpen: boolean;
  aboutMenuRef: React.RefObject<HTMLDivElement | null>;
  onToggleAboutMenu: () => void;
  onShare: () => void;
}

export function ShelterDetailDesktopBody({
  row,
  s,
  addressLabel,
  locationLine,
  websiteHref,
  hasAnyContact,
  shelterPets,
  totalPets,
  foundPets,
  searchingPets,
  activeTab,
  onActiveTabChange,
  aboutMenuOpen,
  aboutMenuRef,
  onToggleAboutMenu,
  onShare,
}: ShelterDetailDesktopBodyProps) {
  return (
    <div className="mb-8 hidden items-start gap-6 lg:grid lg:grid-cols-3">
      <ShelterDetailAboutSection
        row={row}
        s={s}
        addressLabel={addressLabel}
        locationLine={locationLine}
        websiteHref={websiteHref}
        hasAnyContact={hasAnyContact}
        sectionClassName="self-start rounded-lg border border-border bg-card p-6 shadow-sm lg:col-span-1"
        showShareMenu
        aboutMenuOpen={aboutMenuOpen}
        aboutMenuRef={aboutMenuRef}
        onToggleAboutMenu={onToggleAboutMenu}
        onShare={() => {
          onShare();
        }}
        headingClassName="text-xl font-bold tracking-tight text-foreground md:text-2xl"
      />

      <aside className="space-y-4 lg:col-span-2">
        <ShelterDetailStatsRow
          totalPets={totalPets}
          foundPets={foundPets}
          searchingPets={searchingPets}
        />

        <div className="inline-flex w-full rounded-lg border border-border bg-card p-1">
          <button
            type="button"
            onClick={() => onActiveTabChange('pets')}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'pets'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {s.tabPets}
          </button>
          <button
            type="button"
            onClick={() => onActiveTabChange('fundraisers')}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'fundraisers'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {s.detailTabFundraisers}
          </button>
        </div>

        {activeTab === 'pets' ? (
          <ShelterPetsSection shelterId={row.id} initialPets={shelterPets} />
        ) : (
          <ShelterDetailFundraisersPanel
            title={s.detailFundraisersTitle}
            emptyText={s.detailFundraisersEmpty}
            headingClassName="text-xl font-bold tracking-tight text-foreground md:text-2xl"
          />
        )}
      </aside>
    </div>
  );
}
