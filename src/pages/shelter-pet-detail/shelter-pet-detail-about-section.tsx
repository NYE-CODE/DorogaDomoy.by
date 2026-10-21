import { Calendar } from 'lucide-react';
import type { Pet } from '@/entities/pet/model/types';
import { formatCalendarDate, formatRelativeTime } from '@/shared/lib/pet-helpers';
import { petScenarioSoftPillClass } from '@/shared/lib/pet-scenario-colors';
import { surfacePanel } from '@/shared/styles/surface-classes';
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
    <div className={cn(surfacePanel, 'p-5 sm:p-6', !showAbout && 'hidden')}>
      <h2 className="mb-4 font-display text-lg font-semibold text-foreground max-lg:hidden sm:text-xl">
        {t.shelterPet.stepAbout}
      </h2>
      <div className="space-y-4 text-sm">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="flex flex-wrap gap-2">
            <span
              className={cn(
                'rounded-full px-3 py-1 text-sm font-medium',
                petScenarioSoftPillClass.shelter,
              )}
            >
              {adoption}
            </span>
            <span className="rounded-full bg-landing-muted px-3 py-1 text-sm text-muted-foreground">
              {t.pet.animalType[pet.animalType]}
            </span>
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

        <p className="max-w-prose whitespace-pre-line text-base leading-relaxed text-muted-foreground">
          {pet.description || t.shelterPet.descriptionEmpty}
        </p>

        {(pet.registrationAuthority?.trim() || pet.registrationTokenNumber?.trim()) && (
          <div className="rounded-2xl border border-border bg-landing-muted/50 px-4 py-3 text-sm">
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

        <dl className="grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">{t.pet.breedLabel}</dt>
            <dd className="mt-0.5 font-medium text-foreground">{pet.breed?.trim() || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">{t.pet.colorLabel}</dt>
            <dd className="mt-0.5 font-medium text-foreground">{colors}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">{t.pet.ageLabel}</dt>
            <dd className="mt-0.5 font-medium text-foreground">{pet.approximateAge?.trim() || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Шерсть</dt>
            <dd className="mt-0.5 font-medium text-foreground">{coat}</dd>
          </div>
        </dl>

        <ShelterPetTraits pet={pet} className="mt-1" />

        <div className="border-t border-border pt-3 text-muted-foreground">
          <p className="inline-flex items-start gap-2">
            <Calendar className="mt-0.5 size-4 shrink-0" aria-hidden />
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
