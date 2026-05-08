import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LayoutDashboard,
  LayoutTemplate,
  FileText,
  Users,
  AlertTriangle,
  Settings,
  Flag,
  ArrowLeft,
  TrendingUp,
  Calendar,
  CheckCircle2,
  XCircle,
  Trash2,
  ClipboardCheck,
  Edit2,
  ExternalLink,
  X,
  Save,
  Newspaper,
  Plus,
  Handshake,
  PawPrint,
  BookOpen,
  MessageCircle,
  Wrench,
  Tags,
  HelpCircle,
  Instagram,
  Coins,
  Building2,
  Search,
  MapPin,
  Send,
  EyeOff,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { Pet } from '../types/pet';
import { User } from '../context/AuthContext';
import { Report, AdminStats, type ReportReason } from '../types/admin';
import { formatDate, statusLabels } from '../utils/pet-helpers';
import { BELARUS_MOBILE_PHONE_PLACEHOLDER } from '../utils/belarus-phone';
import { settingsApi, featureFlagsApi, blogApi, rewardsApi, sheltersApi, API_BASE } from '../api/client';
import type {
  BlogCategory,
  BlogPostAdmin,
  FaqItem,
  MediaArticle,
  Partner,
  PointsTransactionItem,
  ProfilePetResponse,
  ShelterResponse,
  ShelterAnimalFocus,
  ShelterKind,
} from '../api/client';
import { ModerationPanel } from './moderation-panel';
import { PetsAdminPanel } from './pets-admin-panel';
import { ProfilePetsAdminPanel } from './profile-pets-admin-panel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { BlogMarkdownEditor } from './blog-markdown-editor';
import { titleToBlogSlug } from '../utils/blog-slug';
import { useI18n } from '../context/I18nContext';
import { AdminInstagramPanel } from './admin-instagram-panel';
import { adm } from './admin-panel-chrome';
import { AdminTablePagination } from './admin-table-pagination';

type AdminTab =
  | 'dashboard'
  | 'moderation'
  | 'pets'
  | 'profilePets'
  | 'users'
  | 'rewards'
  | 'reports'
  | 'media'
  | 'blog'
  | 'blogCategories'
  | 'partners'
  | 'featureFlags'
  | 'instagram'
  | 'telegramBlog'
  | 'faq'
  | 'settings'
  | 'sheltersCatalog'
  | 'sheltersModeration';

type AdminPrimarySection = 'dashboard' | 'landing' | 'petSearch' | 'shelter' | 'blog' | 'administration';

const TAB_PRIMARY: Record<AdminTab, AdminPrimarySection> = {
  dashboard: 'dashboard',
  media: 'landing',
  partners: 'landing',
  faq: 'landing',
  users: 'petSearch',
  profilePets: 'petSearch',
  pets: 'petSearch',
  moderation: 'petSearch',
  reports: 'petSearch',
  rewards: 'petSearch',
  sheltersCatalog: 'shelter',
  sheltersModeration: 'shelter',
  blog: 'blog',
  blogCategories: 'blog',
  telegramBlog: 'blog',
  featureFlags: 'administration',
  instagram: 'administration',
  settings: 'administration',
};

const TABS_BY_PRIMARY: Record<AdminPrimarySection, AdminTab[]> = {
  dashboard: ['dashboard'],
  landing: ['media', 'partners', 'faq'],
  petSearch: ['users', 'profilePets', 'pets', 'moderation', 'reports', 'rewards'],
  shelter: ['sheltersCatalog', 'sheltersModeration'],
  blog: ['blog', 'blogCategories', 'telegramBlog'],
  administration: ['featureFlags', 'instagram', 'settings'],
};

const ADMIN_PLACEHOLDER_PHOTO =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">' +
      '<rect width="96" height="96" fill="#f3f4f6"/>' +
      '<path d="M24 63l12-14 15 17 10-9 11 13H24z" fill="#d1d5db"/>' +
      '<circle cx="39" cy="33" r="8" fill="#d1d5db"/>' +
    '</svg>'
  );

function getAdminPetPreviewPhoto(pet: Pet): string {
  const first = pet.photos?.[0];
  return first || ADMIN_PLACEHOLDER_PHOTO;
}

interface AdminPanelProps {
  pets: Pet[];
  users: User[];
  reports: Report[];
  mediaArticles: MediaArticle[];
  partners: Partner[];
  profilePets: ProfilePetResponse[];
  onBack: () => void;
  onUpdatePet: (pet: Pet) => void;
  onDeletePet: (petId: string) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onUpdateReport: (report: Report) => void;
  onDeleteReport: (reportId: string) => void;
  onMediaCreate: (data: { logo_url?: string; title: string; published_at: string; link?: string }) => void;
  onMediaUpdate: (id: string, data: Partial<{ logo_url: string; title: string; published_at: string; link: string }>) => void;
  onMediaDelete: (id: string) => void;
  onPartnerCreate: (data: { logo_url?: string; name: string; link?: string; is_medallion_partner?: boolean }) => void;
  onPartnerUpdate: (id: string, data: Partial<{ logo_url: string; name: string; link: string; is_medallion_partner: boolean }>) => void;
  onPartnerDelete: (id: string) => void;
  onDeleteProfilePet: (id: string) => void;
  blogPosts: BlogPostAdmin[];
  onBlogCreate: (data: {
    slug: string;
    title: string;
    excerpt?: string;
    body_md: string;
    cover_image_url?: string;
    meta_description?: string;
    category?: string;
    status?: 'draft' | 'published';
  }) => void;
  onBlogUpdate: (
    id: string,
    data: Partial<{
      slug: string;
      title: string;
      excerpt: string;
      body_md: string;
      cover_image_url: string;
      meta_description: string;
      category: string;
      status: 'draft' | 'published';
    }>,
  ) => void;
  onBlogDelete: (id: string) => void;
  onBlogSendTelegram: (id: string) => void;
  faqItems: FaqItem[];
  onFaqCreate: (data: {
    question_ru?: string;
    question_be?: string;
    question_en?: string;
    answer_ru?: string;
    answer_be?: string;
    answer_en?: string;
    sort_order?: number;
  }) => void;
  onFaqUpdate: (
    id: string,
    data: Partial<{
      question_ru: string;
      question_be: string;
      question_en: string;
      answer_ru: string;
      answer_be: string;
      answer_en: string;
      sort_order: number;
    }>,
  ) => void;
  onFaqDelete: (id: string) => void;
}

