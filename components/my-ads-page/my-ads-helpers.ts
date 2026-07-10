import type { Pet } from '@/entities/pet/model/types';
import { daysUntilListingExpires, LISTING_EXPIRED_ARCHIVE_REASON } from '@/shared/lib/listing-expiry';

export function myAdsDateLocale(locale: string): string {
  return locale === 'be' ? 'be-BY' : locale === 'en' ? 'en-GB' : 'ru-RU';
}

export function getMyAdStatusTitle(
  pet: Pet,
  petForm: Record<string, string>,
): string {
  const key =
    pet.status === 'searching'
      ? pet.animalType === 'dog'
        ? 'formTitleLostDog'
        : pet.animalType === 'cat'
          ? 'formTitleLostCat'
          : 'formTitleLostOther'
      : pet.animalType === 'dog'
        ? 'formTitleFoundDog'
        : pet.animalType === 'cat'
          ? 'formTitleFoundCat'
          : 'formTitleFoundOther';
  return petForm[key] ?? key;
}

export function getMyAdPetTypeLabel(pet: Pet, animalTypeLabels: Record<string, string>): string {
  return pet.breed || animalTypeLabels[pet.animalType] || pet.animalType;
}

export function formatMyAdDate(date: Date, dateLocale: string): string {
  return date.toLocaleDateString(dateLocale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function getMyAdExpiryLabel(
  pet: Pet,
  dateLocale: string,
  labels: {
    expiredArchived: string;
    expiresToday: string;
    expiresTomorrow: string;
    expiresInDays: string;
    expiresOn: string;
  },
): string | null {
  if (pet.archiveReason === LISTING_EXPIRED_ARCHIVE_REASON) {
    return labels.expiredArchived;
  }
  const days = daysUntilListingExpires(pet.expiresAt);
  if (days === null) return null;
  if (days <= 0) return labels.expiresToday ?? null;
  if (days === 1) return labels.expiresTomorrow ?? null;
  if (days <= 3) return labels.expiresInDays?.replace('{n}', String(days)) ?? null;
  if (pet.expiresAt) {
    return (
      labels.expiresOn?.replace(
        '{date}',
        pet.expiresAt.toLocaleDateString(dateLocale, {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
      ) ?? null
    );
  }
  return null;
}
