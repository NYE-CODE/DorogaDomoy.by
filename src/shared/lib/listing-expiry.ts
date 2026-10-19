export const LISTING_EXPIRED_ARCHIVE_REASON = 'listing_expired';
export const DEFAULT_LISTING_REMINDER_DAYS = [3, 1] as const;
export const DEFAULT_AUTO_ARCHIVE_DAYS = 90;

/** Кандидаты для фильтра «Период» — показываем только те, что короче срока автоархивации. */
export const PERIOD_FILTER_CANDIDATES = [3, 7, 14, 30, 60, 90] as const;

/** Опции периода строго меньше auto_archive_days (иначе бессмысленно — старше уже в архиве). */
export function periodFilterDays(autoArchiveDays: number): number[] {
  const max = Math.max(1, Math.floor(autoArchiveDays) || DEFAULT_AUTO_ARCHIVE_DAYS);
  return PERIOD_FILTER_CANDIDATES.filter((d) => d < max);
}

/** Если выбранный период ≥ срока архивации — сбрасываем на «все». */
export function clampPeriodFilterDays(
  days: number | 'all',
  autoArchiveDays: number,
): number | 'all' {
  if (days === 'all') return 'all';
  const max = Math.max(1, Math.floor(autoArchiveDays) || DEFAULT_AUTO_ARCHIVE_DAYS);
  if (!Number.isFinite(days) || days < 1 || days >= max) return 'all';
  return days;
}

export function parseAutoArchiveDays(raw: string | undefined | null): number {
  const n = parseInt(String(raw ?? ''), 10);
  if (!Number.isFinite(n) || n < 1) return DEFAULT_AUTO_ARCHIVE_DAYS;
  return n;
}

/** Человекочитаемая причина архивации (код `listing_expired` → текст). */
export function formatArchiveReasonLabel(
  reason: string | undefined | null,
  expiredLabel = 'Срок размещения истёк',
): string {
  if (!reason) return '';
  if (reason === LISTING_EXPIRED_ARCHIVE_REASON) return expiredLabel;
  return reason;
}

export function parseListingReminderDays(raw: string | undefined | null): number[] {
  if (!raw?.trim()) return [...DEFAULT_LISTING_REMINDER_DAYS];
  const parsed: number[] = [];
  for (const part of raw.split(',')) {
    const day = parseInt(part.trim(), 10);
    if (!Number.isFinite(day) || day < 1 || day > 90) continue;
    if (!parsed.includes(day)) parsed.push(day);
  }
  if (!parsed.length) return [...DEFAULT_LISTING_REMINDER_DAYS];
  return parsed.sort((a, b) => b - a);
}

export function maxListingReminderDays(raw: string | undefined | null): number {
  const days = parseListingReminderDays(raw);
  return Math.max(...days, 1);
}

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
  renewPromptWithinDays = 3,
): boolean {
  if ((pet.petScope ?? 'lost_found') !== 'lost_found') return false;
  if (pet.isArchived && pet.archiveReason === LISTING_EXPIRED_ARCHIVE_REASON) return true;
  if (pet.isArchived || pet.moderationStatus !== 'approved') return false;
  const days = daysUntilListingExpires(pet.expiresAt);
  return days !== null && days <= renewPromptWithinDays;
}

export function listingExpiryUrgency(
  days: number | null,
  renewPromptWithinDays = 3,
): 'none' | 'warning' | 'critical' | 'expired' {
  if (days === null) return 'none';
  if (days <= 0) return 'expired';
  if (days <= 1) return 'critical';
  if (days <= renewPromptWithinDays) return 'warning';
  return 'none';
}
