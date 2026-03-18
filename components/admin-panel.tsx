import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  AlertTriangle, 
  Settings, 
  Flag,
  ArrowLeft,
  TrendingUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
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
  Handshake
} from 'lucide-react';
import { toast } from 'sonner';
import { Pet } from '../types/pet';
import { User } from '../context/AuthContext';
import { Report, AdminStats, reportReasonLabels } from '../types/admin';
import { formatDate, statusLabels } from '../utils/pet-helpers';
import { settingsApi, featureFlagsApi, API_BASE } from '../api/client';
import type { MediaArticle, Partner } from '../api/client';
import { ModerationPanel } from './moderation-panel';
import { PetsAdminPanel } from './pets-admin-panel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';

type AdminTab = 'dashboard' | 'moderation' | 'pets' | 'users' | 'reports' | 'media' | 'partners' | 'featureFlags' | 'settings';

interface AdminPanelProps {
  pets: Pet[];
  users: User[];
  reports: Report[];
  mediaArticles: MediaArticle[];
  partners: Partner[];
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
  onPartnerCreate: (data: { logo_url?: string; name: string; link?: string }) => void;
  onPartnerUpdate: (id: string, data: Partial<{ logo_url: string; name: string; link: string }>) => void;
  onPartnerDelete: (id: string) => void;
}

