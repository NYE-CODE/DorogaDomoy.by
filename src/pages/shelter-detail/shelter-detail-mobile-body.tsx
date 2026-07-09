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
      <div className="mb-5 inline-flex w-full rounded-lg border border-border bg-card p-1 lg:hidden">
        <button
          type="button"
          onClick={() => onMobileTabChange('about')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            mobileTab === 'about'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          О нас
        </button>
        <button
          type="button"
          onClick={() => onMobileTabChange('pets')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            mobileTab === 'pets'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          {s.tabPets}
        </button>
        <button
          type="button"
          onClick={() => onMobileTabChange('fundraisers')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            mobileTab === 'fundraisers'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted'
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
