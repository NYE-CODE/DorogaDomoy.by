export interface Report {
  id: string;
  petId: string;
  reporterId: string;
  reporterName: string;
  reason: ReportReason;
  description: string;
  createdAt: Date;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reviewedBy?: string;
  reviewedAt?: Date;
  resolution?: string;
}

export type ReportReason = 
  | 'spam'
  | 'inappropriate'
  | 'fake'
  | 'duplicate'
  | 'found'
  | 'other';

export const reportReasonLabels: Record<ReportReason, string> = {
  spam: 'Спам / Реклама',
  inappropriate: 'Неприемлемый контент',
  fake: 'Мошенничество / Фейк',
  duplicate: 'Дубликат объявления',
  found: 'Питомец уже найден',
  other: 'Другая причина'
};

export interface AdminStats {
  totalPets: number;
  activePets: number;
  archivedPets: number;
  totalUsers: number;
  blockedUsers: number;
  pendingReports: number;
  resolvedReports: number;
  petsLast7Days: number;
  petsLast30Days: number;
  successRate: number; // percentage of pets found
  /** Объявления на модерации (не в архиве) */
  pendingModerationPets: number;
  /** Активные объявления в статусе «ищут» */
  searchingActivePets: number;
  reportsTotal: number;
  reportsDismissed: number;
  reportsReviewed: number;
  usersVolunteers: number;
  usersShelters: number;
  usersAdmins: number;
  profilePetsTotal: number;
  profilePetsLast30Days: number;
  blogPublished: number;
  blogDrafts: number;
  blogTotal: number;
  mediaCount: number;
  partnersCount: number;
  faqCount: number;
  sheltersPendingModeration: number;
  pointsTransactionsCount: number;
  pointsPositiveSum: number;
  petsWithRewardGranted: number;
}
