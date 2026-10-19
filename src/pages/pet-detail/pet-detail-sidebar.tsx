import type { ReactNode } from 'react';
import { Link } from 'react-router';
import {
  AlertCircle,
  Calendar,
  MapPin,
  MessageCircle,
  Palette,
  PawPrint,
  Send,
  User,
} from 'lucide-react';
import type { Pet } from '@/entities/pet/model/types';
import { formatCalendarDate, formatRelativeTime, petStatusSoftPillClass } from '@/shared/lib/pet-helpers';
import { cn } from '@/shared/ui/utils';
import { appMessengerCtaSizingClass, appOutlineCtaClass } from '@/shared/styles/cta-classes';
import { Button } from '@/shared/ui/button';
import { RewardBadge } from '../../../components/reward-badge';
import { RevealPhoneButton } from '../../../components/reveal-phone-button';
import { FavoriteHeartButton } from '../../../components/favorite-heart-button';
import { PartnerAdSlot } from '@/features/partner-ads/PartnerAdSlot';
import { formatArchiveReasonLabel } from '@/shared/lib/listing-expiry';
import { type ArchiveBadgeStyle } from './pet-detail-archive-badge';
import type { PetDetailT } from './pet-detail-archive-badge';

export interface PetDetailSidebarProps {
  pet: Pet;
  t: PetDetailT;
  archiveBadge: ArchiveBadgeStyle | null;
  onReport: () => void;
}

function AttrRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-landing-muted text-muted-foreground">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium leading-snug text-foreground">{value}</div>
      </div>
    </div>
  );
}

export function PetDetailSidebar({ pet, t, archiveBadge, onReport }: PetDetailSidebarProps) {
  const title =
    pet.name?.trim() ||
    [t.pet.animalType[pet.animalType], pet.breed?.trim()].filter(Boolean).join(' · ') ||
    t.pet.animalType[pet.animalType];

  const colorStr = pet.colors.length
    ? pet.colors.map((c) => t.pet.color[c]).join(', ')
    : t.pet.notSpecified;

  return (
    <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
      <div className="overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          <FavoriteHeartButton
            petId={pet.id}
            size="md"
            className="border-border bg-landing-muted text-foreground shadow-sm hover:bg-muted"
          />
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium',
              petStatusSoftPillClass[pet.status],
            )}
          >
            {pet.status === 'searching' ? t.pet.status.searching : t.pet.status.found}
          </span>
          {pet.status === 'searching' ? <RewardBadge pet={pet} compact /> : null}
        </div>

        <div className="divide-y divide-border/70">
          <AttrRow
            icon={<PawPrint className="size-4" aria-hidden />}
            label={t.filters.type}
            value={t.pet.animalType[pet.animalType]}
          />
          {pet.breed ? (
            <AttrRow
              icon={<PawPrint className="size-4" aria-hidden />}
              label={t.pet.breedLabel}
              value={pet.breed}
            />
          ) : null}
          {pet.approximateAge ? (
            <AttrRow
              icon={<Calendar className="size-4" aria-hidden />}
              label={t.pet.ageLabel}
              value={pet.approximateAge}
            />
          ) : null}
          <AttrRow
            icon={<User className="size-4" aria-hidden />}
            label={t.pet.genderLabel}
            value={t.pet.gender[pet.gender]}
          />
          <AttrRow
            icon={<Palette className="size-4" aria-hidden />}
            label={t.pet.colorLabel}
            value={colorStr}
          />
        </div>

        <div className="mt-4 space-y-2 border-t border-border pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4 shrink-0 text-primary" aria-hidden />
            <span className="min-w-0 truncate">{pet.city}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="size-4 shrink-0" aria-hidden />
            <span>
              {formatCalendarDate(pet.publishedAt)}
              <span className="mx-1.5 text-border">·</span>
              {formatRelativeTime(pet.publishedAt)}
            </span>
          </div>
        </div>
      </div>

      {!pet.isArchived && (
        <div className="overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6">
          <h2 className="font-display mb-4 text-lg font-semibold text-foreground">
            {t.pet.contacts}
          </h2>
          <div className="mb-5 flex items-center gap-3">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(pet.authorName)}&size=48&background=1a3026&color=f5f5f4`}
              alt=""
              className="size-12 rounded-full object-cover ring-2 ring-border"
            />
            <div className="min-w-0">
              <Link
                to={`/user/${pet.authorId}`}
                className="block truncate font-medium text-foreground transition-colors hover:text-primary"
              >
                {pet.authorName}
              </Link>
              <div className="text-sm text-muted-foreground">{t.petDetail.authorSubtitle}</div>
            </div>
          </div>
          <div className="space-y-3">
            {pet.contacts.phone && <RevealPhoneButton phone={pet.contacts.phone} />}
            {pet.contacts.telegram && (
              <Button
                className={cn(
                  appMessengerCtaSizingClass,
                  'w-full border-0 bg-telegram text-white hover:bg-telegram-hover',
                )}
                asChild
              >
                <a
                  href={`https://t.me/${pet.contacts.telegram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Send className="size-5" aria-hidden />
                  {t.petDetail.writeTelegram}
                </a>
              </Button>
            )}
            {pet.contacts.viber && (
              <Button
                className={cn(
                  appMessengerCtaSizingClass,
                  'w-full border-0 bg-viber text-white hover:bg-viber-hover',
                )}
                asChild
              >
                <a href={`viber://chat?number=${pet.contacts.viber.replace('+', '')}`}>
                  <MessageCircle className="size-5" aria-hidden />
                  {t.profile.viber}
                </a>
              </Button>
            )}
            <Button className={cn(appOutlineCtaClass, 'w-full')} asChild>
              <Link to={`/user/${pet.authorId}`}>{t.petDetail.viewAuthorAds}</Link>
            </Button>
          </div>
        </div>
      )}

      {pet.isArchived && (
        <div className="overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6">
          <div className="rounded-2xl bg-landing-muted/80 p-4 text-center">
            <p className="mb-3 text-sm text-muted-foreground">{t.petDetail.contactsHiddenArchived}</p>
            {archiveBadge && (
              <div className="flex justify-center">
                <div
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 ${archiveBadge.bgColor} ${archiveBadge.borderColor} ${archiveBadge.textColor}`}
                >
                  {archiveBadge.icon}
                  <span className="text-sm">
                    {formatArchiveReasonLabel(pet.archiveReason, t.myAds.expiredArchived)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <PartnerAdSlot placement="pet-detail-sidebar" compact />

      <button
        type="button"
        onClick={onReport}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm text-muted-foreground transition-colors hover:bg-card hover:text-destructive"
      >
        <AlertCircle className="size-4" aria-hidden />
        {t.petDetail.report}
      </button>
    </aside>
  );
}
