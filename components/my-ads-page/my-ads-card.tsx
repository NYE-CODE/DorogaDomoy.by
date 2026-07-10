import { Link } from 'react-router';
import {
  AlertCircle,
  CalendarClock,
  Edit,
  Eye,
  MoreVertical,
  Rocket,
  Trash2,
} from 'lucide-react';
import type { Pet } from '@/entities/pet/model/types';
import { RewardBadge } from '../reward-badge';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';
import {
  daysUntilListingExpires,
  listingExpiryUrgency,
  listingNeedsRenewal,
} from '@/shared/lib/listing-expiry';
import { petStatusSoftPillClass } from '../../utils/pet-helpers';
import {
  formatMyAdDate,
  getMyAdExpiryLabel,
  getMyAdPetTypeLabel,
  getMyAdStatusTitle,
} from './my-ads-helpers';

const DEFAULT_PHOTO =
  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop';

export interface MyAdsCardProps {
  pet: Pet;
  dateLocale: string;
  t: {
    petForm: Record<string, string>;
    pet: {
      animalType: Record<string, string>;
      color: Record<string, string>;
    };
    myAds: Record<string, string>;
    moderation: Record<string, string>;
    common: Record<string, string>;
  };
  sightingCount: number;
  openMenuId: string | null;
  hoveredTooltipId: string | null;
  instagramBoostEnabled: boolean;
  renewPromptWithinDays?: number;
  onRenewPet?: (pet: Pet) => void;
  onToggleMenu: (petId: string) => void;
  onCloseMenu: () => void;
  onHoverTooltip: (petId: string | null) => void;
  onEdit: (e: React.MouseEvent, pet: Pet) => void;
  onDelete: (e: React.MouseEvent, pet: Pet) => void;
  onBoost: (e: React.MouseEvent, pet: Pet) => void;
  onRenew: (e: React.MouseEvent, pet: Pet) => void;
}

