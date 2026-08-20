import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Building2,
  ClipboardCheck,
  Coins,
  FileText,
  Flag,
  Handshake,
  Heart,
  HelpCircle,
  LayoutDashboard,
  LayoutTemplate,
  Megaphone,
  MessageCircle,
  Newspaper,
  PawPrint,
  Search,
  Settings,
  Tags,
  Users,
  Wrench,
} from 'lucide-react';
import { rewardsApi, sheltersApi } from '../../api/client';
import type { PointsTransactionItem } from '../../api/client';
import { useI18n } from '../../context/I18nContext';
import type { AdminStats } from '../../types/admin';
import {
  TAB_PRIMARY,
  TABS_BY_PRIMARY,
  type AdminPrimarySection,
  type AdminTab,
} from '../admin-panel-nav';
import type { AdminPanelProps } from './admin-panel-types';

export function useAdminPanel({
  pets,
  users,
  reports,
  mediaArticles,
  partners,
  profilePets,
  blogPosts,
  faqItems,
}: AdminPanelProps) {
  const { t, locale } = useI18n();
  const ap = t.adminPanel;

  const sectionMeta = useMemo(
    () =>
      [
        {
          id: 'dashboard' as const,
          label: ap.sections.dashboard,
          shortLabel: ap.sections.dashboardShort,
          icon: LayoutDashboard,
        },
        {
          id: 'landing' as const,
          label: ap.sections.landing,
          shortLabel: ap.sections.landingShort,
          icon: LayoutTemplate,
        },
        {
          id: 'petSearch' as const,
          label: ap.sections.petSearch,
          shortLabel: ap.sections.petSearchShort,
          icon: Search,
        },
        {
          id: 'shelter' as const,
          label: ap.sections.shelter,
          shortLabel: ap.sections.shelterShort,
          icon: Building2,
        },
        {
          id: 'blog' as const,
          label: ap.sections.blog,
          shortLabel: ap.sections.blogShort,
          icon: BookOpen,
        },
        {
          id: 'administration' as const,
          label: ap.sections.administration,
          shortLabel: ap.sections.administrationShort,
          icon: Wrench,
        },
      ] as const,
    [ap, locale],
  );

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [activePrimary, setActivePrimary] = useState<AdminPrimarySection>('dashboard');

  const selectTab = useCallback((tab: AdminTab) => {
    setActiveTab(tab);
    setActivePrimary(TAB_PRIMARY[tab]);
  }, []);

  const selectPrimary = useCallback((section: AdminPrimarySection) => {
    setActivePrimary(section);
    setActiveTab(TABS_BY_PRIMARY[section][0]);
  }, []);

  const [shelterPendingCount, setShelterPendingCount] = useState(0);
  const handleShelterPendingCountChange = useCallback((count: number) => {
    setShelterPendingCount(count);
  }, []);
  const refreshShelterPendingCount = useCallback(() => {
    sheltersApi
      .adminPending()
      .then((rows) => setShelterPendingCount(rows.length))
      .catch(() => setShelterPendingCount(0));
  }, []);

  useEffect(() => {
    refreshShelterPendingCount();
  }, [refreshShelterPendingCount]);

  const [pointsTransactions, setPointsTransactions] = useState<PointsTransactionItem[]>([]);
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const rows = await rewardsApi.listPointsTransactions({ limit: 300 });
        if (!cancelled) setPointsTransactions(rows);
      } catch {
        if (!cancelled) setPointsTransactions([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const refreshPointsTransactions = useCallback(() => {
    rewardsApi
      .listPointsTransactions({ limit: 300 })
      .then(setPointsTransactions)
      .catch(() => setPointsTransactions([]));
  }, []);

  const stats = useMemo((): AdminStats => {
    const now = Date.now();
    const dayMs = 1000 * 60 * 60 * 24;
    const petsLast7Days = pets.filter((p) => {
      const daysDiff = Math.floor((now - new Date(p.publishedAt).getTime()) / dayMs);
      return daysDiff <= 7;
    }).length;
    const petsLast30Days = pets.filter((p) => {
      const daysDiff = Math.floor((now - new Date(p.publishedAt).getTime()) / dayMs);
      return daysDiff <= 30;
    }).length;
    const profilePetsLast30Days = profilePets.filter((pp) => {
      const daysDiff = Math.floor((now - new Date(pp.created_at).getTime()) / dayMs);
      return daysDiff <= 30;
    }).length;
    const pointsPositiveSum = pointsTransactions.reduce(
      (s, row) => (row.amount > 0 ? s + row.amount : s),
      0,
    );
    return {
      totalPets: pets.length,
      activePets: pets.filter((p) => !p.isArchived).length,
      archivedPets: pets.filter((p) => p.isArchived).length,
      totalUsers: users.length,
      blockedUsers: users.filter((u) => u.isBlocked).length,
      pendingReports: reports.filter((r) => r.status === 'pending').length,
      resolvedReports: reports.filter((r) => r.status === 'resolved').length,
      petsLast7Days,
      petsLast30Days,
      successRate:
        pets.length > 0 ? (pets.filter((p) => p.status === 'found').length / pets.length) * 100 : 0,
      pendingModerationPets: pets.filter((p) => !p.isArchived && p.moderationStatus === 'pending')
        .length,
      searchingActivePets: pets.filter((p) => !p.isArchived && p.status === 'searching').length,
      reportsTotal: reports.length,
      reportsDismissed: reports.filter((r) => r.status === 'dismissed').length,
      reportsReviewed: reports.filter((r) => r.status === 'reviewed').length,
      usersRegular: users.filter((u) => u.role === 'user').length,
      usersVolunteers: users.filter((u) => u.role === 'volunteer').length,
      usersAdmins: users.filter((u) => u.role === 'admin').length,
      profilePetsTotal: profilePets.length,
      profilePetsLast30Days,
      blogPublished: blogPosts.filter((b) => b.status === 'published').length,
      blogDrafts: blogPosts.filter((b) => b.status !== 'published').length,
      blogTotal: blogPosts.length,
      mediaCount: mediaArticles.length,
      partnersCount: partners.length,
      faqCount: faqItems.length,
      sheltersPendingModeration: shelterPendingCount,
      pointsTransactionsCount: pointsTransactions.length,
      pointsPositiveSum,
      petsWithRewardGranted: pets.filter((p) => p.rewardPointsAwardedAt).length,
    };
  }, [
    pets,
    users,
    reports,
    profilePets,
    blogPosts,
    mediaArticles,
    partners,
    faqItems,
    shelterPendingCount,
    pointsTransactions,
  ]);

  const allTabs = useMemo(
    () =>
      [
        { id: 'dashboard' as const, label: ap.tabs.dashboard, icon: LayoutDashboard },
        { id: 'media' as const, label: ap.tabs.media, icon: Newspaper },
        { id: 'partners' as const, label: ap.tabs.partners, icon: Handshake },
        { id: 'partnerAds' as const, label: ap.tabs.partnerAds, icon: Megaphone },
        { id: 'helpSection' as const, label: ap.tabs.helpSection, icon: Heart },
        { id: 'faq' as const, label: ap.tabs.faq, icon: HelpCircle },
        { id: 'users' as const, label: ap.tabs.users, icon: Users },
        { id: 'profilePets' as const, label: ap.tabs.pets, icon: PawPrint },
        { id: 'pets' as const, label: ap.tabs.ads, icon: FileText },
        { id: 'moderation' as const, label: ap.tabs.moderation, icon: ClipboardCheck },
        { id: 'reports' as const, label: ap.tabs.reports, icon: AlertTriangle },
        { id: 'rewards' as const, label: ap.tabs.rewards, icon: Coins },
        { id: 'sheltersCatalog' as const, label: ap.tabs.sheltersCatalog, icon: Building2 },
        { id: 'sheltersModeration' as const, label: ap.tabs.sheltersModeration, icon: ClipboardCheck },
        { id: 'blog' as const, label: ap.tabs.articles, icon: BookOpen },
        { id: 'blogCategories' as const, label: ap.tabs.categories, icon: Tags },
        { id: 'telegramBlog' as const, label: ap.tabs.blogSettings, icon: MessageCircle },
        { id: 'featureFlags' as const, label: ap.tabs.featureFlags, icon: Flag },
        { id: 'settings' as const, label: ap.tabs.settings, icon: Settings },
      ] as const,
    [ap, locale],
  );

  const subTabs = useMemo(
    () =>
      TABS_BY_PRIMARY[activePrimary]
        .map((tid) => allTabs.find((tab) => tab.id === tid))
        .filter((x): x is (typeof allTabs)[number] => !!x),
    [activePrimary, allTabs],
  );

  const pendingModerationCount = useMemo(
    () => pets.filter((p) => p.moderationStatus === 'pending').length,
    [pets],
  );

  return {
    ap,
    activeTab,
    activePrimary,
    selectTab,
    selectPrimary,
    shelterPendingCount,
    handleShelterPendingCountChange,
    refreshShelterPendingCount,
    pointsTransactions,
    refreshPointsTransactions,
    stats,
    sectionMeta,
    subTabs,
    pendingModerationCount,
  };
}
