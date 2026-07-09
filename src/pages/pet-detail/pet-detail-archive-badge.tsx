import type { ReactNode } from 'react';
import { Building2, Heart, Home } from 'lucide-react';
import type { Pet } from '@/entities/pet/model/types';
import type { useI18n } from '@/app/providers/I18nContext';
import { translations } from '@/shared/i18n/translations';

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
  let bgColor = 'bg-green-50 dark:bg-green-900/20';
  let textColor = 'text-green-700 dark:text-green-400';
  let borderColor = 'border-green-200 dark:border-green-800';

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

  if (returnedLabels.some((label) => pet.archiveReason === label)) {
    icon = <Home className="w-4 h-4" />;
  } else if (adoptedLabels.some((label) => pet.archiveReason === label)) {
    icon = <Heart className="w-4 h-4" />;
    bgColor = 'bg-pink-50 dark:bg-pink-900/20';
    textColor = 'text-pink-700 dark:text-pink-400';
    borderColor = 'border-pink-200 dark:border-pink-800';
  } else if (transferredLabels.some((label) => pet.archiveReason === label)) {
    icon = <Building2 className="w-4 h-4" />;
    bgColor = 'bg-green-50 dark:bg-green-900/20';
    textColor = 'text-green-700 dark:text-green-400';
    borderColor = 'border-border';
  }

  return { icon, bgColor, textColor, borderColor };
}
