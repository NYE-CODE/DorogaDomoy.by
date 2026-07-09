import { Calendar } from 'lucide-react';
import type { Pet } from '@/entities/pet/model/types';
import { formatCalendarDate, formatRelativeTime } from '@/shared/lib/pet-helpers';
import { petScenarioSoftPillClass } from '@/shared/lib/pet-scenario-colors';
import { cn } from '@/shared/ui/utils';
import { ShelterPetTraits } from '../../../components/ShelterPetTraits';
import {
  ShelterPetGenderGlyph,
  ShelterPetHealthGlyph,
  type ShelterPetDetailT,
} from './shelter-pet-detail-glyphs';
import { ShelterPetDetailShareMenu } from './shelter-pet-detail-share-menu';

export interface ShelterPetDetailAboutSectionProps {
  t: ShelterPetDetailT;
  pet: Pet;
  title: string;
  adoption: string;
  health: string;
  colors: string;
  coat: string;
  treatmentClipId: string;
  showAbout: boolean;
  showShareMenu: boolean;
  setShowShareMenu: (open: boolean) => void;
  shareMenuRef: React.RefObject<HTMLDivElement | null>;
  copiedKind: null | 'link' | 'full';
  cardLoading: null | 'feed' | 'story';
  onShareTelegram: () => void;
  onShareInstagramPost: () => void;
  onShareInstagramStory: () => void;
  onCopyPostText: () => void;
  onCopyLinkOnly: () => void;
}

export function ShelterPetDetailAboutSection({
  t,
  pet,
  title,
  adoption,
  health,
  colors,
  coat,
  treatmentClipId,
  showAbout,
  showShareMenu,
  setShowShareMenu,
  shareMenuRef,
  copiedKind,
  cardLoading,
  onShareTelegram,
  onShareInstagramPost,
  onShareInstagramStory,
  onCopyPostText,
  onCopyLinkOnly,
}: ShelterPetDetailAboutSectionProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card p-6 shadow-sm',
        !showAbout && 'hidden',
      )}
    >
      <h2 className="typo-h2 mb-4 max-lg:hidden">О питомце</h2>
      <div className="space-y-3 text-sm">
        <h1 className="typo-h1">{title}</h1>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="flex flex-wrap gap-2">
            <span className={cn('rounded-full px-3 py-1 text-sm font-medium', petScenarioSoftPillClass.shelter)}>{adoption}</span>
            <span className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">{t.pet.animalType[pet.animalType]}</span>
          </div>
          <div
            className="flex shrink-0 items-center gap-2.5"
            aria-label={`${t.pet.genderLabel}: ${t.pet.gender[pet.gender]}. Здоровье: ${health}`}
          >
            <span
              title={`${t.pet.genderLabel}: ${t.pet.gender[pet.gender]}`}
              className="inline-flex"
            >
              <ShelterPetGenderGlyph gender={pet.gender} />
            </span>
            <span title={`Здоровье: ${health}`} className="inline-flex text-rose-500">
              <ShelterPetHealthGlyph healthStatus={pet.healthStatus} clipId={treatmentClipId} />
            </span>
          </div>
        </div>

        <p className="pt-1 whitespace-pre-line leading-relaxed text-muted-foreground">{pet.description || t.shelterPet.descriptionEmpty}</p>
        {(pet.registrationAuthority?.trim() || pet.registrationTokenNumber?.trim()) && (
          <div className="mt-3 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
            <p className="font-semibold text-foreground">{t.petDetail.registrationTitle}</p>
            {pet.registrationAuthority?.trim() ? (
              <p className="mt-1 text-muted-foreground">
                <span className="text-foreground/80">{t.petDetail.registrationAuthority}: </span>
                {pet.registrationAuthority.trim()}
              </p>
            ) : null}
            {pet.registrationTokenNumber?.trim() ? (
              <p className="mt-1 text-muted-foreground">
                <span className="text-foreground/80">{t.petDetail.registrationToken}: </span>
                <span className="font-mono">{pet.registrationTokenNumber.trim()}</span>
              </p>
            ) : null}
          </div>
        )}
        <p><span className="text-muted-foreground">{t.pet.breedLabel}: </span>{pet.breed?.trim() || '?'}</p>
        <p><span className="text-muted-foreground">{t.pet.colorLabel}: </span>{colors}</p>
        <p><span className="text-muted-foreground">{t.pet.ageLabel}: </span>{pet.approximateAge?.trim() || '?'}</p>
        <p><span className="text-muted-foreground">Шерсть: </span>{coat}</p>
        <ShelterPetTraits pet={pet} className="mt-3" />
        <div className="border-t border-border pt-3 text-muted-foreground">
          <p className="inline-flex items-start gap-2">
            <Calendar className="size-4 shrink-0 mt-0.5" aria-hidden />
            <span>
              {t.petDetail.shelterAboutDatesLine
                .replace('{published}', formatCalendarDate(pet.publishedAt))
                .replace('{updated}', formatRelativeTime(pet.updatedAt))}
            </span>
          </p>
        </div>

        <ShelterPetDetailShareMenu
          t={t}
          showShareMenu={showShareMenu}
          setShowShareMenu={setShowShareMenu}
          shareMenuRef={shareMenuRef}
          copiedKind={copiedKind}
          cardLoading={cardLoading}
          onShareTelegram={onShareTelegram}
          onShareInstagramPost={onShareInstagramPost}
          onShareInstagramStory={onShareInstagramStory}
          onCopyPostText={onCopyPostText}
          onCopyLinkOnly={onCopyLinkOnly}
        />
      </div>
    </div>
  );
}
