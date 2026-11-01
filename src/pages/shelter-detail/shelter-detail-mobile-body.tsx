import type { Pet } from '@/entities/pet/model/types';
import type { ShelterResponse } from '@/shared/api/client';
import { ShelterPetsSection } from '../../../components/shelter-pets-section';
import { ShelterDetailAboutSection } from './shelter-detail-about-section';
import { ShelterDetailFundraisersPanel } from './shelter-detail-fundraisers-panel';

export interface ShelterDetailMobileBodyProps {
  row: ShelterResponse;
  s: Record<string, string>;
  addressLabel: string;
  locationLine: string;
  websiteHref: string | null;
  hasAnyContact: boolean;
  shelterPets: Pet[];
  mobileTab: 'about' | 'pets' | 'fundraisers';
  onMobileTabChange: (tab: 'about' | 'pets' | 'fundraisers') => void;
}

export function ShelterDetailMobileBody({
  row,
  s,
  addressLabel,
  locationLine,
  websiteHref,
  hasAnyContact,
  shelterPets,
  mobileTab,
  onMobileTabChange,
}: ShelterDetailMobileBodyProps) {
  return (
    <>
      <div className="mb-5 grid w-full grid-cols-3 gap-0.5 rounded-md border border-border bg-muted/60 p-0.5 lg:hidden">
        <button
          type="button"
          onClick={() => onMobileTabChange('about')}
          className={`min-h-11 rounded-lg px-2 py-2 text-sm font-medium transition-all ${
            mobileTab === 'about'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-background/80 hover:text-foreground'
          }`}
        >
          О нас
        </button>
        <button
          type="button"
          onClick={() => onMobileTabChange('pets')}
          className={`min-h-11 rounded-lg px-2 py-2 text-sm font-medium transition-all ${
            mobileTab === 'pets'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-background/80 hover:text-foreground'
          }`}
        >
          {s.tabPets}
        </button>
        <button
          type="button"
          onClick={() => onMobileTabChange('fundraisers')}
          className={`min-h-11 rounded-lg px-2 py-2 text-sm font-medium transition-all ${
            mobileTab === 'fundraisers'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-background/80 hover:text-foreground'
          }`}
        >
          {s.detailTabFundraisers}
        </button>
      </div>

      <div className="mb-8 space-y-4 lg:hidden">
        {mobileTab === 'about' ? (
          <ShelterDetailAboutSection
            row={row}
            s={s}
            addressLabel={addressLabel}
            locationLine={locationLine}
            websiteHref={websiteHref}
            hasAnyContact={hasAnyContact}
          />
        ) : null}

        {mobileTab === 'pets' ? (
          <ShelterPetsSection shelterId={row.id} initialPets={shelterPets} />
        ) : null}

        {mobileTab === 'fundraisers' ? (
          <ShelterDetailFundraisersPanel
            title={s.detailFundraisersTitle}
            emptyText={s.detailFundraisersEmpty}
          />
        ) : null}
      </div>
    </>
  );
}