export function MyAdsCard({
  pet,
  dateLocale,
  t,
  sightingCount,
  openMenuId,
  hoveredTooltipId,
  instagramBoostEnabled,
  renewPromptWithinDays = 3,
  onRenewPet,
  onToggleMenu,
  onCloseMenu,
  onHoverTooltip,
  onEdit,
  onDelete,
  onBoost,
  onRenew,
}: MyAdsCardProps) {
  const photoUrl = pet.photos[0] || DEFAULT_PHOTO;
  const statusLabel = pet.status === 'searching' ? t.myAds.statusLost : t.myAds.statusFound;
  const statusTitle = getMyAdStatusTitle(pet, t.petForm);
  const petTypeLabel = getMyAdPetTypeLabel(pet, t.pet.animalType);
  const showRejectionTooltip =
    pet.moderationStatus === 'rejected' && pet.moderationReason && hoveredTooltipId === pet.id;
  const daysLeft = daysUntilListingExpires(pet.expiresAt);
  const expiryUrgency = listingExpiryUrgency(daysLeft, renewPromptWithinDays);
  const showRenew = listingNeedsRenewal(pet, renewPromptWithinDays);
  const expiryLabel = getMyAdExpiryLabel(pet, dateLocale, t.myAds);

  return (
    <div className="group/card relative rounded-lg border border-border bg-card p-3 transition-all hover:border-primary/30 hover:shadow-md sm:p-4">
      <div className="absolute right-2 top-2 z-30 sm:right-3 sm:top-3" data-my-ads-menu>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleMenu(pet.id);
          }}
          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={t.common.options}
        >
          <MoreVertical className="size-[1.125rem] sm:size-5" />
        </button>

        {openMenuId === pet.id ? (
          <div className="absolute right-0 z-40 mt-1 w-52 overflow-hidden rounded-md border border-border bg-popover py-1 text-popover-foreground shadow-lg sm:w-56">
            {pet.moderationStatus === 'rejected' ? (
              <button
                type="button"
                onClick={(e) => onEdit(e, pet)}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted"
              >
                <Edit className="size-4 shrink-0 text-muted-foreground" />
                <span>{t.myAds.fixAndResubmit}</span>
              </button>
            ) : null}
            {pet.moderationStatus !== 'pending' ? (
              <>
                {showRenew && onRenewPet ? (
                  <button
                    type="button"
                    onClick={(e) => onRenew(e, pet)}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-amber-500/10"
                  >
                    <CalendarClock className="size-4 shrink-0 text-amber-700 dark:text-amber-400" />
                    <span className="font-medium text-amber-800 dark:text-amber-300">
                      {t.myAds.renewPublication}
                    </span>
                  </button>
                ) : null}
                {instagramBoostEnabled &&
                pet.moderationStatus === 'approved' &&
                pet.status === 'searching' ? (
                  <button
                    type="button"
                    onClick={(e) => onBoost(e, pet)}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-primary/10"
                  >
                    <Rocket className="size-4 shrink-0 text-primary" />
                    <span className="font-medium text-primary">{t.myAds.boostInstagramStories}</span>
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={(e) => onEdit(e, pet)}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted"
                >
                  <Edit className="size-4 shrink-0 text-muted-foreground" />
                  <span>{t.common.edit}</span>
                </button>
              </>
            ) : null}
            <button
              type="button"
              onClick={(e) => onDelete(e, pet)}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
            >
              <Trash2 className="size-4 shrink-0" />
              <span>{t.common.delete}</span>
            </button>
          </div>
        ) : null}
      </div>

      <Link
        to={`/pet/${pet.id}`}
        className="flex cursor-pointer items-start gap-3 no-underline text-inherit sm:gap-4"
        onClick={onCloseMenu}
      >
        <div className="relative size-24 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-border sm:size-28">
          <img
            src={photoUrl}
            alt={statusTitle}
            className="size-full object-cover transition duration-300 group-hover/card:scale-[1.03]"
          />
        </div>

        <div className="min-w-0 flex-1 pr-10 sm:pr-12">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5 sm:mb-2 sm:gap-2">
            <span
              className={cn(
                'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium sm:px-3 sm:py-1',
                petStatusSoftPillClass[pet.status],
              )}
            >
              {statusLabel}
            </span>
            <RewardBadge pet={pet} compact />
            <h3 className="text-sm font-semibold text-foreground sm:text-base">{statusTitle}</h3>
            <span className="hidden text-muted-foreground sm:inline">·</span>
            <span className="hidden text-xs text-muted-foreground sm:inline sm:text-sm">
              {petTypeLabel}
            </span>
            {pet.moderationStatus === 'approved' && pet.status === 'searching' && sightingCount > 0 ? (
              <>
                <span className="hidden text-muted-foreground sm:inline">·</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground sm:text-sm">
                  <Eye className="size-3.5 sm:size-4" aria-hidden />
                  {sightingCount}
                </span>
              </>
            ) : null}
          </div>

          <div className="mb-1.5 text-xs text-muted-foreground sm:hidden">{petTypeLabel}</div>

          <div className="mb-1.5 flex flex-wrap items-center gap-1.5 sm:mb-2 sm:gap-2">
            {pet.colors.length > 0
              ? pet.colors.map((color, idx) => (
                  <span
                    key={idx}
                    className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground sm:px-2.5"
                  >
                    {t.pet.color[color as keyof typeof t.pet.color] ?? color}
                  </span>
                ))
              : null}

            {pet.moderationStatus === 'rejected' && pet.moderationReason ? (
              <div className="relative inline-flex">
                <span
                  className="flex cursor-help items-center gap-1 rounded-md bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-950/40 dark:text-red-300 sm:px-2.5"
                  onMouseEnter={() => onHoverTooltip(pet.id)}
                  onMouseLeave={() => onHoverTooltip(null)}
                >
                  <AlertCircle className="size-3 shrink-0" />
                  <span className="hidden sm:inline">{t.moderation.rejected}</span>
                  <span className="sm:hidden">{t.myAds.rejectedShort}</span>
                </span>

                {showRejectionTooltip ? (
                  <div className="pointer-events-none absolute bottom-full left-0 z-20 mb-2 w-56 rounded-md bg-foreground p-3 text-xs text-background shadow-lg sm:left-1/2 sm:w-64 sm:-translate-x-1/2">
                    <div className="mb-1 font-medium">{t.myAds.rejectionReasonTitle}</div>
                    <div className="text-background/90">{pet.moderationReason}</div>
                    <div className="absolute left-4 top-full -mt-px sm:left-1/2 sm:-translate-x-1/2">
                      <div className="border-4 border-transparent border-t-foreground" />
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground sm:gap-2 sm:text-sm">
            <span className="truncate">{pet.city}</span>
            <span className="shrink-0" aria-hidden>
              ·
            </span>
            <span className="shrink-0">{formatMyAdDate(pet.publishedAt, dateLocale)}</span>
            {expiryLabel && pet.moderationStatus === 'approved' ? (
              <>
                <span className="shrink-0" aria-hidden>
                  ·
                </span>
                <span
                  className={cn(
                    'shrink-0 font-medium',
                    expiryUrgency === 'critical' || expiryUrgency === 'expired'
                      ? 'text-destructive'
                      : expiryUrgency === 'warning'
                        ? 'text-amber-700 dark:text-amber-400'
                        : 'text-muted-foreground',
                  )}
                >
                  {expiryLabel}
                </span>
              </>
            ) : null}
          </div>
        </div>
      </Link>

      {showRenew && onRenewPet ? (
        <div className="mt-2 pl-[6.75rem] sm:mt-3 sm:pl-[8.25rem]">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 border-amber-300 text-amber-900 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-950/40"
            onClick={(e) => onRenew(e, pet)}
          >
            <CalendarClock className="size-4" aria-hidden />
            {t.myAds.renewPublication}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
