/** Синхронизировано с backend/listing_lifecycle.py */
export const LISTING_EXPIRED_ARCHIVE_REASON = 'listing_expired';

export function daysUntilListingExpires(
  expiresAt: Date | undefined,
  now: Date = new Date(),
): number | null {
  if (!expiresAt) return null;
  const exp = new Date(expiresAt);
  exp.setUTCHours(0, 0, 0, 0);
  const cur = new Date(now);
  cur.setUTCHours(0, 0, 0, 0);
  return Math.round((exp.getTime() - cur.getTime()) / 86_400_000);
}

export function listingNeedsRenewal(
  pet: {
    isArchived: boolean;
    archiveReason?: string;
    moderationStatus?: string;
    expiresAt?: Date;
    petScope?: string;
  },
): boolean {
  if ((pet.petScope ?? 'lost_found') !== 'lost_found') return false;
  if (pet.isArchived && pet.archiveReason === LISTING_EXPIRED_ARCHIVE_REASON) return true;
  if (pet.isArchived || pet.moderationStatus !== 'approved') return false;
  const days = daysUntilListingExpires(pet.expiresAt);
  return days !== null && days <= 3;
}

export function listingExpiryUrgency(
  days: number | null,
): 'none' | 'warning' | 'critical' | 'expired' {
  if (days === null) return 'none';
  if (days <= 0) return 'expired';
  if (days <= 1) return 'critical';
  if (days <= 3) return 'warning';
  return 'none';
}