export function AdminPanel({ 
  pets, 
  users, 
  reports,
  mediaArticles,
  partners,
  profilePets,
  onBack,
  onUpdatePet,
  onDeletePet,
  onUpdateUser,
  onDeleteUser,
  onUpdateReport,
  onDeleteReport,
  onMediaCreate,
  onMediaUpdate,
  onMediaDelete,
  onPartnerCreate,
  onPartnerUpdate,
  onPartnerDelete,
  onDeleteProfilePet,
  blogPosts,
  onBlogCreate,
  onBlogUpdate,
  onBlogDelete,
  onBlogSendTelegram,
  faqItems,
  onFaqCreate,
  onFaqUpdate,
  onFaqDelete,
}: AdminPanelProps) {
  const { t, locale } = useI18n();
  const ap = t.adminPanel;

  const sectionMeta = useMemo(
    () =>
      [
        { id: 'dashboard' as const, label: ap.sections.dashboard, shortLabel: ap.sections.dashboardShort, icon: LayoutDashboard },
        { id: 'landing' as const, label: ap.sections.landing, shortLabel: ap.sections.landingShort, icon: LayoutTemplate },
        { id: 'petSearch' as const, label: ap.sections.petSearch, shortLabel: ap.sections.petSearchShort, icon: Search },
        { id: 'shelter' as const, label: ap.sections.shelter, shortLabel: ap.sections.shelterShort, icon: Building2 },
        { id: 'blog' as const, label: ap.sections.blog, shortLabel: ap.sections.blogShort, icon: BookOpen },
        { id: 'administration' as const, label: ap.sections.administration, shortLabel: ap.sections.administrationShort, icon: Wrench },
      ] as const,
    [ap, locale],
  );

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [activePrimary, setActivePrimary] = useState<AdminPrimarySection>('dashboard');

  const selectTab = (tab: AdminTab) => {
    setActiveTab(tab);
    setActivePrimary(TAB_PRIMARY[tab]);
  };

  const selectPrimary = (section: AdminPrimarySection) => {
    setActivePrimary(section);
    setActiveTab(TABS_BY_PRIMARY[section][0]);
  };

  // Edit user modal
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<User['role']>('user');
  const [editPhone, setEditPhone] = useState('');
  const [editViber, setEditViber] = useState('');

  // Users filters and pagination
  const [usersSearch, setUsersSearch] = useState('');
  const [usersRoleFilter, setUsersRoleFilter] = useState<string>('all');
  const [usersStatusFilter, setUsersStatusFilter] = useState<string>('all');
  const [usersPage, setUsersPage] = useState(1);
  const usersPerPage = 15;
  const [usersSortBy, setUsersSortBy] = useState<'confirmed' | 'points' | null>(null);
  const [usersSortDir, setUsersSortDir] = useState<'asc' | 'desc'>('desc');

  // Reports filters and pagination
  const [reportsStatusFilter, setReportsStatusFilter] = useState<string>('all');
  const [reportsReasonFilter, setReportsReasonFilter] = useState<string>('all');
  const [reportsPage, setReportsPage] = useState(1);
  const reportsPerPage = 10;
  const [rewardsKindFilter, setRewardsKindFilter] = useState<string>('all');

  const [shelterPendingList, setShelterPendingList] = useState<ShelterResponse[]>([]);
  const [shelterListLoading, setShelterListLoading] = useState(false);
  const [shelterReasons, setShelterReasons] = useState<Record<string, string>>({});
  const [shelterAllList, setShelterAllList] = useState<ShelterResponse[]>([]);
  const [shelterAllLoading, setShelterAllLoading] = useState(false);
  const [shelterCatalogEdit, setShelterCatalogEdit] = useState<ShelterResponse | null>(null);
  const [editScName, setEditScName] = useState('');
  const [editScKind, setEditScKind] = useState<ShelterKind>('shelter');
  const [editScFocus, setEditScFocus] = useState<ShelterAnimalFocus>('mixed');
  const [editScDescription, setEditScDescription] = useState('');
  const [editScCity, setEditScCity] = useState('');
  const [editScAddress, setEditScAddress] = useState('');
  const [editScLat, setEditScLat] = useState('');
  const [editScLng, setEditScLng] = useState('');
  const [editScLogo, setEditScLogo] = useState('');
  const [editScCover, setEditScCover] = useState('');
  const [editScPhone, setEditScPhone] = useState('');
  const [editScTelegram, setEditScTelegram] = useState('');
  const [editScWebsite, setEditScWebsite] = useState('');
  const [editScEmail, setEditScEmail] = useState('');

  // Media article modal (create/edit)
  const [editingMedia, setEditingMedia] = useState<MediaArticle | 'create' | null>(null);
  const [editLogoUrl, setEditLogoUrl] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editPublishedAt, setEditPublishedAt] = useState('');
  const [editLink, setEditLink] = useState('');

  const [editingBlog, setEditingBlog] = useState<BlogPostAdmin | 'create' | null>(null);
  const [editBlogSlug, setEditBlogSlug] = useState('');
  const [editBlogTitle, setEditBlogTitle] = useState('');
  const [editBlogExcerpt, setEditBlogExcerpt] = useState('');
  const [editBlogBody, setEditBlogBody] = useState('');
  const [editBlogCover, setEditBlogCover] = useState('');
  const [editBlogMeta, setEditBlogMeta] = useState('');
  const [editBlogCategory, setEditBlogCategory] = useState('');
  const [editBlogStatus, setEditBlogStatus] = useState<'draft' | 'published'>('draft');
  /** Пока false — slug пересчитывается из заголовка (только новая статья). */
  const [blogSlugUserTouched, setBlogSlugUserTouched] = useState(false);

  // Partner modal (create/edit)
  const [editingPartner, setEditingPartner] = useState<Partner | 'create' | null>(null);
  const [editPartnerLogoUrl, setEditPartnerLogoUrl] = useState('');
  const [editPartnerName, setEditPartnerName] = useState('');
  const [editPartnerLink, setEditPartnerLink] = useState('');
  const [editPartnerMedallion, setEditPartnerMedallion] = useState(false);

  const [editingFaq, setEditingFaq] = useState<FaqItem | 'create' | null>(null);
  const [editFaqQr, setEditFaqQr] = useState('');
  const [editFaqQb, setEditFaqQb] = useState('');
  const [editFaqQe, setEditFaqQe] = useState('');
  const [editFaqAr, setEditFaqAr] = useState('');
  const [editFaqAb, setEditFaqAb] = useState('');
  const [editFaqAe, setEditFaqAe] = useState('');
  const [editFaqSort, setEditFaqSort] = useState(0);

  // Platform settings (stored on backend)
  const [settings, setSettings] = useState({
    requireModeration: true,
    autoArchiveDays: 90,
    maxPhotos: 5,
    rewardDefaultPoints: 50,
  });

  const [featureFlags, setFeatureFlags] = useState({
    ff_landing_show_stats: true,
    ff_landing_show_help: true,
    ff_landing_show_pets_feature: true,
    ff_landing_show_faq: true,
    ff_instagram_boost_stories: true,
    ff_reward_enabled: true,
    ff_reward_money_enabled: true,
  });

  const [blogTelegramChatId, setBlogTelegramChatId] = useState('');
  const [blogTelegramPublicUsername, setBlogTelegramPublicUsername] = useState('');
  const [pointsTransactions, setPointsTransactions] = useState<PointsTransactionItem[]>([]);

  const [blogCategories, setBlogCategories] = useState<BlogCategory[]>([]);
  const [editingBlogCategory, setEditingBlogCategory] = useState<BlogCategory | 'create' | null>(null);
  const [editCatSlug, setEditCatSlug] = useState('');
  const [editCatTitle, setEditCatTitle] = useState('');
  const [editCatSort, setEditCatSort] = useState(0);

  useEffect(() => {
    if (activePrimary !== 'blog') return;
    blogApi.listCategories().then(setBlogCategories).catch(() => setBlogCategories([]));
  }, [activePrimary, activeTab]);

  useEffect(() => {
    if (activeTab !== 'sheltersCatalog' && activeTab !== 'dashboard') return;
    setShelterAllLoading(true);
    sheltersApi
      .adminListAll()
      .then(setShelterAllList)
      .catch(() => setShelterAllList([]))
      .finally(() => setShelterAllLoading(false));
  }, [activeTab]);

  useEffect(() => {
    settingsApi.get().then((s) => {
      setSettings({
        requireModeration: s.require_moderation === 'true',
        autoArchiveDays: parseInt(s.auto_archive_days, 10) || 90,
        maxPhotos: parseInt(s.max_photos, 10) || 5,
        rewardDefaultPoints: parseInt(s.reward_default_points ?? '50', 10) || 50,
      });
      setBlogTelegramChatId(s.telegram_blog_chat_id ?? '');
      setBlogTelegramPublicUsername(s.telegram_blog_public_username ?? '');
    }).catch((err: unknown) => {
      console.warn('[AdminPanel] settings load failed', err);
    });
  }, []);

  useEffect(() => {
    rewardsApi.listPointsTransactions({ limit: 300 }).then(setPointsTransactions).catch(() => {
      setPointsTransactions([]);
    });
  }, []);

  useEffect(() => {
    featureFlagsApi.get().then((ff) => {
      setFeatureFlags({
        ff_landing_show_stats: ff.ff_landing_show_stats === 'true',
        ff_landing_show_help: ff.ff_landing_show_help === 'true',
        ff_landing_show_pets_feature:
          (ff.ff_landing_show_pets_feature ?? 'true') === 'true',
        ff_landing_show_faq: (ff.ff_landing_show_faq ?? 'true') === 'true',
        ff_instagram_boost_stories: (ff.ff_instagram_boost_stories ?? 'true') === 'true',
        ff_reward_enabled: (ff.ff_reward_enabled ?? 'true') === 'true',
        ff_reward_money_enabled: (ff.ff_reward_money_enabled ?? 'true') === 'true',
      });
    }).catch((err: unknown) => {
      console.warn('[AdminPanel] feature flags load failed', err);
    });
  }, []);

  const fetchShelterPending = useCallback(() => {
    setShelterListLoading(true);
    sheltersApi
      .adminPending()
      .then(setShelterPendingList)
      .catch(() => setShelterPendingList([]))
      .finally(() => setShelterListLoading(false));
  }, []);

  useEffect(() => {
    fetchShelterPending();
  }, [fetchShelterPending]);

  const handleSaveSettings = () => {
    settingsApi.update({
      require_moderation: settings.requireModeration ? 'true' : 'false',
      auto_archive_days: String(settings.autoArchiveDays),
      max_photos: String(settings.maxPhotos),
      reward_default_points: String(settings.rewardDefaultPoints),
    }).then(() => {
      toast.success(ap.toasts.settingsSaved);
    }).catch(() => {
      toast.error(ap.toasts.settingsError);
    });
  };

  const handleSaveFeatureFlags = () => {
    featureFlagsApi.update({
      ff_landing_show_stats: featureFlags.ff_landing_show_stats,
      ff_landing_show_help: featureFlags.ff_landing_show_help,
      ff_landing_show_pets_feature: featureFlags.ff_landing_show_pets_feature,
      ff_landing_show_faq: featureFlags.ff_landing_show_faq,
      ff_instagram_boost_stories: featureFlags.ff_instagram_boost_stories,
      ff_reward_enabled: featureFlags.ff_reward_enabled,
      ff_reward_money_enabled: featureFlags.ff_reward_money_enabled,
    }).then(() => {
      toast.success(ap.toasts.flagsSaved);
    }).catch(() => {
      toast.error(ap.toasts.flagsError);
    });
  };

  const handleSaveBlogTelegramSettings = () => {
    settingsApi
      .update({
        telegram_blog_chat_id: blogTelegramChatId.trim(),
        telegram_blog_public_username: blogTelegramPublicUsername.trim().replace(/^@/, ''),
      })
      .then((s) => {
        setBlogTelegramChatId(s.telegram_blog_chat_id ?? '');
        setBlogTelegramPublicUsername(s.telegram_blog_public_username ?? '');
        toast.success(ap.toasts.telegramSaved);
      })
      .catch(() => {
        toast.error(ap.toasts.telegramError);
      });
  };

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
    const pointsPositiveSum = pointsTransactions.reduce((s, t) => (t.amount > 0 ? s + t.amount : s), 0);
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
      pendingModerationPets: pets.filter((p) => !p.isArchived && p.moderationStatus === 'pending').length,
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
      sheltersPendingModeration: shelterPendingList.length,
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
    shelterPendingList,
    pointsTransactions,
  ]);
  const recentPets = [...pets]
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
    .slice(0, 5);

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

  const shelterCatalogStatusLabel = (st: ShelterResponse['moderation_status']) => {
    const sc = ap.sheltersCatalog;
    switch (st) {
      case 'draft':
        return sc.statusDraft;
      case 'pending':
        return sc.statusPending;
      case 'approved':
        return sc.statusApproved;
      case 'rejected':
        return sc.statusRejected;
      case 'hidden':
      default:
        return sc.statusHidden;
    }
  };

  const shelterLogoPreview = (url?: string | null) => {
    if (!url) return ADMIN_PLACEHOLDER_PHOTO;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `${API_BASE}${url}`;
  };

  const allTabs = useMemo(
    () =>
      [
        { id: 'dashboard' as const, label: ap.tabs.dashboard, icon: LayoutDashboard },
        { id: 'media' as const, label: ap.tabs.media, icon: Newspaper },
        { id: 'partners' as const, label: ap.tabs.partners, icon: Handshake },
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
        { id: 'instagram' as const, label: ap.tabs.instagram, icon: Instagram },
        { id: 'settings' as const, label: ap.tabs.settings, icon: Settings },
      ] as const,
    [ap, locale],
  );

  const subTabs = useMemo(
    () =>
      TABS_BY_PRIMARY[activePrimary]
        .map((tid) => allTabs.find((t) => t.id === tid))
        .filter((x): x is (typeof allTabs)[number] => !!x),
    [activePrimary, allTabs],
  );

  const faqRowsSorted = useMemo(
    () =>
      [...faqItems].sort((a, b) =>
        a.sort_order !== b.sort_order ? a.sort_order - b.sort_order : a.id.localeCompare(b.id),
      ),
    [faqItems],
  );

  const renderDashboard = () => {
    const d = ap.dashboard;
    const dashSection = 'rounded-lg border border-gray-200 dark:border-gray-700 bg-card shadow-sm p-4';
    const dashCard =
      'rounded-lg border border-gray-200 dark:border-gray-700 bg-card shadow-sm p-3 flex flex-col min-h-[100px]';
    const dashRow =
      'flex items-center justify-between gap-2 p-2.5 bg-muted/30 dark:bg-muted/15 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-colors';
    const sectionLabel = 'text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400';

    const statsGrid = (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        <div className={dashCard}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-snug">{d.statTotalAds}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5 tabular-nums">{stats.totalPets}</p>
            </div>
            <div className="p-2 bg-muted/60 dark:bg-muted/30 rounded-md shrink-0">
              <FileText className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
          <p className="mt-auto pt-2.5 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            {d.statActive}: <span className="font-medium text-gray-800 dark:text-gray-200">{stats.activePets}</span> ·{' '}
            {d.statArchived}: <span className="font-medium text-gray-800 dark:text-gray-200">{stats.archivedPets}</span>
            <br />
            <span className="text-amber-700 dark:text-amber-400">{d.statModerationPending}:</span>{' '}
            <span className="font-medium text-gray-800 dark:text-gray-200">{stats.pendingModerationPets}</span>
          </p>
        </div>

        <div className={dashCard}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-snug">{d.statSearchingActive}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5 tabular-nums">
                {stats.searchingActivePets}
              </p>
            </div>
            <div className="p-2 bg-muted/60 dark:bg-muted/30 rounded-md shrink-0">
              <Search className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
          <p className="mt-auto pt-2.5 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
            {d.statSuccess}: <span className="font-semibold text-primary">{stats.successRate.toFixed(1)}%</span> —{' '}
            {d.statSuccessHint}
          </p>
        </div>

        <div className={dashCard}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-snug">{d.statUsers}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5 tabular-nums">{stats.totalUsers}</p>
            </div>
            <div className="p-2 bg-muted/60 dark:bg-muted/30 rounded-md shrink-0">
              <Users className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
          <p className="mt-auto pt-2.5 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            {d.statBlocked}: <span className="font-medium text-gray-800 dark:text-gray-200">{stats.blockedUsers}</span>
            <br />
            <span className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-500">
              {d.statUsersRoles(stats.usersRegular, stats.usersVolunteers, stats.usersAdmins)}
            </span>
          </p>
        </div>

        <div className={dashCard}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-snug">{d.statReports}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5 tabular-nums">{stats.pendingReports}</p>
            </div>
            <div className="p-2 bg-muted/60 dark:bg-muted/30 rounded-md shrink-0">
              <AlertTriangle className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
          <p className="mt-auto pt-2.5 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            {d.statReportsTotal}: <span className="font-medium text-gray-800 dark:text-gray-200">{stats.reportsTotal}</span>
            <br />
            {d.statReportsMeta(stats.resolvedReports, stats.reportsDismissed, stats.reportsReviewed)}
          </p>
        </div>

        <div className={dashCard}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-snug">{d.statProfilePets}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5 tabular-nums">
                {stats.profilePetsTotal}
              </p>
            </div>
            <div className="p-2 bg-muted/60 dark:bg-muted/30 rounded-md shrink-0">
              <PawPrint className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
          <p className="mt-auto pt-2.5 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
            {d.statProfilePetsHint(stats.profilePetsLast30Days)}
          </p>
        </div>

        <div className={dashCard}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-snug">{d.statBlog}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5 tabular-nums">{stats.blogPublished}</p>
            </div>
            <div className="p-2 bg-muted/60 dark:bg-muted/30 rounded-md shrink-0">
              <BookOpen className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
          <p className="mt-auto pt-2.5 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            {d.statBlogMeta(stats.blogPublished, stats.blogDrafts)}
            <br />
            <span className="text-[10px]">{d.statBlogTotalLine(stats.blogTotal)}</span>
          </p>
        </div>

        <div className={dashCard}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-snug">{d.statLanding}</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1.5 leading-snug">
                {d.statLandingMeta(stats.mediaCount, stats.partnersCount, stats.faqCount)}
              </p>
            </div>
            <div className="p-2 bg-muted/60 dark:bg-muted/30 rounded-md shrink-0">
              <LayoutTemplate className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
          <p className="mt-auto pt-2.5 text-[11px] sm:text-xs">
            <span className="text-gray-600 dark:text-gray-400">{d.statSheltersQueue}:</span>{' '}
            <span
              className={
                stats.sheltersPendingModeration > 0
                  ? 'font-semibold text-amber-700 dark:text-amber-400'
                  : 'font-medium text-gray-800 dark:text-gray-200'
              }
            >
              {stats.sheltersPendingModeration}
            </span>
          </p>
        </div>

        <div className={dashCard}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-snug">{d.statPointsTitle}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5 tabular-nums">
                {stats.pointsPositiveSum}
              </p>
            </div>
            <div className="p-2 bg-muted/60 dark:bg-muted/30 rounded-md shrink-0">
              <Coins className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
          <p className="mt-auto pt-2.5 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            {d.statPointsMeta(stats.pointsTransactionsCount, stats.pointsPositiveSum)}
          </p>
        </div>

        <div className={dashCard}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-snug">{d.statRewardsGranted}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5 tabular-nums">
                {stats.petsWithRewardGranted}
              </p>
            </div>
            <div className="p-2 bg-muted/60 dark:bg-muted/30 rounded-md shrink-0">
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
          <p className="mt-auto pt-2.5 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
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
              <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400 shrink-0" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{d.activity}</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-muted/40 dark:bg-muted/20 rounded-lg border border-gray-200/80 dark:border-gray-700/80">
                <p className="text-xs text-gray-600 dark:text-gray-400">{d.last7}</p>
                <p className="text-xl font-bold text-foreground mt-0.5 tabular-nums">{stats.petsLast7Days}</p>
              </div>
              <div className="p-3 bg-muted/40 dark:bg-muted/20 rounded-lg border border-gray-200/80 dark:border-gray-700/80">
                <p className="text-xs text-gray-600 dark:text-gray-400">{d.last30}</p>
                <p className="text-xl font-bold text-foreground mt-0.5 tabular-nums">{stats.petsLast30Days}</p>
              </div>
              <div className="p-3 bg-muted/40 dark:bg-muted/20 rounded-lg border border-gray-200/80 dark:border-gray-700/80">
                <p className="text-xs text-gray-600 dark:text-gray-400">{d.last30Profiles}</p>
                <p className="text-xl font-bold text-foreground mt-0.5 tabular-nums">{stats.profilePetsLast30Days}</p>
              </div>
            </div>
          </section>

          <section className={dashSection}>
            <h3 className={sectionLabel}>{d.sectionLatest}</h3>
            <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="min-w-0 space-y-2">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">{d.recentAds}</h4>
                <div className="space-y-2">
                  {recentPets.length === 0 ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400 py-2">{d.emptyRecentList}</p>
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
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {pet.breed || ap.breedUnknown}
                            </p>
                            <p className="text-[11px] text-gray-600 dark:text-gray-400 truncate">
                              {pet.city} · {pet.authorName}
                            </p>
                          </div>
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 shrink-0 tabular-nums">
                          {formatDate(pet.publishedAt)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="min-w-0 space-y-2">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">{d.recentProfilePets}</h4>
                <div className="space-y-2">
                  {recentProfilePets.length === 0 ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400 py-2">{d.emptyRecentList}</p>
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
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{pp.name}</p>
                            <p className="text-[11px] text-gray-600 dark:text-gray-400 truncate">
                              {pp.species}
                              {pp.owner_name ? ` · ${pp.owner_name}` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 shrink-0 tabular-nums">
                          {formatDate(new Date(pp.created_at))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="min-w-0 space-y-2">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">{d.recentShelters}</h4>
                <div className="space-y-2">
                  {shelterAllLoading && recentShelters.length === 0 ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400 py-2">{d.sheltersListLoading}</p>
                  ) : recentShelters.length === 0 ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400 py-2">{d.emptyRecentList}</p>
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
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{sh.name}</p>
                            <p className="text-[11px] text-gray-600 dark:text-gray-400 truncate">
                              {sh.city} · {shelterCatalogStatusLabel(sh.moderation_status)}
                            </p>
                          </div>
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 shrink-0 tabular-nums text-right">
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
  };

  const openEditUser = (u: User) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditRole((u.role === 'shelter' ? 'volunteer' : u.role) as User['role']);
    setEditPhone(u.contacts?.phone ?? '');
    setEditViber(u.contacts?.viber ?? '');
  };

  const handleSaveEditUser = () => {
    if (!editingUser) return;
    onUpdateUser({
      ...editingUser,
      name: editName,
      email: editEmail,
      role: editRole,
      contacts: {
        ...editingUser.contacts,
        phone: editPhone.trim() || undefined,
        viber: editViber.trim() || undefined,
      },
    });
    setEditingUser(null);
  };

  const renderUsers = () => {
    const filteredUsers = users
      .filter(user => {
        if (usersSearch) return user.name.toLowerCase().includes(usersSearch.toLowerCase()) || user.email.toLowerCase().includes(usersSearch.toLowerCase());
        return true;
      })
      .filter(user => {
        if (usersRoleFilter !== 'all') return user.role === usersRoleFilter;
        return true;
      })
      .filter(user => {
        if (usersStatusFilter === 'active') return !user.isBlocked;
        if (usersStatusFilter === 'blocked') return user.isBlocked;
        return true;
      });

    const sortedUsers = [...filteredUsers];
    if (usersSortBy === 'confirmed') {
      sortedUsers.sort((a, b) => {
        const va = a.helperConfirmedCount ?? 0;
        const vb = b.helperConfirmedCount ?? 0;
        return usersSortDir === 'asc' ? va - vb : vb - va;
      });
    } else if (usersSortBy === 'points') {
      sortedUsers.sort((a, b) => {
        const ba = a.pointsBalance ?? 0;
        const bb = b.pointsBalance ?? 0;
        if (ba !== bb) return usersSortDir === 'asc' ? ba - bb : bb - ba;
        const ea = a.pointsEarnedTotal ?? 0;
        const eb = b.pointsEarnedTotal ?? 0;
        return usersSortDir === 'asc' ? ea - eb : eb - ea;
      });
    }

    const totalPages = Math.ceil(sortedUsers.length / usersPerPage);
    const paginatedUsers = sortedUsers.slice((usersPage - 1) * usersPerPage, usersPage * usersPerPage);

    const toggleUserSort = (column: 'confirmed' | 'points') => {
      setUsersPage(1);
      if (usersSortBy === column) {
        setUsersSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setUsersSortBy(column);
        setUsersSortDir('desc');
      }
    };

    const userSortThBtn =
      'w-full px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400 inline-flex items-center gap-1 hover:bg-muted/50 dark:hover:bg-muted/30 transition-colors';

    const userSortIcon = (column: 'confirmed' | 'points') => {
      if (usersSortBy !== column) {
        return <ArrowUpDown className="w-3.5 h-3.5 shrink-0 opacity-45" aria-hidden />;
      }
      return usersSortDir === 'asc' ? (
        <ChevronUp className="w-3.5 h-3.5 shrink-0" aria-hidden />
      ) : (
        <ChevronDown className="w-3.5 h-3.5 shrink-0" aria-hidden />
      );
    };

    return (
      <div className={adm.page}>
        <div className={adm.headerRow}>
          <div className={adm.headerText}>
            <h2 className={adm.title}>{ap.users.title}</h2>
          </div>
        </div>

        {/* Filters Panel */}
        <div className={adm.filtersCard}>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[250px]">
              <label className={adm.labelFilter}>{ap.users.search}</label>
              <input
                type="text"
                placeholder={ap.users.searchPlaceholder}
                value={usersSearch}
                onChange={(e) => {
                  setUsersSearch(e.target.value);
                  setUsersPage(1);
                }}
                className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="min-w-[180px]">
              <label className={adm.labelFilter}>{ap.users.role}</label>
              <Select value={usersRoleFilter} onValueChange={(v) => { setUsersRoleFilter(v); setUsersPage(1); }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={ap.users.roleAll} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{ap.users.roleAll}</SelectItem>
                  <SelectItem value="user">{ap.users.roleUsers}</SelectItem>
                  <SelectItem value="volunteer">{ap.users.roleVolunteers}</SelectItem>
                  <SelectItem value="admin">{ap.users.roleAdmins}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[180px]">
              <label className={adm.labelFilter}>{ap.users.status}</label>
              <Select value={usersStatusFilter} onValueChange={(v) => { setUsersStatusFilter(v); setUsersPage(1); }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={ap.users.statusAll} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{ap.users.statusAll}</SelectItem>
                  <SelectItem value="active">{ap.users.statusActive}</SelectItem>
                  <SelectItem value="blocked">{ap.users.statusBlocked}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400 ml-auto">
              {ap.users.found}: {sortedUsers.length} {ap.users.usersCount}
            </div>
          </div>
        </div>

        <div className={adm.tableShell}>
          <div className={adm.tableWrap}>
            <table className={`${adm.table} table-fixed`}>
            <thead className={adm.thead}>
              <tr>
                <th className={adm.th}>{ap.users.colUser}</th>
                <th className={adm.th}>{ap.users.colEmail}</th>
                <th className={adm.th}>{ap.users.colRole}</th>
                <th className={`${adm.th} p-0`}>{ap.users.colHelperId}</th>
                <th className={`${adm.th} p-0`}>
                  <button
                    type="button"
                    className={userSortThBtn}
                    title={ap.users.sortConfirmedTooltip}
                    onClick={() => toggleUserSort('confirmed')}
                  >
                    {ap.users.colConfirmed}
                    {userSortIcon('confirmed')}
                  </button>
                </th>
                <th className={`${adm.th} p-0`}>
                  <button
                    type="button"
                    className={userSortThBtn}
                    title={ap.users.sortPointsTooltip}
                    onClick={() => toggleUserSort('points')}
                  >
                    {ap.users.colPoints}
                    {userSortIcon('points')}
                  </button>
                </th>
                <th className={adm.th}>{ap.users.colContacts}</th>
                <th className={adm.th}>{ap.users.colStatus}</th>
                <th className={adm.th}>{ap.users.colActions}</th>
              </tr>
            </thead>
            <tbody className={adm.tbody}>
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} className={adm.tdEmpty}>
                    {ap.users.empty}
                  </td>
                </tr>
              ) : (
                paginatedUsers.map(user => (
                  <tr key={user.id} className={adm.tr}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {user.avatar && (
                          <img src={user.avatar.startsWith('http') || user.avatar.startsWith('data:') ? user.avatar : `${API_BASE}${user.avatar}`} alt="" className="w-8 h-8 rounded-full shrink-0" />
                        )}
                        <a
                          href={`/user/${user.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-primary hover:text-primary/90 hover:underline text-sm truncate max-w-[120px]"
                          title={user.name}
                        >
                          {user.name}
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 truncate" title={user.email}>{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        user.role === 'admin' ? 'bg-primary/10 dark:bg-primary/20 text-primary' :
                        'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}>
                        {user.role === 'admin'
                          ? ap.users.roleAdmin
                          : user.role === 'user'
                            ? ap.users.roleUser
                            : ap.users.roleVolunteer}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300 font-mono truncate" title={user.helperCode || '—'}>
                      {user.helperCode || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {user.helperConfirmedCount ?? 0}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">
                      <div>
                        {ap.users.pointsBalance} {user.pointsBalance ?? 0}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400">
                        {ap.users.pointsEarnedTotal} {user.pointsEarnedTotal ?? 0}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                      <div
                        className="truncate"
                        title={
                          user.telegramUsername
                            ? `@${String(user.telegramUsername).replace(/^@/, '')}`
                            : ap.users.telegramNone
                        }
                      >
                        {ap.users.contactLabelTelegram}{' '}
                        {user.telegramUsername
                          ? `@${String(user.telegramUsername).replace(/^@/, '')}`
                          : ap.users.telegramNone}
                      </div>
                      <div
                        className="truncate"
                        title={user.contacts.phone || user.contacts.viber || '—'}
                      >
                        {ap.users.contactLabelPhoneViber}{' '}
                        {user.contacts.phone || user.contacts.viber || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {user.isBlocked ? (
                        <span className="inline-flex px-2 py-1 text-xs rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 whitespace-nowrap">
                          {ap.users.blocked}
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 whitespace-nowrap">
                          {ap.users.active}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditUser(user)}
                          className="p-1.5 text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded transition-colors"
                          title={ap.users.editTitleTooltip}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onUpdateUser({ ...user, isBlocked: !user.isBlocked })}
                          className={`p-1.5 rounded transition-colors ${user.isBlocked ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20'}`}
                          title={user.isBlocked ? ap.users.unblockTooltip : ap.users.blockTooltip}
                        >
                          {user.isBlocked ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(ap.users.deleteConfirm(user.name))) {
                              onDeleteUser(user.id);
                            }
                          }}
                          className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title={ap.users.deleteTooltip}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>

        {/* Edit User Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4" onClick={() => setEditingUser(null)}>
            <div className="bg-card rounded-xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">{ap.users.modalTitle}</h3>
                <button onClick={() => setEditingUser(null)} className="p-1 hover:bg-accent dark:hover:bg-accent rounded"><X className="w-5 h-5 dark:text-gray-400" /></button>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{ap.users.name}</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{ap.users.email}</label>
                  <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{ap.users.roleField}</label>
                  <Select value={editRole} onValueChange={(v) => setEditRole(v as User['role'])}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={ap.users.rolePlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">{ap.users.roleUser}</SelectItem>
                      <SelectItem value="volunteer">{ap.users.roleVolunteer}</SelectItem>
                      <SelectItem value="admin">{ap.users.roleAdmin}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{ap.users.phone}</label>
                  <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder={BELARUS_MOBILE_PHONE_PLACEHOLDER} className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{ap.users.viber}</label>
                  <input type="text" value={editViber} onChange={(e) => setEditViber(e.target.value)} placeholder={ap.users.viberPlaceholder} className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t dark:border-gray-700">
                <button onClick={() => setEditingUser(null)} className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-accent dark:hover:bg-accent">{t.common.cancel}</button>
                <button onClick={handleSaveEditUser} className="flex items-center gap-2 px-4 py-3 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"><Save className="w-4 h-4" /> {t.common.save}</button>
              </div>
            </div>
          </div>
        )}

        {totalPages > 1 && (
          <AdminTablePagination
            currentPage={usersPage}
            totalPages={totalPages}
            onPageChange={setUsersPage}
            labels={ap.pagination}
            summary={
              <>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {ap.users.pageOf(usersPage, totalPages)}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {ap.users.totalShort(sortedUsers.length)}
                </span>
              </>
            }
          />
        )}
      </div>
    );
  };

  const shelterKindLabel = (kind: ShelterKind) => {
    const s = ap.shelters;
    switch (kind) {
      case 'foster':
        return s.kindFoster;
      case 'other':
      case 'vet':
        return s.kindOther;
      case 'shelter':
      default:
        return s.kindShelter;
    }
  };

  const shelterAnimalFocusAdminLabel = (focus: ShelterAnimalFocus) => {
    const s = ap.shelters;
    switch (focus) {
      case 'dogs':
        return s.focusDogs;
      case 'cats':
        return s.focusCats;
      case 'mixed':
      default:
        return s.focusMixed;
    }
  };

  const handleShelterModerate = (id: string, action: 'approve' | 'reject' | 'hide') => {
    const reasonRaw = (shelterReasons[id] ?? '').trim();
    const reason = action === 'approve' ? undefined : reasonRaw || undefined;
    sheltersApi
      .moderate(id, { action, reason })
      .then(() => {
        if (action === 'approve') toast.success(ap.toasts.shelterApproved);
        else if (action === 'reject') toast.success(ap.toasts.shelterRejected);
        else toast.success(ap.toasts.shelterHidden);
        setShelterReasons((prev) => ({ ...prev, [id]: '' }));
        fetchShelterPending();
      })
      .catch(() => {
        toast.error(ap.toasts.shelterModerateError);
      });
  };

  const openShelterCatalogEdit = (row: ShelterResponse) => {
    setShelterCatalogEdit(row);
    setEditScName(row.name);
    setEditScKind((row.kind as ShelterKind) || 'shelter');
    setEditScFocus((row.animal_focus as ShelterAnimalFocus) || 'mixed');
    setEditScDescription(row.description ?? '');
    setEditScCity(row.city);
    setEditScAddress(row.address ?? '');
    setEditScLat(String(row.location_lat));
    setEditScLng(String(row.location_lng));
    setEditScLogo(row.logo_url ?? '');
    setEditScCover(row.cover_url ?? '');
    const c = row.contacts ?? {};
    setEditScPhone(c.phone ?? '');
    setEditScTelegram(c.telegram ?? '');
    setEditScWebsite(c.website ?? '');
    setEditScEmail(c.email ?? '');
  };

  const handleSaveShelterCatalogEdit = () => {
    if (!shelterCatalogEdit) return;
    const lat = parseFloat(editScLat.replace(',', '.'));
    const lng = parseFloat(editScLng.replace(',', '.'));
    if (!editScName.trim() || !editScCity.trim() || Number.isNaN(lat) || Number.isNaN(lng)) {
      toast.error(ap.sheltersCatalog.validationGeo);
      return;
    }
    sheltersApi
      .update(shelterCatalogEdit.id, {
        name: editScName.trim(),
        kind: editScKind,
        animal_focus: editScFocus,
        description: editScDescription.trim() || null,
        city: editScCity.trim(),
        address: editScAddress.trim() || null,
        location_lat: lat,
        location_lng: lng,
        contacts: {
          phone: editScPhone.trim() || undefined,
          telegram: editScTelegram.trim() || undefined,
          website: editScWebsite.trim() || undefined,
          email: editScEmail.trim() || undefined,
        },
        logo_url: editScLogo.trim() || null,
        cover_url: editScCover.trim() || null,
      })
      .then((updated) => {
        toast.success(ap.toasts.shelterSaved);
        setShelterCatalogEdit(null);
        setShelterAllList((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      })
      .catch(() => {
        toast.error(ap.toasts.shelterSaveError);
      });
  };

  const renderSheltersModeration = () => {
    const sp = ap.shelters;
    return (
      <div className={adm.page}>
        <div className={adm.headerRow}>
          <div className={adm.headerText}>
            <h2 className={adm.title}>{sp.title}</h2>
            <p className={adm.subtitle}>{sp.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => fetchShelterPending()}
            disabled={shelterListLoading}
            className={adm.ghostBtn}
          >
            {sp.refresh}
          </button>
        </div>

        {shelterListLoading && shelterPendingList.length === 0 ? (
          <p className={adm.lead}>{sp.loading}</p>
        ) : shelterPendingList.length === 0 ? (
          <div className={adm.emptyBox}>
            <p>{sp.empty}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {shelterPendingList.map((row) => {
              const owner = users.find((u) => u.id === row.owner_user_id);
              const mapHref = `https://www.google.com/maps?q=${row.location_lat},${row.location_lng}`;
              return (
                <div key={row.id} className={`${adm.listCard} space-y-4`}>
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{row.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {row.city}
                        {row.address ? ` · ${row.address}` : ''}
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                          {shelterKindLabel(row.kind)}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-muted text-foreground font-medium">
                          {shelterAnimalFocusAdminLabel(row.animal_focus)}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {sp.colUpdated}: {formatDate(new Date(row.updated_at))}
                        </span>
                      </div>
                      {row.description ? (
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap pt-2">{row.description}</p>
                      ) : null}
                      <p className="text-sm text-gray-600 dark:text-gray-400 pt-1">
                        {sp.colOwner}:{' '}
                        {owner ? (
                          <a
                            href={`/user/${owner.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-medium"
                          >
                            {owner.name}
                          </a>
                        ) : (
                          <span className="font-mono text-xs">{row.owner_user_id}</span>
                        )}
                      </p>
                    </div>
                    <a
                      href={mapHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={sp.openMap}
                      className="inline-flex items-center justify-center p-2 rounded-lg text-primary hover:bg-primary/10 dark:hover:bg-primary/20 shrink-0"
                    >
                      <MapPin className="w-5 h-5" />
                      <span className="sr-only">{sp.openMap}</span>
                    </a>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{sp.reasonLabel}</label>
                    <input
                      type="text"
                      value={shelterReasons[row.id] ?? ''}
                      onChange={(e) => setShelterReasons((prev) => ({ ...prev, [row.id]: e.target.value }))}
                      placeholder={sp.reasonPlaceholder}
                      className="w-full max-w-xl px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleShelterModerate(row.id, 'approve')}
                      title={sp.approve}
                      className="inline-flex items-center justify-center p-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="sr-only">{sp.approve}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShelterModerate(row.id, 'reject')}
                      title={sp.reject}
                      className="inline-flex items-center justify-center p-2.5 rounded-lg border border-amber-600 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                    >
                      <XCircle className="w-5 h-5" />
                      <span className="sr-only">{sp.reject}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShelterModerate(row.id, 'hide')}
                      title={sp.hide}
                      className="inline-flex items-center justify-center p-2.5 rounded-lg border border-gray-400 dark:border-gray-500 text-gray-800 dark:text-gray-200 hover:bg-muted"
                    >
                      <EyeOff className="w-5 h-5" />
                      <span className="sr-only">{sp.hide}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderSheltersCatalog = () => {
    const sc = ap.sheltersCatalog;
    const reload = () => {
      setShelterAllLoading(true);
      sheltersApi
        .adminListAll()
        .then(setShelterAllList)
        .catch(() => setShelterAllList([]))
        .finally(() => setShelterAllLoading(false));
    };
    return (
      <div className={adm.page}>
        <div className={adm.headerRow}>
          <div className={adm.headerText}>
            <h2 className={adm.title}>{sc.title}</h2>
            <p className={adm.subtitle}>{sc.subtitle}</p>
          </div>
          <button type="button" onClick={() => reload()} disabled={shelterAllLoading} className={adm.ghostBtn}>
            {sc.refresh}
          </button>
        </div>

        {shelterAllLoading && shelterAllList.length === 0 ? (
          <p className={adm.lead}>{sc.loading}</p>
        ) : shelterAllList.length === 0 ? (
          <div className={adm.emptyBox}>
            <p>{sc.empty}</p>
          </div>
        ) : (
          <div className={adm.tableShell}>
            <div className={adm.tableWrap}>
            <table className={`${adm.table} min-w-[920px]`}>
              <thead className={adm.thead}>
                <tr>
                  <th className={adm.th}>{sc.colName}</th>
                  <th className={adm.th}>{sc.colCity}</th>
                  <th className={adm.th}>{sc.colKind}</th>
                  <th className={adm.th}>{sc.colFocus}</th>
                  <th className={adm.th}>{sc.colStatus}</th>
                  <th className={adm.th}>{sc.colOwner}</th>
                  <th className={adm.th}>{sc.colUpdated}</th>
                  <th className={`${adm.th} text-right w-28`} title={`${sc.openMap} / ${sc.openPublic}`}>
                    <span className="sr-only">
                      {sc.openMap}, {sc.openPublic}
                    </span>
                    <span className="inline-flex justify-end gap-1 text-gray-500 dark:text-gray-400">
                      <MapPin className="w-3.5 h-3.5" aria-hidden />
                      <ExternalLink className="w-3.5 h-3.5" aria-hidden />
                    </span>
                  </th>
                  <th className={`${adm.th} text-right w-24`}>{sc.colActions}</th>
                </tr>
              </thead>
              <tbody className={adm.tbody}>
                {shelterAllList.map((row) => {
                  const owner = users.find((u) => u.id === row.owner_user_id);
                  const mapHref = `https://www.google.com/maps?q=${row.location_lat},${row.location_lng}`;
                  return (
                    <tr key={row.id} className={adm.tr}>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{row.name}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.city}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{shelterKindLabel(row.kind)}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {shelterAnimalFocusAdminLabel(row.animal_focus)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {shelterCatalogStatusLabel(row.moderation_status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {owner ? (
                          <a
                            href={`/user/${owner.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {owner.name}
                          </a>
                        ) : (
                          <span className="font-mono text-xs text-gray-600 dark:text-gray-400">{row.owner_user_id}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(new Date(row.updated_at))}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1">
                          <a
                            href={mapHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={sc.openMap}
                            className="inline-flex items-center justify-center p-2 rounded-lg text-primary hover:bg-primary/10 dark:hover:bg-primary/20"
                          >
                            <MapPin className="w-4 h-4" />
                            <span className="sr-only">{sc.openMap}</span>
                          </a>
                          {row.moderation_status === 'approved' ? (
                            <a
                              href="/shelters"
                              target="_blank"
                              rel="noopener noreferrer"
                              title={sc.openPublic}
                              className="inline-flex items-center justify-center p-2 rounded-lg text-primary hover:bg-primary/10 dark:hover:bg-primary/20"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span className="sr-only">{sc.openPublic}</span>
                            </a>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openShelterCatalogEdit(row)}
                            title={sc.editTooltip}
                            className="inline-flex items-center justify-center p-2 rounded-lg text-primary hover:bg-primary/10 dark:hover:bg-primary/20"
                          >
                            <Edit2 className="w-4 h-4" />
                            <span className="sr-only">{sc.editTooltip}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const msg = sc.deleteConfirm.replace('{name}', row.name);
                              if (!window.confirm(msg)) return;
                              sheltersApi
                                .adminDelete(row.id)
                                .then(() => {
                                  toast.success(ap.toasts.shelterDeleted);
                                  setShelterCatalogEdit((cur) => (cur?.id === row.id ? null : cur));
                                  reload();
                                  fetchShelterPending();
                                })
                                .catch(() => {
                                  toast.error(ap.toasts.shelterDeleteError);
                                });
                            }}
                            title={sc.deleteTooltip}
                            className="inline-flex items-center justify-center p-2 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="sr-only">{sc.deleteTooltip}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {shelterCatalogEdit ? (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4"
            onClick={() => setShelterCatalogEdit(null)}
          >
            <div
              className="bg-card rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700 shrink-0">
                <h3 className="font-semibold text-gray-900 dark:text-white">{sc.modalEditTitle}</h3>
                <button
                  type="button"
                  onClick={() => setShelterCatalogEdit(null)}
                  className="p-1 hover:bg-accent dark:hover:bg-accent rounded"
                >
                  <X className="w-5 h-5 dark:text-gray-400" />
                </button>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{sc.fieldName}</label>
                  <input
                    type="text"
                    value={editScName}
                    onChange={(e) => setEditScName(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{sc.fieldKind}</label>
                    <Select value={editScKind} onValueChange={(v) => setEditScKind(v as ShelterKind)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="shelter">{shelterKindLabel('shelter')}</SelectItem>
                        <SelectItem value="foster">{shelterKindLabel('foster')}</SelectItem>
                        <SelectItem value="other">{shelterKindLabel('other')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{sc.fieldFocus}</label>
                    <Select value={editScFocus} onValueChange={(v) => setEditScFocus(v as ShelterAnimalFocus)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mixed">{shelterAnimalFocusAdminLabel('mixed')}</SelectItem>
                        <SelectItem value="dogs">{shelterAnimalFocusAdminLabel('dogs')}</SelectItem>
                        <SelectItem value="cats">{shelterAnimalFocusAdminLabel('cats')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{sc.fieldDescription}</label>
                  <textarea
                    value={editScDescription}
                    onChange={(e) => setEditScDescription(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-y min-h-[96px]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{sc.fieldCity}</label>
                  <input
                    type="text"
                    value={editScCity}
                    onChange={(e) => setEditScCity(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{sc.fieldAddress}</label>
                  <input
                    type="text"
                    value={editScAddress}
                    onChange={(e) => setEditScAddress(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{sc.fieldLat}</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={editScLat}
                      onChange={(e) => setEditScLat(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{sc.fieldLng}</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={editScLng}
                      onChange={(e) => setEditScLng(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{sc.fieldLogo}</label>
                    <input
                      type="text"
                      value={editScLogo}
                      onChange={(e) => setEditScLogo(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{sc.fieldCover}</label>
                    <input
                      type="text"
                      value={editScCover}
                      onChange={(e) => setEditScCover(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{sc.contactsSection}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{sc.contactPhone}</label>
                    <input
                      type="text"
                      value={editScPhone}
                      onChange={(e) => setEditScPhone(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{sc.contactTelegram}</label>
                    <input
                      type="text"
                      value={editScTelegram}
                      onChange={(e) => setEditScTelegram(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{sc.contactWebsite}</label>
                    <input
                      type="text"
                      value={editScWebsite}
                      onChange={(e) => setEditScWebsite(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{sc.contactEmail}</label>
                    <input
                      type="email"
                      value={editScEmail}
                      onChange={(e) => setEditScEmail(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShelterCatalogEdit(null)}
                  className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-accent dark:hover:bg-accent"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleSaveShelterCatalogEdit}
                  disabled={!editScName.trim() || !editScCity.trim()}
                  className="flex items-center gap-2 px-4 py-3 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> {t.common.save}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  const renderReports = () => {
    // Filter reports
    const filteredReports = reports
      .filter(report => {
        if (reportsStatusFilter !== 'all') return report.status === reportsStatusFilter;
        return true;
      })
      .filter(report => {
        if (reportsReasonFilter !== 'all') return report.reason === reportsReasonFilter;
        return true;
      });

    const totalPages = Math.ceil(filteredReports.length / reportsPerPage);
    const paginatedReports = filteredReports.slice((reportsPage - 1) * reportsPerPage, reportsPage * reportsPerPage);

    return (
      <div className={adm.page}>
        <div className={adm.headerRow}>
          <div className={adm.headerText}>
            <h2 className={adm.title}>{ap.reports.title}</h2>
          </div>
        </div>

        {/* Filters Panel */}
        <div className={adm.filtersCard}>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className={adm.labelFilter}>{ap.reports.statusLabel}</label>
              <select
                value={reportsStatusFilter}
                onChange={(e) => {
                  setReportsStatusFilter(e.target.value);
                  setReportsPage(1);
                }}
                className={adm.selectNative}
              >
                <option value="all">{ap.reports.statusAll}</option>
                <option value="pending">{ap.reports.statusNew}</option>
                <option value="reviewed">{ap.reports.statusReviewed}</option>
                <option value="resolved">{ap.reports.statusResolved}</option>
                <option value="dismissed">{ap.reports.statusDismissed}</option>
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className={adm.labelFilter}>{ap.reports.reasonLabel}</label>
              <select
                value={reportsReasonFilter}
                onChange={(e) => {
                  setReportsReasonFilter(e.target.value);
                  setReportsPage(1);
                }}
                className={adm.selectNative}
              >
                <option value="all">{ap.reports.reasonAll}</option>
                {(Object.keys(ap.reports.reasons) as ReportReason[]).map((rk) => (
                  <option key={rk} value={rk}>
                    {ap.reports.reasons[rk]}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400 ml-auto">
              {ap.reports.foundCount}: {filteredReports.length} {ap.reports.complaints}
            </div>
          </div>
        </div>

      <div className="space-y-4">
        {paginatedReports.length === 0 ? (
          <div className={adm.emptyBox}>
            <p>{ap.reports.empty}</p>
          </div>
        ) : (
          paginatedReports.map(report => {
            const pet = pets.find(p => p.id === report.petId);
            return (
              <div key={report.id} className={adm.listCard}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        report.status === 'pending' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                        report.status === 'resolved' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                        report.status === 'dismissed' ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {report.status === 'pending' ? ap.reports.badgeNew : 
                         report.status === 'resolved' ? ap.reports.badgeResolved : 
                         report.status === 'dismissed' ? ap.reports.badgeDismissed : ap.reports.badgeReviewed}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{ap.reports.reasons[report.reason]}</span>
                    </div>
                    
                    <p className="font-medium text-gray-900 dark:text-white mb-1">
                      {ap.reports.from}: <a href={`/user/${report.reporterId}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/90 hover:underline">{report.reporterName}</a>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{report.description}</p>
                    
                    {pet && (
                      <div className="space-y-2">
                        <a
                          href={`/pet/${pet.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-muted dark:bg-accent rounded-lg hover:bg-accent dark:hover:bg-accent transition-colors group"
                        >
                          <img src={getAdminPetPreviewPhoto(pet)} alt="" className="w-12 h-12 object-cover rounded-lg" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">{pet.breed || ap.breedUnknown}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{pet.city} · {pet.authorName}</p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-primary shrink-0" />
                        </a>
                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-2 text-xs text-gray-600 dark:text-gray-300">
                          {ap.reports.petReward}{' '}
                          {pet.rewardMode === 'money'
                            ? `${pet.rewardAmountByn ?? 0} BYN`
                            : ap.reports.rewardPointsUnit(pet.rewardPoints ?? 0)}{' '}
                          · {ap.reports.petAwarded}{' '}
                          {pet.rewardPointsAwardedAt
                            ? formatDate(pet.rewardPointsAwardedAt)
                            : ap.reports.petAwardedNever}
                        </div>
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {formatDate(report.createdAt)}
                    </p>
                  </div>

                  <div className="flex sm:flex-col gap-2">
                    {report.status === 'pending' && (
                      <>
                        <button
                          onClick={() => onUpdateReport({ ...report, status: 'resolved', reviewedAt: new Date() })}
                          className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          title={ap.reports.resolveTooltip}
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => onUpdateReport({ ...report, status: 'dismissed', reviewedAt: new Date() })}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-accent dark:hover:bg-accent rounded-lg transition-colors"
                          title={ap.reports.dismissTooltip}
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => {
                        if (window.confirm(ap.reports.deleteConfirm)) {
                          onDeleteReport(report.id);
                        }
                      }}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title={ap.reports.deleteTooltip}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {totalPages > 1 && (
        <AdminTablePagination
          currentPage={reportsPage}
          totalPages={totalPages}
          onPageChange={setReportsPage}
          labels={ap.pagination}
          summary={
            <>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {ap.reports.pageOf(reportsPage, totalPages)}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {ap.users.totalShort(filteredReports.length)}
              </span>
            </>
          }
        />
      )}
    </div>
  );
  };

  const openMediaCreate = () => {
    setEditingMedia('create');
    setEditLogoUrl('');
    setEditTitle('');
    setEditPublishedAt(new Date().toISOString().slice(0, 10));
    setEditLink('');
  };

  const openMediaEdit = (m: MediaArticle) => {
    setEditingMedia(m);
    setEditLogoUrl(m.logo_url || '');
    setEditTitle(m.title);
    setEditPublishedAt(m.published_at ? m.published_at.slice(0, 10) : new Date().toISOString().slice(0, 10));
    setEditLink(m.link || '');
  };

  const handleSaveMedia = () => {
    const dateVal = editPublishedAt ? new Date(editPublishedAt + 'T12:00:00').toISOString() : new Date().toISOString();
    if (editingMedia === 'create') {
      onMediaCreate({
        logo_url: editLogoUrl.trim() || undefined,
        title: editTitle.trim(),
        published_at: dateVal,
        link: editLink.trim() || undefined,
      });
    } else if (editingMedia && editingMedia !== 'create') {
      onMediaUpdate(editingMedia.id, {
        logo_url: editLogoUrl.trim() || undefined,
        title: editTitle.trim(),
        published_at: dateVal,
        link: editLink.trim() || undefined,
      });
    }
    setEditingMedia(null);
  };

  const openBlogCreate = () => {
    setEditingBlog('create');
    setEditBlogSlug('');
    setEditBlogTitle('');
    setEditBlogExcerpt('');
    setEditBlogBody('');
    setEditBlogCover('');
    setEditBlogMeta('');
    setEditBlogCategory(blogCategories[0]?.slug ?? '');
    setEditBlogStatus('draft');
    setBlogSlugUserTouched(false);
  };

  const openBlogEdit = (bp: BlogPostAdmin) => {
    setEditingBlog(bp);
    setEditBlogSlug(bp.slug);
    setEditBlogTitle(bp.title);
    setBlogSlugUserTouched(true);
    setEditBlogExcerpt(bp.excerpt || '');
    setEditBlogBody(bp.body_md);
    setEditBlogCover(bp.cover_image_url || '');
    setEditBlogMeta(bp.meta_description || '');
    setEditBlogCategory(bp.category || blogCategories[0]?.slug || '');
    setEditBlogStatus(bp.status === 'published' ? 'published' : 'draft');
  };

  const handleSaveBlog = () => {
    const slug = editBlogSlug.trim().toLowerCase();
    const title = editBlogTitle.trim();
    const body = editBlogBody.trim();
    if (!slug || !title || !body) {
      toast.error(ap.toasts.blogFillRequired);
      return;
    }
    if (!blogCategories.length) {
      toast.error(ap.toasts.blogNeedCategory);
      return;
    }
    const categorySlug = blogCategories.some((c) => c.slug === editBlogCategory)
      ? editBlogCategory
      : blogCategories[0].slug;
    if (editingBlog === 'create') {
      onBlogCreate({
        slug,
        title,
        excerpt: editBlogExcerpt.trim() || undefined,
        body_md: body,
        cover_image_url: editBlogCover.trim() || undefined,
        meta_description: editBlogMeta.trim() || undefined,
        category: categorySlug,
        status: editBlogStatus,
      });
    } else if (editingBlog && editingBlog !== 'create') {
      onBlogUpdate(editingBlog.id, {
        slug,
        title,
        excerpt: editBlogExcerpt.trim() || undefined,
        body_md: body,
        cover_image_url: editBlogCover.trim() || undefined,
        meta_description: editBlogMeta.trim() || undefined,
        category: categorySlug,
        status: editBlogStatus,
      });
    }
    setEditingBlog(null);
  };

  const openBlogCategoryCreate = () => {
    setEditingBlogCategory('create');
    setEditCatSlug('');
    setEditCatTitle('');
    setEditCatSort(0);
  };

  const openBlogCategoryEdit = (c: BlogCategory) => {
    setEditingBlogCategory(c);
    setEditCatSlug(c.slug);
    setEditCatTitle(c.title);
    setEditCatSort(c.sort_order);
  };

  const refreshBlogCategories = () => {
    blogApi.listCategories().then(setBlogCategories).catch(() => setBlogCategories([]));
  };

  const handleSaveBlogCategory = () => {
    if (editingBlogCategory === 'create') {
      const slug = editCatSlug.trim().toLowerCase();
      const title = editCatTitle.trim();
      if (!slug || !title) {
        toast.error(ap.toasts.categoryFillSlugTitle);
        return;
      }
      blogApi
        .adminCategoryCreate({ slug, title, sort_order: editCatSort })
        .then(() => {
          toast.success(ap.toasts.categoryCreated);
          setEditingBlogCategory(null);
          refreshBlogCategories();
        })
        .catch((e: unknown) => toast.error(e instanceof Error ? e.message : ap.toasts.categoryCreateError));
    } else if (editingBlogCategory && editingBlogCategory !== 'create') {
      const title = editCatTitle.trim();
      if (!title) {
        toast.error(ap.toasts.categoryTitleRequired);
        return;
      }
      blogApi
        .adminCategoryUpdate(editingBlogCategory.id, { title, sort_order: editCatSort })
        .then(() => {
          toast.success(ap.toasts.savedShort);
          setEditingBlogCategory(null);
          refreshBlogCategories();
        })
        .catch((e: unknown) => toast.error(e instanceof Error ? e.message : ap.toasts.saveErrorShort));
    }
  };

  const blogTelegramUrl = (p: BlogPostAdmin) => {
    if (p.telegram_message_id == null) return null;
    const u = (p.telegram_channel_username || '').replace(/^@/, '');
    if (!u) return null;
    return `https://t.me/${u}/${p.telegram_message_id}`;
  };

  const renderBlog = () => {
    const blogCategorySelectValue = blogCategories.some((c) => c.slug === editBlogCategory)
      ? editBlogCategory
      : (blogCategories[0]?.slug ?? '');

    return (
    <div className={adm.page}>
      <div className={adm.headerRow}>
        <div className={adm.headerText}>
          <h2 className={adm.title}>{ap.tabs.articles}</h2>
        </div>
        <button type="button" onClick={openBlogCreate} className={adm.primaryBtn}>
          <Plus className="w-4 h-4" /> {ap.blog.newArticle}
        </button>
      </div>

      <p className={adm.lead}>
        {ap.blog.hintTelegramPrefix}{' '}
        <button
          type="button"
          onClick={() => selectTab('telegramBlog')}
          className="text-primary font-medium hover:underline"
        >
          {ap.blog.hintTelegramLink}
        </button>
        .
      </p>

      {blogCategories.length === 0 ? (
        <p className={adm.warnBanner}>
          {ap.blog.hintCategoriesEmptyPrefix}{' '}
          <button type="button" onClick={() => selectTab('blogCategories')} className="font-medium underline">
            {ap.blog.hintCategoriesLink}
          </button>
          {ap.blog.hintCategoriesEmptySuffix}
        </p>
      ) : null}

      <div className={adm.tableShell}>
        <div className={adm.tableWrap}>
        <table className={`${adm.table} min-w-[720px]`}>
          <thead className={adm.thead}>
            <tr>
              <th className={adm.th}>{ap.blog.colTitle}</th>
              <th className={adm.th}>{ap.blog.colSlug}</th>
              <th className={adm.th}>{ap.blog.colStatus}</th>
              <th className={adm.th}>{ap.blog.colTelegram}</th>
              <th className={adm.th}>{ap.blog.colActions}</th>
            </tr>
          </thead>
          <tbody className={adm.tbody}>
            {blogPosts.length === 0 ? (
              <tr>
                <td colSpan={5} className={adm.tdEmpty}>
                  {ap.blog.empty}
                </td>
              </tr>
            ) : (
              blogPosts.map((p) => {
                const tg = blogTelegramUrl(p);
                return (
                  <tr key={p.id} className={adm.tr}>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium max-w-[200px]">
                      <span className="line-clamp-2">{p.title}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 font-mono">{p.slug}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={
                          p.status === 'published'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }
                      >
                        {p.status === 'published' ? ap.blog.published : ap.blog.draft}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {tg ? (
                        <a
                          href={tg}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={ap.blog.tgOpen}
                          className="inline-flex items-center justify-center p-2 rounded-lg text-primary hover:bg-primary/10 dark:hover:bg-primary/20"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span className="sr-only">{ap.blog.tgOpen}</span>
                        </a>
                      ) : p.status === 'published' ? (
                        <button
                          type="button"
                          onClick={() => onBlogSendTelegram(p.id)}
                          title={ap.blog.tgSend}
                          className="inline-flex items-center justify-center p-2 rounded-lg text-primary hover:bg-primary/10 dark:hover:bg-primary/20"
                        >
                          <Send className="w-4 h-4" />
                          <span className="sr-only">{ap.blog.tgSend}</span>
                        </button>
                      ) : (
                        <span className="text-gray-400">{ap.blog.tgDash}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {p.status === 'published' ? (
                          <button
                            type="button"
                            onClick={() => window.open(`/blog/${p.slug}`, '_blank')}
                            className="p-1.5 text-primary hover:bg-primary/10 rounded transition-colors"
                            title={ap.blog.previewSite}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => openBlogEdit(p)}
                          className="p-1.5 text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded transition-colors"
                          title={ap.blog.editTooltip}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(ap.toasts.deleteArticleConfirm)) onBlogDelete(p.id);
                          }}
                          className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title={ap.blog.deleteTooltip}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>

      {editingBlog && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4"
          onClick={() => setEditingBlog(null)}
        >
          <div
            className="bg-card rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700 sticky top-0 bg-card z-10">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {editingBlog === 'create' ? ap.blog.modalNewTitle : ap.blog.modalEditTitle}
              </h3>
              <button type="button" onClick={() => setEditingBlog(null)} className="p-1 hover:bg-accent rounded">
                <X className="w-5 h-5 dark:text-gray-400" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{ap.blog.fieldTitle}</label>
                <input
                  type="text"
                  value={editBlogTitle}
                  onChange={(e) => {
                    const v = e.target.value.slice(0, 200);
                    setEditBlogTitle(v);
                    if (editingBlog === 'create' && !blogSlugUserTouched) {
                      setEditBlogSlug(titleToBlogSlug(v));
                    }
                  }}
                  maxLength={200}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                />
              </div>
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {ap.blog.fieldSlug}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setEditBlogSlug(titleToBlogSlug(editBlogTitle));
                      setBlogSlugUserTouched(false);
                    }}
                    className="text-xs text-primary hover:underline"
                  >
                    {ap.blog.slugFromTitle}
                  </button>
                </div>
                <input
                  type="text"
                  value={editBlogSlug}
                  onChange={(e) => {
                    setBlogSlugUserTouched(true);
                    setEditBlogSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                  }}
                  placeholder={ap.blog.slugPlaceholder}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg font-mono text-sm"
                />
                {editingBlog === 'create' && !blogSlugUserTouched ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {ap.blog.slugHint}
                  </p>
                ) : null}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{ap.blog.fieldExcerpt}</label>
                <textarea
                  value={editBlogExcerpt}
                  onChange={(e) => setEditBlogExcerpt(e.target.value.slice(0, 2000))}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg resize-y min-h-[80px]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {ap.blog.fieldBody}
                </label>
                <BlogMarkdownEditor value={editBlogBody} onChange={setEditBlogBody} rows={14} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{ap.blog.fieldCover}</label>
                <input
                  type="text"
                  value={editBlogCover}
                  onChange={(e) => setEditBlogCover(e.target.value)}
                  placeholder={ap.blog.coverPlaceholder}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{ap.blog.coverHint}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{ap.blog.fieldMeta}</label>
                <input
                  type="text"
                  value={editBlogMeta}
                  onChange={(e) => setEditBlogMeta(e.target.value.slice(0, 320))}
                  maxLength={320}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{ap.blog.fieldCategory}</label>
                  <Select
                    value={blogCategorySelectValue}
                    onValueChange={setEditBlogCategory}
                    disabled={blogCategories.length === 0}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={ap.blog.categoryNone} />
                    </SelectTrigger>
                    <SelectContent>
                      {blogCategories.map((c) => (
                        <SelectItem key={c.id} value={c.slug}>
                          {c.title} ({c.slug})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{ap.blog.fieldStatus}</label>
                  <Select
                    value={editBlogStatus}
                    onValueChange={(v) => setEditBlogStatus(v as 'draft' | 'published')}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">{ap.blog.statusDraft}</SelectItem>
                      <SelectItem value="published">{ap.blog.statusPublished}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t dark:border-gray-700 sticky bottom-0 bg-card">
              <button
                type="button"
                onClick={() => setEditingBlog(null)}
                className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-accent"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={handleSaveBlog}
                className="flex items-center gap-2 px-4 py-3 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                <Save className="w-4 h-4" /> {t.common.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    );
  };

  const renderBlogCategories = () => (
    <div className={adm.page}>
      <div className={adm.headerRow}>
        <div className={adm.headerText}>
          <h2 className={adm.title}>{ap.categories.title}</h2>
        </div>
        <button type="button" onClick={openBlogCategoryCreate} className={adm.primaryBtn}>
          <Plus className="w-4 h-4" /> {ap.categories.new}
        </button>
      </div>
      <p className={adm.lead}>
        {ap.categories.hint}
      </p>

      <div className={adm.tableShell}>
        <div className={adm.tableWrap}>
        <table className={`${adm.table} min-w-[560px]`}>
          <thead className={adm.thead}>
            <tr>
              <th className={adm.th}>
                {ap.categories.colOrder}
              </th>
              <th className={adm.th}>
                {ap.categories.colName}
              </th>
              <th className={adm.th}>{ap.categories.colSlug}</th>
              <th className={adm.th}>
                {ap.categories.colActions}
              </th>
            </tr>
          </thead>
          <tbody className={adm.tbody}>
            {blogCategories.length === 0 ? (
              <tr>
                <td colSpan={4} className={adm.tdEmpty}>
                  {ap.categories.empty}
                </td>
              </tr>
            ) : (
              [...blogCategories]
                .sort((a, b) => a.sort_order - b.sort_order || a.slug.localeCompare(b.slug))
                .map((c) => (
                  <tr key={c.id} className={adm.tr}>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{c.sort_order}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">{c.title}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-300">{c.slug}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openBlogCategoryEdit(c)}
                          className="p-1.5 text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded transition-colors"
                          title={ap.users.editTitleTooltip}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!window.confirm(ap.categories.deleteConfirm)) return;
                            blogApi
                              .adminCategoryDelete(c.id)
                              .then(() => {
                                toast.success(ap.toasts.categoryDeleted);
                                refreshBlogCategories();
                              })
                              .catch((e: unknown) =>
                                toast.error(e instanceof Error ? e.message : ap.toasts.categoryDeleteError),
                              );
                          }}
                          className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title={ap.users.deleteTooltip}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {editingBlogCategory ? (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4"
          onClick={() => setEditingBlogCategory(null)}
        >
          <div
            className="bg-card rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700 sticky top-0 bg-card z-10">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {editingBlogCategory === 'create' ? ap.categories.modalNew : ap.categories.modalEdit}
              </h3>
              <button
                type="button"
                onClick={() => setEditingBlogCategory(null)}
                className="p-1 hover:bg-accent rounded"
              >
                <X className="w-5 h-5 dark:text-gray-400" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              {editingBlogCategory === 'create' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {ap.categories.nameLabel}
                    </label>
                    <input
                      type="text"
                      value={editCatTitle}
                      onChange={(e) => setEditCatTitle(e.target.value.slice(0, 200))}
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                    />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{ap.categories.slugLabel}</label>
                      <button
                        type="button"
                        onClick={() => setEditCatSlug(titleToBlogSlug(editCatTitle))}
                        className="text-xs text-primary hover:underline"
                      >
                        {ap.categories.slugFromTitle}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={editCatSlug}
                      onChange={(e) =>
                        setEditCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                      }
                      placeholder={ap.categories.slugPlaceholder}
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg font-mono text-sm"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {ap.categories.nameLabel}
                    </label>
                    <input
                      type="text"
                      value={editCatTitle}
                      onChange={(e) => setEditCatTitle(e.target.value.slice(0, 200))}
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{ap.blog.colSlug}</label>
                    <input
                      type="text"
                      value={editCatSlug}
                      readOnly
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 rounded-lg font-mono text-sm cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{ap.categories.slugReadonlyHint}</p>
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {ap.categories.sortLabel}
                </label>
                <input
                  type="number"
                  value={editCatSort}
                  onChange={(e) => setEditCatSort(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t dark:border-gray-700">
              <button
                type="button"
                onClick={() => setEditingBlogCategory(null)}
                className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-accent"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={handleSaveBlogCategory}
                className="flex items-center gap-2 px-4 py-3 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                <Save className="w-4 h-4" /> {t.common.save}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );

  const renderMedia = () => (
    <div className={adm.page}>
      <div className={adm.headerRow}>
        <div className={adm.headerText}>
          <h2 className={adm.title}>{ap.media.title}</h2>
        </div>
        <button onClick={openMediaCreate} className={adm.primaryBtn}>
          <Plus className="w-4 h-4" /> {ap.media.add}
        </button>
      </div>

      <div className={adm.tableShell}>
        <div className={adm.tableWrap}>
        <table className={`${adm.table} min-w-[600px]`}>
          <thead className={adm.thead}>
            <tr>
              <th className={adm.th}>{ap.media.colLogo}</th>
              <th className={adm.th}>{ap.media.colTitle}</th>
              <th className={adm.th}>{ap.media.colDate}</th>
              <th className={adm.th}>{ap.media.colLink}</th>
              <th className={adm.th}>{ap.media.colActions}</th>
            </tr>
          </thead>
          <tbody className={adm.tbody}>
            {mediaArticles.length === 0 ? (
              <tr>
                <td colSpan={5} className={adm.tdEmpty}>
                  {ap.media.empty}
                </td>
              </tr>
            ) : (
              mediaArticles.map((m) => (
                <tr key={m.id} className={adm.tr}>
                  <td className="px-4 py-3">
                    {m.logo_url ? (
                      <img src={m.logo_url.startsWith('http') || m.logo_url.startsWith('data:') ? m.logo_url : `${API_BASE}${m.logo_url}`} alt="" className="h-8 object-contain max-w-[80px]" />
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white max-w-[200px] truncate">{m.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{m.published_at ? new Date(m.published_at).toLocaleDateString('ru-RU') : '—'}</td>
                  <td className="px-4 py-3">
                    {m.link ? (
                      <a href={m.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm truncate max-w-[150px] block">
                        {m.link}
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openMediaEdit(m)}
                        className="p-1.5 text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded transition-colors"
                        title={ap.blog.editTooltip}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(ap.media.deletePublicationConfirm)) onMediaDelete(m.id);
                        }}
                        className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title={ap.blog.deleteTooltip}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Media Create/Edit Modal */}
      {editingMedia && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4" onClick={() => setEditingMedia(null)}>
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {editingMedia === 'create' ? ap.media.modalAdd : ap.media.modalEdit}
              </h3>
              <button onClick={() => setEditingMedia(null)} className="p-1 hover:bg-accent dark:hover:bg-accent rounded"><X className="w-5 h-5 dark:text-gray-400" /></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{ap.media.logoUrl}</label>
                <input type="text" value={editLogoUrl} onChange={(e) => setEditLogoUrl(e.target.value)} placeholder="https://..." className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{ap.media.titleLabel}</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value.slice(0, 100))}
                  maxLength={100}
                  placeholder={ap.media.titleHint}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{editTitle.length}/100</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{ap.media.dateLabel}</label>
                <input type="date" value={editPublishedAt} onChange={(e) => setEditPublishedAt(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{ap.media.linkLabel}</label>
                <input type="url" value={editLink} onChange={(e) => setEditLink(e.target.value)} placeholder="https://..." className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t dark:border-gray-700">
              <button onClick={() => setEditingMedia(null)} className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-accent dark:hover:bg-accent">{t.common.cancel}</button>
              <button onClick={handleSaveMedia} disabled={!editTitle.trim() || editTitle.length > 100} className="flex items-center gap-2 px-4 py-3 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"><Save className="w-4 h-4" /> {t.common.save}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const openPartnerCreate = () => {
    setEditingPartner('create');
    setEditPartnerLogoUrl('');
    setEditPartnerName('');
    setEditPartnerLink('');
    setEditPartnerMedallion(false);
  };

  const openPartnerEdit = (p: Partner) => {
    setEditingPartner(p);
    setEditPartnerLogoUrl(p.logo_url || '');
    setEditPartnerName(p.name);
    setEditPartnerLink(p.link || '');
    setEditPartnerMedallion(!!p.is_medallion_partner);
  };

  const handleSavePartner = () => {
    if (editingPartner === 'create') {
      onPartnerCreate({
        logo_url: editPartnerLogoUrl.trim() || undefined,
        name: editPartnerName.trim(),
        link: editPartnerLink.trim() || undefined,
        is_medallion_partner: editPartnerMedallion,
      });
    } else if (editingPartner && editingPartner !== 'create') {
      onPartnerUpdate(editingPartner.id, {
        logo_url: editPartnerLogoUrl.trim() || undefined,
        name: editPartnerName.trim(),
        link: editPartnerLink.trim() || undefined,
        is_medallion_partner: editPartnerMedallion,
      });
    }
    setEditingPartner(null);
  };

  const renderPartners = () => (
    <div className={adm.page}>
      <div className={adm.headerRow}>
        <div className={adm.headerText}>
          <h2 className={adm.title}>{ap.partners.title}</h2>
        </div>
        <button onClick={openPartnerCreate} className={adm.primaryBtn}>
          <Plus className="w-4 h-4" /> {ap.partners.add}
        </button>
      </div>

      <div className={adm.tableShell}>
        <div className={adm.tableWrap}>
        <table className={`${adm.table} min-w-[600px]`}>
          <thead className={adm.thead}>
            <tr>
              <th className={adm.th}>{ap.partners.colLogo}</th>
              <th className={adm.th}>{ap.partners.colName}</th>
              <th className={adm.th}>{ap.partners.colLink}</th>
              <th className={adm.th}>{ap.partners.colMedallions}</th>
              <th className={adm.th}>{ap.partners.colActions}</th>
            </tr>
          </thead>
          <tbody className={adm.tbody}>
            {partners.length === 0 ? (
              <tr>
                <td colSpan={5} className={adm.tdEmpty}>
                  {ap.partners.empty}
                </td>
              </tr>
            ) : (
              partners.map((p) => (
                <tr key={p.id} className={adm.tr}>
                  <td className="px-4 py-3">
                    {p.logo_url ? (
                      <img src={p.logo_url.startsWith('http') || p.logo_url.startsWith('data:') ? p.logo_url : `${API_BASE}${p.logo_url}`} alt="" className="h-8 object-contain max-w-[80px]" />
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">{p.name}</td>
                  <td className="px-4 py-3">
                    {p.link ? (
                      <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm truncate max-w-[200px] block">
                        {p.link}
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        p.is_medallion_partner
                          ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {p.is_medallion_partner ? ap.partners.medallionYes : ap.partners.medallionNo}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openPartnerEdit(p)}
                        className="p-1.5 text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded transition-colors"
                        title={ap.blog.editTooltip}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(ap.partners.deleteConfirm)) onPartnerDelete(p.id);
                        }}
                        className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title={ap.blog.deleteTooltip}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {editingPartner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4" onClick={() => setEditingPartner(null)}>
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {editingPartner === 'create' ? ap.partners.modalAdd : ap.partners.modalEdit}
              </h3>
              <button onClick={() => setEditingPartner(null)} className="p-1 hover:bg-accent dark:hover:bg-accent rounded"><X className="w-5 h-5 dark:text-gray-400" /></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{ap.partners.logoUrl}</label>
                <input type="text" value={editPartnerLogoUrl} onChange={(e) => setEditPartnerLogoUrl(e.target.value)} placeholder="https://..." className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{ap.partners.nameLabel}</label>
                <input type="text" value={editPartnerName} onChange={(e) => setEditPartnerName(e.target.value.slice(0, 100))} maxLength={100} placeholder={ap.partners.namePlaceholder} className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{editPartnerName.length}/100</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{ap.partners.linkLabel}</label>
                <input type="url" value={editPartnerLink} onChange={(e) => setEditPartnerLink(e.target.value)} placeholder="https://..." className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
              </div>
              <label className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={editPartnerMedallion}
                  onChange={(e) => setEditPartnerMedallion(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600"
                />
                <span>{ap.partners.medallionCheckbox}</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t dark:border-gray-700">
              <button onClick={() => setEditingPartner(null)} className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-accent dark:hover:bg-accent">{t.common.cancel}</button>
              <button onClick={handleSavePartner} disabled={!editPartnerName.trim()} className="flex items-center gap-2 px-4 py-3 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"><Save className="w-4 h-4" /> {t.common.save}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const openFaqCreate = () => {
    const nextOrder = faqItems.length ? Math.max(...faqItems.map((f) => f.sort_order), 0) + 1 : 0;
    setEditingFaq('create');
    setEditFaqQr('');
    setEditFaqQb('');
    setEditFaqQe('');
    setEditFaqAr('');
    setEditFaqAb('');
    setEditFaqAe('');
    setEditFaqSort(nextOrder);
  };

  const openFaqEdit = (row: FaqItem) => {
    setEditingFaq(row);
    setEditFaqQr(row.question_ru);
    setEditFaqQb(row.question_be);
    setEditFaqQe(row.question_en);
    setEditFaqAr(row.answer_ru);
    setEditFaqAb(row.answer_be);
    setEditFaqAe(row.answer_en);
    setEditFaqSort(row.sort_order);
  };

  const handleSaveFaq = () => {
    if (editingFaq === 'create') {
      onFaqCreate({
        question_ru: editFaqQr,
        question_be: editFaqQb,
        question_en: editFaqQe,
        answer_ru: editFaqAr,
        answer_be: editFaqAb,
        answer_en: editFaqAe,
        sort_order: editFaqSort,
      });
    } else if (editingFaq && editingFaq !== 'create') {
      onFaqUpdate(editingFaq.id, {
        question_ru: editFaqQr,
        question_be: editFaqQb,
        question_en: editFaqQe,
        answer_ru: editFaqAr,
        answer_be: editFaqAb,
        answer_en: editFaqAe,
        sort_order: editFaqSort,
      });
    }
    setEditingFaq(null);
  };

  const renderFaq = () => (
    <div className={adm.page}>
      <div className={adm.headerRow}>
        <div className={adm.headerText}>
          <h2 className={adm.title}>{ap.faq.title}</h2>
          <p className={adm.subtitle}>{ap.faq.hint}</p>
        </div>
        <button type="button" onClick={openFaqCreate} className={adm.primaryBtn}>
          <Plus className="w-4 h-4" /> {ap.faq.add}
        </button>
      </div>

      <div className={adm.tableShell}>
        <div className={adm.tableWrap}>
        <table className={`${adm.table} min-w-[480px]`}>
          <thead className={adm.thead}>
            <tr>
              <th className={adm.th}>
                {ap.faq.colOrder}
              </th>
              <th className={adm.th}>
                {ap.faq.colQuestion}
              </th>
              <th className={adm.th}>
                {ap.faq.colActions}
              </th>
            </tr>
          </thead>
          <tbody className={adm.tbody}>
            {faqRowsSorted.length === 0 ? (
              <tr>
                <td colSpan={3} className={adm.tdEmpty}>
                  {ap.faq.empty}
                </td>
              </tr>
            ) : (
              faqRowsSorted.map((row) => (
                <tr key={row.id} className={adm.tr}>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {row.sort_order}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white max-w-md truncate">
                    {row.question_ru || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openFaqEdit(row)}
                        className="p-1.5 text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded transition-colors"
                        title={ap.blog.editTooltip}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(ap.faq.deleteConfirm)) onFaqDelete(row.id);
                        }}
                        className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title={ap.blog.deleteTooltip}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {editingFaq && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4"
          onClick={() => setEditingFaq(null)}
        >
          <div
            className="bg-card rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700 sticky top-0 bg-card z-10">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {editingFaq === 'create' ? ap.faq.modalAdd : ap.faq.modalEdit}
              </h3>
              <button
                type="button"
                onClick={() => setEditingFaq(null)}
                className="p-1 hover:bg-accent dark:hover:bg-accent rounded"
              >
                <X className="w-5 h-5 dark:text-gray-400" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {ap.faq.sortLabel}
                </label>
                <input
                  type="number"
                  value={editFaqSort}
                  onChange={(e) => setEditFaqSort(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {ap.faq.questionRu}
                </label>
                <textarea
                  value={editFaqQr}
                  onChange={(e) => setEditFaqQr(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg resize-y"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {ap.faq.questionBe}
                </label>
                <textarea
                  value={editFaqQb}
                  onChange={(e) => setEditFaqQb(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg resize-y"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {ap.faq.questionEn}
                </label>
                <textarea
                  value={editFaqQe}
                  onChange={(e) => setEditFaqQe(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg resize-y"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {ap.faq.answerRu}
                </label>
                <textarea
                  value={editFaqAr}
                  onChange={(e) => setEditFaqAr(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg resize-y"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {ap.faq.answerBe}
                </label>
                <textarea
                  value={editFaqAb}
                  onChange={(e) => setEditFaqAb(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg resize-y"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {ap.faq.answerEn}
                </label>
                <textarea
                  value={editFaqAe}
                  onChange={(e) => setEditFaqAe(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg resize-y"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t dark:border-gray-700 sticky bottom-0 bg-card">
              <button
                type="button"
                onClick={() => setEditingFaq(null)}
                className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-accent dark:hover:bg-accent"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={handleSaveFaq}
                className="flex items-center gap-2 px-4 py-3 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                <Save className="w-4 h-4" /> {t.common.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderRewards = () => {
    const txRows = pointsTransactions
      .filter((tx) => (rewardsKindFilter === 'all' ? true : tx.kind === rewardsKindFilter))
      .slice(0, 300);

    const rl = ap.rewardsLog;
    return (
      <div className={adm.page}>
        <div className={adm.headerRow}>
          <div className={adm.headerText}>
            <h2 className={adm.title}>{rl.title}</h2>
            <p className={adm.subtitle}>{rl.subtitle}</p>
          </div>
        </div>
        <div className={adm.filtersCard}>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0">{rl.filterKind}</label>
            <Select value={rewardsKindFilter} onValueChange={setRewardsKindFilter}>
              <SelectTrigger className="w-[min(100%,240px)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{rl.filterAll}</SelectItem>
                <SelectItem value="helper_reward">{rl.filterHelper}</SelectItem>
                <SelectItem value="manual_adjustment">{rl.filterManual}</SelectItem>
              </SelectContent>
            </Select>
            <button
              type="button"
              onClick={() => {
                rewardsApi.listPointsTransactions({ limit: 300 }).then(setPointsTransactions).catch(() => {
                  setPointsTransactions([]);
                });
              }}
              className={`${adm.primaryBtn} ml-auto`}
            >
              {rl.refresh}
            </button>
          </div>
        </div>

        <div className={adm.tableShell}>
          <div className={adm.tableWrap}>
          <table className={`${adm.table} min-w-[860px]`}>
            <thead className={adm.thead}>
              <tr>
                <th className={adm.th}>{rl.colDate}</th>
                <th className={adm.th}>{rl.colUser}</th>
                <th className={adm.th}>{rl.colPet}</th>
                <th className={adm.th}>{rl.colPoints}</th>
                <th className={adm.th}>{rl.colKind}</th>
                <th className={adm.th}>{rl.colNote}</th>
              </tr>
            </thead>
            <tbody className={adm.tbody}>
              {txRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className={adm.tdEmpty}>
                    {rl.empty}
                  </td>
                </tr>
              ) : (
                txRows.map((tx) => {
                  const rewardUser = users.find((u) => u.id === tx.user_id);
                  const rewardPet = tx.pet_id ? pets.find((p) => p.id === tx.pet_id) : undefined;
                  return (
                    <tr key={tx.id} className={adm.tr}>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{formatDate(new Date(tx.created_at))}</td>
                      <td className="px-4 py-3 text-sm">
                        <a href={`/user/${tx.user_id}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {rewardUser?.name || tx.user_id}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {tx.pet_id ? (
                          <a href={`/pet/${tx.pet_id}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {rewardPet?.breed || tx.pet_id}
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{tx.amount}</td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 font-mono">{tx.kind}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{tx.note || '—'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    );
  };

  const renderFeatureFlags = () => (
    <div className={adm.page}>
      <div className={adm.headerRow}>
        <div className={adm.headerText}>
          <h2 className={adm.title}>{ap.featureFlags.title}</h2>
        </div>
      </div>

      <div className={adm.settingsCard}>
        <h3 className={adm.settingsCardTitle}>{ap.featureFlags.landingTitle}</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{ap.featureFlags.ffStats}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{ap.featureFlags.ffStatsDesc}</p>
            </div>
            <Switch
              checked={featureFlags.ff_landing_show_stats}
              onCheckedChange={(v) => setFeatureFlags((f) => ({ ...f, ff_landing_show_stats: v }))}
            />
          </div>
          <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{ap.featureFlags.ffHelp}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{ap.featureFlags.ffHelpDesc}</p>
            </div>
            <Switch
              checked={featureFlags.ff_landing_show_help}
              onCheckedChange={(v) => setFeatureFlags((f) => ({ ...f, ff_landing_show_help: v }))}
            />
          </div>
          <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{ap.featureFlags.ffPets}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{ap.featureFlags.ffPetsDesc}</p>
            </div>
            <Switch
              checked={featureFlags.ff_landing_show_pets_feature}
              onCheckedChange={(v) =>
                setFeatureFlags((f) => ({ ...f, ff_landing_show_pets_feature: v }))
              }
            />
          </div>
          <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{ap.featureFlags.ffFaq}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{ap.featureFlags.ffFaqDesc}</p>
            </div>
            <Switch
              checked={featureFlags.ff_landing_show_faq}
              onCheckedChange={(v) => setFeatureFlags((f) => ({ ...f, ff_landing_show_faq: v }))}
            />
          </div>
        </div>
      </div>

      <div className={adm.settingsCard}>
        <h3 className={adm.settingsCardTitle}>{ap.featureFlags.siteTitle}</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{ap.featureFlags.ffInstagramBoost}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{ap.featureFlags.ffInstagramBoostDesc}</p>
            </div>
            <Switch
              checked={featureFlags.ff_instagram_boost_stories}
              onCheckedChange={(v) => setFeatureFlags((f) => ({ ...f, ff_instagram_boost_stories: v }))}
            />
          </div>
          <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{ap.featureFlags.ffRewardEnabled}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{ap.featureFlags.ffRewardEnabledDesc}</p>
            </div>
            <Switch
              checked={featureFlags.ff_reward_enabled}
              onCheckedChange={(v) => setFeatureFlags((f) => ({ ...f, ff_reward_enabled: v }))}
            />
          </div>
          <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{ap.featureFlags.ffRewardMoneyEnabled}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{ap.featureFlags.ffRewardMoneyEnabledDesc}</p>
            </div>
            <Switch
              checked={featureFlags.ff_reward_money_enabled}
              onCheckedChange={(v) => setFeatureFlags((f) => ({ ...f, ff_reward_money_enabled: v }))}
            />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-600">
            {ap.featureFlags.siteEmpty}
          </p>
        </div>
      </div>

      <div className={adm.footerActions}>
        <button onClick={handleSaveFeatureFlags} className={adm.saveBtnLg}>
          {t.common.save}
        </button>
      </div>
    </div>
  );

  const renderTelegramBlogSettings = () => (
    <div className={adm.page}>
      <div className={adm.headerRow}>
        <div className={adm.headerText}>
          <h2 className={adm.title}>{ap.telegram.title}</h2>
          <p className={adm.subtitle}>{ap.telegram.intro}</p>
        </div>
      </div>

      <div className={`${adm.settingsCard} space-y-4 max-w-3xl`}>
        <div>
          <h3 className={adm.settingsCardTitle}>{ap.telegram.publishTargetTitle}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {ap.telegram.envVarsIntro}{' '}
            <code className="text-xs bg-muted px-1 rounded">TELEGRAM_BLOG_CHAT_ID</code>{' '}
            {ap.telegram.envVarsConjunction}{' '}
            <code className="text-xs bg-muted px-1 rounded">TELEGRAM_BLOG_PUBLIC_USERNAME</code>
            {ap.telegram.envVarsSuffix}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {ap.telegram.chatIdLabel}
          </label>
          <input
            type="text"
            value={blogTelegramChatId}
            onChange={(e) => setBlogTelegramChatId(e.target.value)}
            placeholder={ap.telegram.chatIdPlaceholder}
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm font-mono"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {ap.telegram.publicUsernameLabel}
          </label>
          <input
            type="text"
            value={blogTelegramPublicUsername}
            onChange={(e) => setBlogTelegramPublicUsername(e.target.value.replace(/^@/, ''))}
            placeholder={ap.telegram.usernamePlaceholder}
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm font-mono"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {ap.telegram.usernameHint}
          </p>
        </div>
        <button type="button" onClick={handleSaveBlogTelegramSettings} className={adm.primaryBtn}>
          {ap.telegram.save}
        </button>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className={adm.page}>
      <div className={adm.headerRow}>
        <div className={adm.headerText}>
          <h2 className={adm.title}>{ap.settings.title}</h2>
        </div>
      </div>

      <div className={adm.settingsCard}>
        <h3 className={adm.settingsCardTitle}>{ap.settings.general}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {ap.settings.moderationLabel}
            </label>
            <Select value={settings.requireModeration ? 'yes' : 'no'} onValueChange={(v) => setSettings(s => ({ ...s, requireModeration: v === 'yes' }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={ap.settings.moderationPh} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">{ap.settings.moderationYes}</SelectItem>
                <SelectItem value="no">{ap.settings.moderationNo}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {ap.settings.archiveLabel}
            </label>
            <input 
              type="number"
              min={1}
              max={365}
              value={settings.autoArchiveDays}
              onChange={(e) => setSettings(s => ({ ...s, autoArchiveDays: Math.max(1, parseInt(e.target.value) || 90) }))}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {ap.settings.maxPhotosLabel}
            </label>
            <input 
              type="number"
              min={1}
              max={20}
              value={settings.maxPhotos}
              onChange={(e) => setSettings(s => ({ ...s, maxPhotos: Math.max(1, Math.min(20, parseInt(e.target.value) || 5)) }))}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
            />
          </div>
        </div>
      </div>

      <div className={adm.settingsCard}>
        <h3 className={adm.settingsCardTitle}>{ap.settings.rewardsSectionTitle}</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={adm.labelFilter}>{ap.settings.rewardDefaultPointsLabel}</label>
              <input
                type="number"
                min={1}
                max={10000}
                value={settings.rewardDefaultPoints}
                onChange={(e) => setSettings((s) => ({ ...s, rewardDefaultPoints: Math.max(1, parseInt(e.target.value, 10) || 50) }))}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>

      <div className={adm.settingsCard}>
        <h3 className={adm.settingsCardTitle}>{ap.settings.citiesTitle}</h3>
        <p className={adm.lead}>
          {ap.settings.citiesHint}
        </p>
      </div>

      <div className={adm.footerActions}>
        <button onClick={handleSaveSettings} className={adm.saveBtnLg}>
          {ap.settings.save}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900">
      {/* Header */}
      <div className="bg-card border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="p-2 hover:bg-accent dark:hover:bg-accent rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">{ap.header.title}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">{ap.header.subtitle}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Разделы + подвкладки */}
      <div className="bg-card border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 py-2 overflow-x-auto scrollbar-hide border-b border-gray-200/80 dark:border-gray-600/80">
            {sectionMeta.map((sec) => {
              const SecIcon = sec.icon;
              const isActive = activePrimary === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => selectPrimary(sec.id)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-sm font-medium shrink-0 transition-colors ${
                    isActive
                      ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-muted dark:hover:bg-gray-800'
                  }`}
                >
                  <SecIcon className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">{sec.label}</span>
                  <span className="sm:hidden">{sec.shortLabel}</span>
                </button>
              );
            })}
          </div>
          {activePrimary !== 'dashboard' ? (
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-1 min-w-max">
                {subTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => selectTab(tab.id)}
                      className={`flex items-center gap-2 px-3 sm:px-4 py-3 border-b-2 transition-colors whitespace-nowrap text-sm ${
                        activeTab === tab.id
                          ? 'border-primary text-primary'
                          : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{tab.label}</span>
                      {tab.id === 'reports' && stats.pendingReports > 0 && (
                        <span className="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full text-xs font-medium">
                          {stats.pendingReports}
                        </span>
                      )}
                      {tab.id === 'moderation' && pets.filter((p) => p.moderationStatus === 'pending').length > 0 && (
                        <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full text-xs font-medium">
                          {pets.filter((p) => p.moderationStatus === 'pending').length}
                        </span>
                      )}
                      {tab.id === 'sheltersModeration' && shelterPendingList.length > 0 && (
                        <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full text-xs font-medium">
                          {shelterPendingList.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'moderation' && (
          <ModerationPanel
            pets={pets}
            onApprovePet={(pet) => {
              const approvedPet: Pet = {
                ...pet,
                moderationStatus: 'approved',
                moderatedAt: new Date(),
                moderatedBy: 'admin'
              };
              onUpdatePet(approvedPet);
            }}
            onRejectPet={(pet, reason) => {
              const rejectedPet: Pet = {
                ...pet,
                moderationStatus: 'rejected',
                moderationReason: reason,
                moderatedAt: new Date(),
                moderatedBy: 'admin'
              };
              onUpdatePet(rejectedPet);
            }}
          />
        )}
        {activeTab === 'sheltersCatalog' && renderSheltersCatalog()}
        {activeTab === 'sheltersModeration' && renderSheltersModeration()}
        {activeTab === 'pets' && <PetsAdminPanel pets={pets} users={users} onDeletePet={onDeletePet} onOpenPet={(petId) => window.open(`/pet/${petId}`, '_blank')} />}
        {activeTab === 'profilePets' && <ProfilePetsAdminPanel profilePets={profilePets} onDeleteProfilePet={onDeleteProfilePet} />}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'rewards' && renderRewards()}
        {activeTab === 'reports' && renderReports()}
        {activeTab === 'media' && renderMedia()}
        {activeTab === 'blog' && renderBlog()}
        {activeTab === 'blogCategories' && renderBlogCategories()}
        {activeTab === 'partners' && renderPartners()}
        {activeTab === 'faq' && renderFaq()}
        {activeTab === 'featureFlags' && renderFeatureFlags()}
        {activeTab === 'telegramBlog' && renderTelegramBlogSettings()}
        {activeTab === 'instagram' && <AdminInstagramPanel />}
        {activeTab === 'settings' && renderSettings()}
      </div>
    </div>
  );
}
