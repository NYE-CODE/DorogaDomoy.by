import { useMemo, useEffect, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  Coins,
  FileText,
  LayoutTemplate,
  PawPrint,
  Search,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Pet } from '../types/pet';
import type { ProfilePetResponse, ShelterResponse } from '../api/client';
import { sheltersApi } from '../api/client';
import { AdminStats } from '../types/admin';
import { formatDate } from '../utils/pet-helpers';
import { useI18n } from '../context/I18nContext';
import { adm } from './admin-panel-chrome';
import {
  ADMIN_PLACEHOLDER_PHOTO,
  getAdminPetPreviewPhoto,
  shelterCatalogStatusLabel,
  shelterLogoPreview,
} from './admin-panel-helpers';

export interface AdminDashboardPanelProps {
  stats: AdminStats;
  pets: Pet[];
  profilePets: ProfilePetResponse[];
}

export function AdminDashboardPanel({
  stats,
  pets,
  profilePets,
}: AdminDashboardPanelProps) {
  const { t } = useI18n();
  const ap = t.adminPanel;
  const d = ap.dashboard;

  const [shelterAllList, setShelterAllList] = useState<ShelterResponse[]>([]);
  const [shelterAllLoading, setShelterAllLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setShelterAllLoading(true);

    (async () => {
      try {
        const rows = await sheltersApi.adminListAll();
        if (!cancelled) setShelterAllList(rows);
      } catch {
        if (!cancelled) setShelterAllList([]);
      } finally {
        if (!cancelled) setShelterAllLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const recentPets = useMemo(
    () =>
      [...pets]
        .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
        .slice(0, 5),
    [pets],
  );

  const recentProfilePets = useMemo(
    () =>
      [...profilePets]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5),
    [profilePets],
  );

  const recentShelters = useMemo(
    () =>
      [...shelterAllList]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5),
    [shelterAllList],
  );

  const dashSection = 'rounded-lg border border-border bg-card shadow-sm p-4';
  const dashCard =
    'rounded-lg border border-border bg-card shadow-sm p-3 flex flex-col min-h-[100px]';
  const dashRow =
    'flex items-center justify-between gap-2 p-2.5 bg-muted/30 dark:bg-muted/15 rounded-lg border border-transparent hover:border-border dark:hover:border-border transition-colors';
  const sectionLabel = 'text-xs font-semibold uppercase tracking-wider text-muted-foreground';

  const statsGrid = (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
      <div className={dashCard}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground leading-snug">{d.statTotalAds}</p>
            <p className="typo-h1 mt-0.5 tabular-nums">{stats.totalPets}</p>
          </div>
          <div className="p-2 bg-muted/60 dark:bg-muted/30 rounded-md shrink-0">
            <FileText className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
        <p className="mt-auto pt-2.5 text-xs sm:text-xs text-muted-foreground leading-relaxed">
          {d.statActive}: <span className="font-medium text-foreground">{stats.activePets}</span> ·{' '}
          {d.statArchived}: <span className="font-medium text-foreground">{stats.archivedPets}</span>
          <br />
          <span className="text-amber-700 dark:text-amber-400">{d.statModerationPending}:</span>{' '}
          <span className="font-medium text-foreground">{stats.pendingModerationPets}</span>
        </p>
      </div>

      <div className={dashCard}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground leading-snug">{d.statSearchingActive}</p>
            <p className="typo-h1 mt-0.5 tabular-nums">{stats.searchingActivePets}</p>
          </div>
          <div className="p-2 bg-muted/60 dark:bg-muted/30 rounded-md shrink-0">
            <Search className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
        <p className="mt-auto pt-2.5 text-xs sm:text-xs text-muted-foreground">
          {d.statSuccess}: <span className="font-semibold text-primary">{stats.successRate.toFixed(1)}%</span> ·{' '}
          {d.statSuccessHint}
        </p>
      </div>

      <div className={dashCard}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground leading-snug">{d.statUsers}</p>
            <p className="typo-h1 mt-0.5 tabular-nums">{stats.totalUsers}</p>
          </div>
          <div className="p-2 bg-muted/60 dark:bg-muted/30 rounded-md shrink-0">
            <Users className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
        <p className="mt-auto pt-2.5 text-xs sm:text-xs text-muted-foreground leading-relaxed">
          {d.statBlocked}: <span className="font-medium text-foreground">{stats.blockedUsers}</span>
          <br />
          <span className="text-xs sm:text-xs text-muted-foreground dark:text-muted-foreground">
            {d.statUsersRoles(stats.usersRegular, stats.usersVolunteers, stats.usersAdmins)}
          </span>
        </p>
      </div>

      <div className={dashCard}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground leading-snug">{d.statReports}</p>
            <p className="typo-h1 mt-0.5 tabular-nums">{stats.pendingReports}</p>
          </div>
          <div className="p-2 bg-muted/60 dark:bg-muted/30 rounded-md shrink-0">
            <AlertTriangle className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
        <p className="mt-auto pt-2.5 text-xs sm:text-xs text-muted-foreground leading-relaxed">
          {d.statReportsTotal}: <span className="font-medium text-foreground">{stats.reportsTotal}</span>
          <br />
          {d.statReportsMeta(stats.resolvedReports, stats.reportsDismissed, stats.reportsReviewed)}
        </p>
      </div>

      <div className={dashCard}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground leading-snug">{d.statProfilePets}</p>
            <p className="typo-h1 mt-0.5 tabular-nums">{stats.profilePetsTotal}</p>
          </div>
          <div className="p-2 bg-muted/60 dark:bg-muted/30 rounded-md shrink-0">
            <PawPrint className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
        <p className="mt-auto pt-2.5 text-xs sm:text-xs text-muted-foreground">
          {d.statProfilePetsHint(stats.profilePetsLast30Days)}
        </p>
      </div>

      <div className={dashCard}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground leading-snug">{d.statBlog}</p>
            <p className="typo-h1 mt-0.5 tabular-nums">{stats.blogPublished}</p>
          </div>
          <div className="p-2 bg-muted/60 dark:bg-muted/30 rounded-md shrink-0">
            <BookOpen className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
        <p className="mt-auto pt-2.5 text-xs sm:text-xs text-muted-foreground leading-relaxed">
          {d.statBlogMeta(stats.blogPublished, stats.blogDrafts)}
          <br />
          <span className="text-xs">{d.statBlogTotalLine(stats.blogTotal)}</span>
        </p>
      </div>

      <div className={dashCard}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground leading-snug">{d.statLanding}</p>
            <p className="text-sm font-semibold text-foreground mt-1.5 leading-snug">
              {d.statLandingMeta(stats.mediaCount, stats.partnersCount, stats.faqCount)}
            </p>
          </div>
          <div className="p-2 bg-muted/60 dark:bg-muted/30 rounded-md shrink-0">
            <LayoutTemplate className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
        <p className="mt-auto pt-2.5 text-xs sm:text-xs">
          <span className="text-muted-foreground">{d.statSheltersQueue}:</span>{' '}
          <span
            className={
              stats.sheltersPendingModeration > 0
                ? 'font-semibold text-amber-700 dark:text-amber-400'
                : 'font-medium text-foreground'
            }
          >
            {stats.sheltersPendingModeration}
          </span>
        </p>
      </div>

      <div className={dashCard}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground leading-snug">{d.statPointsTitle}</p>
            <p className="typo-h1 mt-0.5 tabular-nums">{stats.pointsPositiveSum}</p>
          </div>
          <div className="p-2 bg-muted/60 dark:bg-muted/30 rounded-md shrink-0">
            <Coins className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
        <p className="mt-auto pt-2.5 text-xs sm:text-xs text-muted-foreground leading-relaxed">
          {d.statPointsMeta(stats.pointsTransactionsCount, stats.pointsPositiveSum)}
        </p>
      </div>

      <div className={dashCard}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground leading-snug">{d.statRewardsGranted}</p>
            <p className="typo-h1 mt-0.5 tabular-nums">{stats.petsWithRewardGranted}</p>
          </div>
          <div className="p-2 bg-muted/60 dark:bg-muted/30 rounded-md shrink-0">
            <TrendingUp className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
        <p className="mt-auto pt-2.5 text-xs sm:text-xs text-muted-foreground">
          {d.statRewardsGrantedHint(stats.petsWithRewardGranted)}
        </p>
      </div>
    </div>
  );

  return (
    <div className={adm.page}>
      <h2 className={adm.title}>{d.title}</h2>

      <div className="space-y-5">
        <section className="space-y-2">
          <h3 className={sectionLabel}>{d.sectionMetrics}</h3>
          {statsGrid}
        </section>

        <section className={dashSection}>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
            <h3 className="text-sm font-semibold text-foreground">{d.activity}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-muted/40 dark:bg-muted/20 rounded-lg border border-border/80 dark:border-border/80">
              <p className="text-xs text-muted-foreground">{d.last7}</p>
              <p className="typo-h1 mt-0.5 tabular-nums">{stats.petsLast7Days}</p>
            </div>
            <div className="p-3 bg-muted/40 dark:bg-muted/20 rounded-lg border border-border/80 dark:border-border/80">
              <p className="text-xs text-muted-foreground">{d.last30}</p>
              <p className="typo-h1 mt-0.5 tabular-nums">{stats.petsLast30Days}</p>
            </div>
            <div className="p-3 bg-muted/40 dark:bg-muted/20 rounded-lg border border-border/80 dark:border-border/80">
              <p className="text-xs text-muted-foreground">{d.last30Profiles}</p>
              <p className="typo-h1 mt-0.5 tabular-nums">{stats.profilePetsLast30Days}</p>
            </div>
          </div>
        </section>

        <section className={dashSection}>
          <h3 className={sectionLabel}>{d.sectionLatest}</h3>
          <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="min-w-0 space-y-2">
              <h4 className="text-sm font-medium text-foreground">{d.recentAds}</h4>
              <div className="space-y-2">
                {recentPets.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">{d.emptyRecentList}</p>
                ) : (
                  recentPets.map((pet) => (
                    <div key={pet.id} className={dashRow}>
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={getAdminPetPreviewPhoto(pet)}
                          alt=""
                          className="w-10 h-10 object-cover rounded-md shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {pet.breed || ap.breedUnknown}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {pet.city} · {pet.authorName}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground shrink-0 tabular-nums">
                        {formatDate(pet.publishedAt)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="min-w-0 space-y-2">
              <h4 className="text-sm font-medium text-foreground">{d.recentProfilePets}</h4>
              <div className="space-y-2">
                {recentProfilePets.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">{d.emptyRecentList}</p>
                ) : (
                  recentProfilePets.map((pp) => (
                    <div key={pp.id} className={dashRow}>
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={pp.photos[0] || ADMIN_PLACEHOLDER_PHOTO}
                          alt=""
                          className="w-10 h-10 object-cover rounded-md shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{pp.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {pp.species}
                            {pp.owner_name ? ` · ${pp.owner_name}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground shrink-0 tabular-nums">
                        {formatDate(new Date(pp.created_at))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="min-w-0 space-y-2">
              <h4 className="text-sm font-medium text-foreground">{d.recentShelters}</h4>
              <div className="space-y-2">
                {shelterAllLoading && recentShelters.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">{d.sheltersListLoading}</p>
                ) : recentShelters.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">{d.emptyRecentList}</p>
                ) : (
                  recentShelters.map((sh) => (
                    <div key={sh.id} className={dashRow}>
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={shelterLogoPreview(sh.logo_url)}
                          alt=""
                          className="w-10 h-10 object-cover rounded-md shrink-0 bg-muted"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{sh.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {sh.city} ·{' '}
                            {shelterCatalogStatusLabel(sh.moderation_status, ap.sheltersCatalog)}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground shrink-0 tabular-nums text-right">
                        {formatDate(new Date(sh.created_at))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
