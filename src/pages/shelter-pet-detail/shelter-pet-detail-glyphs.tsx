import { CircleHelp, Heart, Mars, Venus } from 'lucide-react';
import type { Pet } from '@/entities/pet/model/types';
import { cn } from '@/shared/ui/utils';
import type { ShelterCampaignResponse, ShelterResponse } from '@/shared/api/client';
import type { useI18n } from '@/app/providers/I18nContext';

export type ShelterPetDetailT = ReturnType<typeof useI18n>['t'];

export function ShelterPetGenderGlyph({ gender }: { gender: Pet['gender'] }) {
  const Icon = gender === 'male' ? Mars : gender === 'female' ? Venus : CircleHelp;
  const cls =
    gender === 'male'
      ? 'text-sky-500'
      : gender === 'female'
        ? 'text-pink-500'
        : 'text-muted-foreground';
  return <Icon className={cn('size-5 shrink-0', cls)} aria-hidden />;
}

export function ShelterPetHealthGlyph({
  healthStatus,
  clipId,
}: {
  healthStatus?: string | null;
  clipId: string;
}) {
  switch (healthStatus) {
    case 'excellent':
      return <Heart className="size-5 shrink-0 fill-current text-rose-800" aria-hidden />;
    case 'good':
      return <Heart className="size-5 shrink-0 fill-current text-red-500" aria-hidden />;
    case 'treatment':
      return (
        <svg viewBox="0 0 24 24" className="size-5 shrink-0" aria-hidden>
          <defs>
            <clipPath id={clipId}>
              <rect x="0" y="12" width="24" height="12" />
            </clipPath>
          </defs>
          <path
            d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 1-4.5 2.5C10.5 4 9.26 3 7.5 3A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
            fill="none"
            stroke="rgb(252 165 165)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 1-4.5 2.5C10.5 4 9.26 3 7.5 3A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
            fill="rgb(239 68 68)"
            clipPath={`url(#${clipId})`}
          />
        </svg>
      );
    case 'disabled':
      return <Heart className="size-5 shrink-0 fill-current text-amber-300" aria-hidden />;
    default:
      return <Heart className="size-5 shrink-0 text-muted-foreground/50" aria-hidden />;
  }
}

export function getShelterPetAdoptionLabel(pet: Pet, t: ShelterPetDetailT): string {
  const s = pet.adoptionStatus ?? 'available';
  if (s === 'reserved') return t.myShelterPetsList.statusReserved;
  if (s === 'adopted') return t.myShelterPetsList.statusAdopted;
  if (s === 'on_treatment') return t.myShelterPetsList.statusTreatment;
  if (s === 'not_for_adoption') return t.myShelterPetsList.statusNotForAdoption;
  return t.myShelterPetsList.statusAvailable;
}

export function getShelterPetTraitLabels(t: ShelterPetDetailT) {
  return {
    health: {
      disabled: t.shelterPet.healthDisabled,
      treatment: t.shelterPet.healthTreatment,
      good: t.shelterPet.healthGood,
      excellent: t.shelterPet.healthExcellent,
    },
    coat: {
      smooth: t.shelterPet.coatSmooth,
      semi: t.shelterPet.coatSemi,
      fluffy: t.shelterPet.coatFluffy,
    },
  };
}

export function getShelterPetDisplayTraits(pet: Pet, t: ShelterPetDetailT) {
  const traitLabels = getShelterPetTraitLabels(t);
  const health = pet.healthStatus
    ? (traitLabels.health[pet.healthStatus as keyof typeof traitLabels.health] ?? pet.healthStatus)
    : '?';
  const coat = pet.coatType
    ? (traitLabels.coat[pet.coatType as keyof typeof traitLabels.coat] ?? pet.coatType)
    : '?';
  const colors = pet.colors.length > 0
    ? pet.colors
        .map((c) => t.pet.color[c as keyof typeof t.pet.color] || c)
        .filter((v) => String(v ?? '').trim().length > 0)
        .join(', ')
    : '?';
  return { health, coat, colors };
}

export interface ShelterContactDisplay {
  displayPhone?: string;
  displayTelegram?: string;
  displayViber?: string;
  displayEmail?: string;
  displayWebsiteUrl: string;
  hasContactChannels: boolean;
  shelterLocationLine: string;
}

export function getShelterContactDisplay(pet: Pet, shelter: ShelterResponse | null): ShelterContactDisplay {
  const shelterContacts = shelter?.contacts;
  const displayPhone = pet.contacts.phone?.trim() || shelterContacts?.phone?.trim();
  const displayTelegram = pet.contacts.telegram?.trim() || shelterContacts?.telegram?.trim();
  const displayViber = pet.contacts.viber?.trim();
  const displayEmail = shelterContacts?.email?.trim();
  const rawWebsite = shelterContacts?.website?.trim();
  const displayWebsiteUrl =
    rawWebsite &&
    (rawWebsite.startsWith('http://') || rawWebsite.startsWith('https://'))
      ? rawWebsite
      : rawWebsite
        ? `https://${rawWebsite}`
        : '';
  const hasContactChannels = !!(
    displayPhone ||
    displayTelegram ||
    displayViber ||
    displayEmail ||
    displayWebsiteUrl
  );
  const shelterLocationLine = shelter
    ? [shelter.city?.trim(), shelter.address?.trim()].filter(Boolean).join(', ')
    : '';
  return {
    displayPhone,
    displayTelegram,
    displayViber,
    displayEmail,
    displayWebsiteUrl,
    hasContactChannels,
    shelterLocationLine,
  };
}

export function getCampaignStats(campaigns: ShelterCampaignResponse[]) {
  const activeCampaign = campaigns.find((item) => item.status === 'active') ?? null;
  const historyCampaigns = campaigns.filter((item) => item.status === 'completed');
  const currentCampaign = activeCampaign;
  const currentCampaignEndsAt = currentCampaign?.ends_at ? new Date(currentCampaign.ends_at) : null;
  const hasValidCurrentCampaignEndsAt = Boolean(
    currentCampaignEndsAt && !Number.isNaN(currentCampaignEndsAt.getTime()),
  );
  const progressPercent = currentCampaign
    ? Math.max(0, Math.min(100, Math.round((currentCampaign.collected_amount / Math.max(1, currentCampaign.goal_amount)) * 100)))
    : 0;
  return {
    activeCampaign,
    historyCampaigns,
    currentCampaign,
    currentCampaignEndsAt,
    hasValidCurrentCampaignEndsAt,
    progressPercent,
  };
}
