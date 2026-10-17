import type { ReactNode } from 'react';
import { Archive, Building2, Heart, Home } from 'lucide-react';
import type { Pet } from '@/entities/pet/model/types';
import type { useI18n } from '@/app/providers/I18nContext';
import { translations } from '@/shared/i18n/translations';
import { LISTING_EXPIRED_ARCHIVE_REASON } from '@/shared/lib/listing-expiry';

export type PetDetailT = ReturnType<typeof useI18n>['t'];

export interface ArchiveBadgeStyle {
  icon: ReactNode;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

export function getArchiveReasonBadge(pet: Pet, t: PetDetailT): ArchiveBadgeStyle | null {
  if (!pet.isArchived || !pet.archiveReason) return null;

  let icon: ReactNode = null;
  let bgColor = 'bg-success/10 dark:bg-success/20';
  let textColor = 'text-success';
  let borderColor = 'border-success/30';

  const returnedLabels = [
    t.deleteReason.reasons.returned,
    translations.ru.deleteReason.reasons.returned,
    translations.be.deleteReason.reasons.returned,
    translations.en.deleteReason.reasons.returned,
  ];
  const adoptedLabels = [
    t.deleteReason.reasons.adopted,
    translations.ru.deleteReason.reasons.adopted,
    translations.be.deleteReason.reasons.adopted,
    translations.en.deleteReason.reasons.adopted,
  ];
  const transferredLabels = [
    t.deleteReason.reasons.transferred,
    translations.ru.deleteReason.reasons.transferred,
    translations.be.deleteReason.reasons.transferred,
    translations.en.deleteReason.reasons.transferred,
  ];

  if (pet.archiveReason === LISTING_EXPIRED_ARCHIVE_REASON) {
    icon = <Archive className="w-4 h-4" />;
    bgColor = 'bg-amber-50 dark:bg-amber-900/20';
    textColor = 'text-amber-800 dark:text-amber-300';
    borderColor = 'border-amber-200 dark:border-amber-800';
  } else if (returnedLabels.some((label) => pet.archiveReason === label)) {
    icon = <Home className="w-4 h-4" />;
  } else if (adoptedLabels.some((label) => pet.archiveReason === label)) {
    icon = <Heart className="w-4 h-4" />;
    bgColor = 'bg-lost-soft dark:bg-lost/20';
    textColor = 'text-lost-foreground dark:text-lost';
    borderColor = 'border-lost-border';
  } else if (transferredLabels.some((label) => pet.archiveReason === label)) {
    icon = <Building2 className="w-4 h-4" />;
    bgColor = 'bg-shelter-soft dark:bg-shelter/20';
    textColor = 'text-shelter-foreground dark:text-shelter';
    borderColor = 'border-shelter-border';
  }

  return { icon, bgColor, textColor, borderColor };
}