export function AdminPanel({ 
  pets, 
  users, 
  reports,
  mediaArticles,
  partners,
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
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

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

  // Reports filters and pagination
  const [reportsStatusFilter, setReportsStatusFilter] = useState<string>('all');
  const [reportsReasonFilter, setReportsReasonFilter] = useState<string>('all');
  const [reportsPage, setReportsPage] = useState(1);
  const reportsPerPage = 10;

  // Media article modal (create/edit)
  const [editingMedia, setEditingMedia] = useState<MediaArticle | 'create' | null>(null);
  const [editLogoUrl, setEditLogoUrl] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editPublishedAt, setEditPublishedAt] = useState('');
  const [editLink, setEditLink] = useState('');

  // Partner modal (create/edit)
  const [editingPartner, setEditingPartner] = useState<Partner | 'create' | null>(null);
  const [editPartnerLogoUrl, setEditPartnerLogoUrl] = useState('');
  const [editPartnerName, setEditPartnerName] = useState('');
  const [editPartnerLink, setEditPartnerLink] = useState('');

  // Platform settings (stored on backend)
  const [settings, setSettings] = useState({
    requireModeration: true,
    autoArchiveDays: 90,
    maxPhotos: 5,
  });

  const [featureFlags, setFeatureFlags] = useState({
    ff_landing_show_stats: true,
    ff_landing_show_help: true,
  });

  useEffect(() => {
    settingsApi.get().then((s) => {
      setSettings({
        requireModeration: s.require_moderation === 'true',
        autoArchiveDays: parseInt(s.auto_archive_days, 10) || 90,
        maxPhotos: parseInt(s.max_photos, 10) || 5,
      });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    featureFlagsApi.get().then((ff) => {
      setFeatureFlags({
        ff_landing_show_stats: ff.ff_landing_show_stats === 'true',
        ff_landing_show_help: ff.ff_landing_show_help === 'true',
      });
    }).catch(() => {});
  }, []);

  const handleSaveSettings = () => {
    settingsApi.update({
      require_moderation: settings.requireModeration ? 'true' : 'false',
      auto_archive_days: String(settings.autoArchiveDays),
      max_photos: String(settings.maxPhotos),
    }).then(() => {
      toast.success('Настройки сохранены');
    }).catch(() => {
      toast.error('Не удалось сохранить настройки');
    });
  };

  const handleSaveFeatureFlags = () => {
    featureFlagsApi.update({
      ff_landing_show_stats: featureFlags.ff_landing_show_stats,
      ff_landing_show_help: featureFlags.ff_landing_show_help,
    }).then(() => {
      toast.success('Фича-флаги сохранены');
    }).catch(() => {
      toast.error('Не удалось сохранить фича-флаги');
    });
  };

  // Calculate real stats from data
  const stats: AdminStats = {
    totalPets: pets.length,
    activePets: pets.filter(p => !p.isArchived).length,
    archivedPets: pets.filter(p => p.isArchived).length,
    totalUsers: users.length,
    blockedUsers: users.filter(u => u.isBlocked).length,
    pendingReports: reports.filter(r => r.status === 'pending').length,
    resolvedReports: reports.filter(r => r.status === 'resolved').length,
    petsLast7Days: pets.filter(p => {
      const daysDiff = Math.floor((Date.now() - new Date(p.publishedAt).getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 7;
    }).length,
    petsLast30Days: pets.filter(p => {
      const daysDiff = Math.floor((Date.now() - new Date(p.publishedAt).getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 30;
    }).length,
    successRate: pets.length > 0 
      ? (pets.filter(p => p.status === 'found').length / pets.length) * 100 
      : 0
  };

  const tabs = [
    { id: 'dashboard' as const, label: 'Дашборд', icon: LayoutDashboard },
    { id: 'moderation' as const, label: 'Модерация', icon: ClipboardCheck },
    { id: 'pets' as const, label: 'Объявления', icon: FileText },
    { id: 'users' as const, label: 'Пользователи', icon: Users },
    { id: 'reports' as const, label: 'Жалобы', icon: AlertTriangle },
    { id: 'media' as const, label: 'СМИ о нас', icon: Newspaper },
    { id: 'partners' as const, label: 'Партнеры', icon: Handshake },
    { id: 'featureFlags' as const, label: 'Feature flags', icon: Flag },
    { id: 'settings' as const, label: 'Настройки', icon: Settings },
  ];

  const renderDashboard = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Обзор платформы</h2>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Всего объявлений</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalPets}</p>
            </div>
            <div className="p-3 bg-accent dark:bg-accent rounded-lg">
              <FileText className="w-6 h-6 text-muted-foreground" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Активных: {stats.activePets} | В архиве: {stats.archivedPets}
          </div>
        </div>

        <div className="bg-card border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Пользователи</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalUsers}</p>
            </div>
            <div className="p-3 bg-accent dark:bg-accent rounded-lg">
              <Users className="w-6 h-6 text-muted-foreground" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Заблокировано: {stats.blockedUsers}
          </div>
        </div>

        <div className="bg-card border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Жалобы</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.pendingReports}</p>
            </div>
            <div className="p-3 bg-accent dark:bg-accent rounded-lg">
              <AlertTriangle className="w-6 h-6 text-muted-foreground" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Обработано: {stats.resolvedReports}
          </div>
        </div>

        <div className="bg-card border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Успешность</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.successRate.toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-accent dark:bg-accent rounded-lg">
              <TrendingUp className="w-6 h-6 text-muted-foreground" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Питомцев найдено
          </div>
        </div>
      </div>

      {/* Activity Chart */}
      <div className="bg-card border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Активность</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-accent dark:bg-accent rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">За последние 7 дней</p>
            <p className="text-2xl font-bold text-foreground mt-1">{stats.petsLast7Days}</p>
          </div>
          <div className="p-4 bg-accent dark:bg-accent rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">За последние 30 дней</p>
            <p className="text-2xl font-bold text-foreground mt-1">{stats.petsLast30Days}</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Последние объявления</h3>
        <div className="space-y-3">
          {pets.slice(0, 5).map(pet => (
            <div key={pet.id} className="flex items-center justify-between p-3 bg-accent dark:bg-accent rounded-lg">
              <div className="flex items-center gap-3">
                <img src={pet.photos[0]} alt="" className="w-12 h-12 object-cover rounded-lg" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{pet.breed || 'Без породы'}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{pet.city} · {pet.authorName}</p>
                </div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {formatDate(pet.publishedAt)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const openEditUser = (u: User) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditRole(u.role);
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

    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    const paginatedUsers = filteredUsers.slice((usersPage - 1) * usersPerPage, usersPage * usersPerPage);

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Управление пользователями</h2>
        
        {/* Filters Panel */}
        <div className="bg-card border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[250px]">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Поиск</label>
              <input
                type="text"
                placeholder="Поиск по имени или email..."
                value={usersSearch}
                onChange={(e) => {
                  setUsersSearch(e.target.value);
                  setUsersPage(1);
                }}
                className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="min-w-[180px]">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Роль</label>
              <Select value={usersRoleFilter} onValueChange={(v) => { setUsersRoleFilter(v); setUsersPage(1); }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Все роли" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все роли</SelectItem>
                  <SelectItem value="user">Пользователи</SelectItem>
                  <SelectItem value="volunteer">Волонтёры</SelectItem>
                  <SelectItem value="shelter">Приюты</SelectItem>
                  <SelectItem value="admin">Администраторы</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[180px]">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Статус</label>
              <Select value={usersStatusFilter} onValueChange={(v) => { setUsersStatusFilter(v); setUsersPage(1); }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Все статусы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="active">Активные</SelectItem>
                  <SelectItem value="blocked">Заблокированные</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400 ml-auto">
              Найдено: {filteredUsers.length} пользователей
            </div>
          </div>
        </div>

        <div className="bg-card border border-gray-200 dark:border-gray-700 rounded-lg overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-muted dark:bg-accent border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Пользователь</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Роль</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Интеграция</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Контакты</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Статус</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    Пользователи не найдены
                  </td>
                </tr>
              ) : (
                paginatedUsers.map(user => (
                  <tr key={user.id} className="hover:bg-accent dark:hover:bg-accent">
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
                          title="Открыть профиль"
                        >
                          {user.name}
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 truncate max-w-[180px]">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        user.role === 'admin' ? 'bg-primary/10 dark:bg-primary/20 text-primary' :
                        'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}>
                        {{ user: 'Пользователь', volunteer: 'Волонтёр', shelter: 'Приют', admin: 'Админ' }[user.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 truncate max-w-[140px]">
                      {user.telegramUsername
                        ? `@${String(user.telegramUsername).replace(/^@/, '')}`
                        : 'Отсутствует'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 truncate max-w-[140px]">
                      {user.contacts.phone || user.contacts.viber || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {user.isBlocked ? (
                        <span className="inline-flex px-2 py-1 text-xs rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 whitespace-nowrap">
                          Заблокирован
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 whitespace-nowrap">
                          Активен
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditUser(user)}
                          className="p-1.5 text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded transition-colors"
                          title="Редактировать"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onUpdateUser({ ...user, isBlocked: !user.isBlocked })}
                          className={`p-1.5 rounded transition-colors ${user.isBlocked ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20'}`}
                          title={user.isBlocked ? 'Разблокировать' : 'Заблокировать'}
                        >
                          {user.isBlocked ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Удалить пользователя ${user.name}? Это действие необратимо.`)) {
                              onDeleteUser(user.id);
                            }
                          }}
                          className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Удалить"
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

        {/* Edit User Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditingUser(null)}>
            <div className="bg-card rounded-xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">Редактировать пользователя</h3>
                <button onClick={() => setEditingUser(null)} className="p-1 hover:bg-accent dark:hover:bg-accent rounded"><X className="w-5 h-5 dark:text-gray-400" /></button>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Имя</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Роль</label>
                  <Select value={editRole} onValueChange={(v) => setEditRole(v as User['role'])}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Роль" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Пользователь</SelectItem>
                      <SelectItem value="volunteer">Волонтёр</SelectItem>
                      <SelectItem value="shelter">Приют</SelectItem>
                      <SelectItem value="admin">Админ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Телефон</label>
                  <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="+375..." className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Вайбер</label>
                  <input type="text" value={editViber} onChange={(e) => setEditViber(e.target.value)} placeholder="Номер или ник" className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t dark:border-gray-700">
                <button onClick={() => setEditingUser(null)} className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-accent dark:hover:bg-accent">Отмена</button>
                <button onClick={handleSaveEditUser} className="flex items-center gap-2 px-4 py-3 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"><Save className="w-4 h-4" /> Сохранить</button>
              </div>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <button
              onClick={() => setUsersPage(Math.max(1, usersPage - 1))}
              disabled={usersPage === 1}
              className="flex items-center gap-2 px-4 py-3 text-sm bg-card border border-gray-200 dark:border-gray-700 dark:text-gray-300 rounded-lg hover:bg-accent dark:hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Назад
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Страница {usersPage} из {totalPages}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({filteredUsers.length} всего)
              </span>
            </div>
            <button
              onClick={() => setUsersPage(Math.min(totalPages, usersPage + 1))}
              disabled={usersPage >= totalPages}
              className="flex items-center gap-2 px-4 py-3 text-sm bg-card border border-gray-200 dark:border-gray-700 dark:text-gray-300 rounded-lg hover:bg-accent dark:hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Вперед
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
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
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Жалобы</h2>
        
        {/* Filters Panel */}
        <div className="bg-card border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Статус жалобы</label>
              <select
                value={reportsStatusFilter}
                onChange={(e) => {
                  setReportsStatusFilter(e.target.value);
                  setReportsPage(1);
                }}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">Все статусы</option>
                <option value="pending">Новые</option>
                <option value="reviewed">Проверенные</option>
                <option value="resolved">Решённые</option>
                <option value="dismissed">Отклонённые</option>
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Причина жалобы</label>
              <select
                value={reportsReasonFilter}
                onChange={(e) => {
                  setReportsReasonFilter(e.target.value);
                  setReportsPage(1);
                }}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">Все причины</option>
                <option value="spam">Спам / Реклама</option>
                <option value="inappropriate">Неприемлемый контент</option>
                <option value="fake">Мошенничество / Фейк</option>
                <option value="duplicate">Дубликат объявления</option>
                <option value="found">Питомец уже найден</option>
                <option value="other">Другая причина</option>
              </select>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400 ml-auto">
              Найдено: {filteredReports.length} жалоб
            </div>
          </div>
        </div>

      <div className="space-y-4">
        {paginatedReports.length === 0 ? (
          <div className="bg-card border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">Жалобы не найдены</p>
          </div>
        ) : (
          paginatedReports.map(report => {
            const pet = pets.find(p => p.id === report.petId);
            return (
              <div key={report.id} className="bg-card border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        report.status === 'pending' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                        report.status === 'resolved' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                        report.status === 'dismissed' ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {report.status === 'pending' ? 'Новая' : 
                         report.status === 'resolved' ? 'Решена' : 
                         report.status === 'dismissed' ? 'Отклонена' : 'Проверена'}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{reportReasonLabels[report.reason]}</span>
                    </div>
                    
                    <p className="font-medium text-gray-900 dark:text-white mb-1">
                      От: <a href={`/user/${report.reporterId}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/90 hover:underline">{report.reporterName}</a>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{report.description}</p>
                    
                    {pet && (
                      <a
                        href={`/pet/${pet.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-muted dark:bg-accent rounded-lg hover:bg-accent dark:hover:bg-accent transition-colors group"
                      >
                        <img src={pet.photos[0]} alt="" className="w-12 h-12 object-cover rounded-lg" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600">{pet.breed || 'Без породы'}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{pet.city} · {pet.authorName}</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-primary shrink-0" />
                      </a>
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
                          title="Решить"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => onUpdateReport({ ...report, status: 'dismissed', reviewedAt: new Date() })}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-accent dark:hover:bg-accent rounded-lg transition-colors"
                          title="Отклонить"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => {
                        if (window.confirm('Удалить эту жалобу безвозвратно?')) {
                          onDeleteReport(report.id);
                        }
                      }}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Удалить жалобу"
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setReportsPage(Math.max(1, reportsPage - 1))}
            disabled={reportsPage === 1}
            className="flex items-center gap-2 px-4 py-3 text-sm bg-card border border-gray-200 dark:border-gray-700 dark:text-gray-300 rounded-lg hover:bg-accent dark:hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Назад
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Страница {reportsPage} из {totalPages}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({filteredReports.length} всего)
            </span>
          </div>
          <button
            onClick={() => setReportsPage(Math.min(totalPages, reportsPage + 1))}
            disabled={reportsPage >= totalPages}
            className="flex items-center gap-2 px-4 py-3 text-sm bg-card border border-gray-200 dark:border-gray-700 dark:text-gray-300 rounded-lg hover:bg-accent dark:hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Вперед
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
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

  const renderMedia = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">СМИ о нас</h2>
        <button
          onClick={openMediaCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm"
        >
          <Plus className="w-4 h-4" /> Добавить публикацию
        </button>
      </div>

      <div className="bg-card border border-gray-200 dark:border-gray-700 rounded-lg overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-muted dark:bg-accent border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Лого</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Заголовок</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Дата</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ссылка</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {mediaArticles.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  Публикаций пока нет. Добавьте первую.
                </td>
              </tr>
            ) : (
              mediaArticles.map((m) => (
                <tr key={m.id} className="hover:bg-accent dark:hover:bg-accent">
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
                        title="Редактировать"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Удалить эту публикацию?')) onMediaDelete(m.id);
                        }}
                        className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Удалить"
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

      {/* Media Create/Edit Modal */}
      {editingMedia && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditingMedia(null)}>
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {editingMedia === 'create' ? 'Добавить публикацию' : 'Редактировать публикацию'}
              </h3>
              <button onClick={() => setEditingMedia(null)} className="p-1 hover:bg-accent dark:hover:bg-accent rounded"><X className="w-5 h-5 dark:text-gray-400" /></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL логотипа</label>
                <input type="text" value={editLogoUrl} onChange={(e) => setEditLogoUrl(e.target.value)} placeholder="https://..." className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Заголовок *</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value.slice(0, 100))}
                  maxLength={100}
                  placeholder="Заголовок публикации (макс. 100 символов)"
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{editTitle.length}/100</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Дата публикации *</label>
                <input type="date" value={editPublishedAt} onChange={(e) => setEditPublishedAt(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ссылка на статью</label>
                <input type="url" value={editLink} onChange={(e) => setEditLink(e.target.value)} placeholder="https://..." className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t dark:border-gray-700">
              <button onClick={() => setEditingMedia(null)} className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-accent dark:hover:bg-accent">Отмена</button>
              <button onClick={handleSaveMedia} disabled={!editTitle.trim() || editTitle.length > 100} className="flex items-center gap-2 px-4 py-3 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"><Save className="w-4 h-4" /> Сохранить</button>
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
  };

  const openPartnerEdit = (p: Partner) => {
    setEditingPartner(p);
    setEditPartnerLogoUrl(p.logo_url || '');
    setEditPartnerName(p.name);
    setEditPartnerLink(p.link || '');
  };

  const handleSavePartner = () => {
    if (editingPartner === 'create') {
      onPartnerCreate({
        logo_url: editPartnerLogoUrl.trim() || undefined,
        name: editPartnerName.trim(),
        link: editPartnerLink.trim() || undefined,
      });
    } else if (editingPartner && editingPartner !== 'create') {
      onPartnerUpdate(editingPartner.id, {
        logo_url: editPartnerLogoUrl.trim() || undefined,
        name: editPartnerName.trim(),
        link: editPartnerLink.trim() || undefined,
      });
    }
    setEditingPartner(null);
  };

  const renderPartners = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Наши партнеры</h2>
        <button
          onClick={openPartnerCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm"
        >
          <Plus className="w-4 h-4" /> Добавить партнёра
        </button>
      </div>

      <div className="bg-card border border-gray-200 dark:border-gray-700 rounded-lg overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-muted dark:bg-accent border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Лого</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Название</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ссылка</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {partners.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  Партнёров пока нет. Добавьте первого.
                </td>
              </tr>
            ) : (
              partners.map((p) => (
                <tr key={p.id} className="hover:bg-accent dark:hover:bg-accent">
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
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openPartnerEdit(p)}
                        className="p-1.5 text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded transition-colors"
                        title="Редактировать"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Удалить этого партнёра?')) onPartnerDelete(p.id);
                        }}
                        className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Удалить"
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

      {editingPartner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditingPartner(null)}>
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {editingPartner === 'create' ? 'Добавить партнёра' : 'Редактировать партнёра'}
              </h3>
              <button onClick={() => setEditingPartner(null)} className="p-1 hover:bg-accent dark:hover:bg-accent rounded"><X className="w-5 h-5 dark:text-gray-400" /></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL логотипа</label>
                <input type="text" value={editPartnerLogoUrl} onChange={(e) => setEditPartnerLogoUrl(e.target.value)} placeholder="https://..." className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Название компании *</label>
                <input type="text" value={editPartnerName} onChange={(e) => setEditPartnerName(e.target.value.slice(0, 100))} maxLength={100} placeholder="Название партнёра" className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{editPartnerName.length}/100</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ссылка</label>
                <input type="url" value={editPartnerLink} onChange={(e) => setEditPartnerLink(e.target.value)} placeholder="https://..." className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t dark:border-gray-700">
              <button onClick={() => setEditingPartner(null)} className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-accent dark:hover:bg-accent">Отмена</button>
              <button onClick={handleSavePartner} disabled={!editPartnerName.trim()} className="flex items-center gap-2 px-4 py-3 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"><Save className="w-4 h-4" /> Сохранить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderFeatureFlags = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Feature flags</h2>

      <div className="bg-card border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Лендинг</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Показывать секцию статистики</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Hero и блок «Как помочь» с цифрами (найденные питомцы, пользователи и т.д.)</p>
            </div>
            <Switch
              checked={featureFlags.ff_landing_show_stats}
              onCheckedChange={(v) => setFeatureFlags((f) => ({ ...f, ff_landing_show_stats: v }))}
            />
          </div>
          <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Показывать секцию «Как нам помочь»</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Секция на лендинге и ссылка в навигации футера</p>
            </div>
            <Switch
              checked={featureFlags.ff_landing_show_help}
              onCheckedChange={(v) => setFeatureFlags((f) => ({ ...f, ff_landing_show_help: v }))}
            />
          </div>
        </div>
      </div>

      <div className="bg-card border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Основной сайт поиска</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Пока пусто. Фича-флаги для поиска появятся здесь.</p>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSaveFeatureFlags}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Сохранить
        </button>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Настройки платформы</h2>
      
      <div className="bg-card border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Общие настройки</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Требуется ли модерация новых объявлений
            </label>
            <Select value={settings.requireModeration ? 'yes' : 'no'} onValueChange={(v) => setSettings(s => ({ ...s, requireModeration: v === 'yes' }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Модерация" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Да, требуется проверка</SelectItem>
                <SelectItem value="no">Нет, публиковать сразу</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Автоматическая архивация после (дней)
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
              Максимум фото на объявление
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

      <div className="bg-card border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Управление городами</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Список городов настраивается в файле /utils/cities.ts
        </p>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSaveSettings}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Сохранить настройки
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
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Админ-панель</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">Управление платформой</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-card border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1 min-w-max">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap text-sm ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label}</span>
                  {tab.id === 'reports' && stats.pendingReports > 0 && (
                    <span className="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full text-xs font-medium">
                      {stats.pendingReports}
                    </span>
                  )}
                  {tab.id === 'moderation' && pets.filter(p => p.moderationStatus === 'pending').length > 0 && (
                    <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full text-xs font-medium">
                      {pets.filter(p => p.moderationStatus === 'pending').length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
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
        {activeTab === 'pets' && <PetsAdminPanel pets={pets} onDeletePet={onDeletePet} onOpenPet={(petId) => window.open(`/pet/${petId}`, '_blank')} />}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'reports' && renderReports()}
        {activeTab === 'media' && renderMedia()}
        {activeTab === 'partners' && renderPartners()}
        {activeTab === 'featureFlags' && renderFeatureFlags()}
        {activeTab === 'settings' && renderSettings()}
      </div>
    </div>
  );
}
