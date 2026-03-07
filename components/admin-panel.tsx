import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  AlertTriangle, 
  Settings, 
  ArrowLeft,
  TrendingUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Trash2,
  ClipboardCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { Pet } from '../types/pet';
import { User } from '../context/AuthContext';
import { Report, AdminStats, reportReasonLabels } from '../types/admin';
import { formatDate, statusLabels } from '../utils/pet-helpers';
import { settingsApi } from '../api/client';
import { ModerationPanel } from './moderation-panel';
import { PetsAdminPanel } from './pets-admin-panel';

type AdminTab = 'dashboard' | 'moderation' | 'pets' | 'users' | 'reports' | 'settings';

interface AdminPanelProps {
  pets: Pet[];
  users: User[];
  reports: Report[];
  onBack: () => void;
  onUpdatePet: (pet: Pet) => void;
  onDeletePet: (petId: string) => void;
  onUpdateUser: (user: User) => void;
  onUpdateReport: (report: Report) => void;
  onDeleteReport: (reportId: string) => void;
}

export function AdminPanel({ 
  pets, 
  users, 
  reports, 
  onBack,
  onUpdatePet,
  onDeletePet,
  onUpdateUser,
  onUpdateReport,
  onDeleteReport
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

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

  // Platform settings (stored on backend)
  const [settings, setSettings] = useState({
    requireModeration: true,
    autoArchiveDays: 90,
    maxPhotos: 5,
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
    { id: 'settings' as const, label: 'Настройки', icon: Settings },
  ];

  const renderDashboard = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">Обзор платформы</h2>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Всего объявлений</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalPets}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Активных: {stats.activePets} | В архиве: {stats.archivedPets}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Пользователи</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalUsers}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Заблокировано: {stats.blockedUsers}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Жалобы</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.pendingReports}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Обработано: {stats.resolvedReports}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Успешность</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.successRate.toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Питомцев найдено
          </div>
        </div>
      </div>

      {/* Activity Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Активность</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">За последние 7 дней</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{stats.petsLast7Days}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">За последние 30 дней</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.petsLast30Days}</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Последние объявления</h3>
        <div className="space-y-3">
          {pets.slice(0, 5).map(pet => (
            <div key={pet.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <img src={pet.photos[0]} alt="" className="w-12 h-12 object-cover rounded-lg" />
                <div>
                  <p className="font-medium text-gray-900">{pet.breed || 'Без породы'}</p>
                  <p className="text-sm text-gray-600">{pet.city} · {pet.authorName}</p>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {formatDate(pet.publishedAt)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderUsers = () => {
    // Filter users
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
        <h2 className="text-2xl font-semibold text-gray-900">Управление пользователями</h2>
        
        {/* Filters Panel */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[250px]">
              <label className="block text-xs font-medium text-gray-700 mb-1">Поиск</label>
              <input
                type="text"
                placeholder="Поиск по имени или email..."
                value={usersSearch}
                onChange={(e) => {
                  setUsersSearch(e.target.value);
                  setUsersPage(1);
                }}
                className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="min-w-[180px]">
              <label className="block text-xs font-medium text-gray-700 mb-1">Роль</label>
              <select
                value={usersRoleFilter}
                onChange={(e) => {
                  setUsersRoleFilter(e.target.value);
                  setUsersPage(1);
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Все роли</option>
                <option value="user">Пользователи</option>
                <option value="volunteer">Волонтёры</option>
                <option value="shelter">Приюты</option>
                <option value="admin">Администраторы</option>
              </select>
            </div>

            <div className="min-w-[180px]">
              <label className="block text-xs font-medium text-gray-700 mb-1">Статус</label>
              <select
                value={usersStatusFilter}
                onChange={(e) => {
                  setUsersStatusFilter(e.target.value);
                  setUsersPage(1);
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Все статусы</option>
                <option value="active">Активные</option>
                <option value="blocked">Заблокированные</option>
              </select>
            </div>

            <div className="text-sm text-gray-600 ml-auto">
              Найдено: {filteredUsers.length} пользователей
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Пользователь</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Роль</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Контакты</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Пользователи не найдены
                  </td>
                </tr>
              ) : (
                paginatedUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {user.avatar && (
                          <img src={user.avatar} alt="" className="w-8 h-8 rounded-full shrink-0" />
                        )}
                        <p className="font-medium text-gray-900 text-sm truncate max-w-[120px]">{user.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 truncate max-w-[180px]">{user.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={user.role}
                        onChange={(e) => onUpdateUser({ ...user, role: e.target.value as User['role'] })}
                        className="text-xs px-2 py-1 border border-gray-300 rounded"
                      >
                        <option value="user">Пользователь</option>
                        <option value="volunteer">Волонтёр</option>
                        <option value="shelter">Приют</option>
                        <option value="admin">Админ</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 truncate max-w-[140px]">
                      {user.contacts.phone || user.contacts.telegram || user.contacts.viber || 'Нет'}
                    </td>
                    <td className="px-4 py-3">
                      {user.isBlocked ? (
                        <span className="inline-flex px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 whitespace-nowrap">
                          Заблокирован
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 whitespace-nowrap">
                          Активен
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onUpdateUser({ ...user, isBlocked: !user.isBlocked })}
                        className={`text-sm whitespace-nowrap ${user.isBlocked ? 'text-green-600 hover:text-green-700' : 'text-red-600 hover:text-red-700'}`}
                      >
                        {user.isBlocked ? 'Разблокировать' : 'Заблокировать'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <button
              onClick={() => setUsersPage(Math.max(1, usersPage - 1))}
              disabled={usersPage === 1}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Назад
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Страница {usersPage} из {totalPages}
              </span>
              <span className="text-xs text-gray-500">
                ({filteredUsers.length} всего)
              </span>
            </div>
            <button
              onClick={() => setUsersPage(Math.min(totalPages, usersPage + 1))}
              disabled={usersPage >= totalPages}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
        <h2 className="text-2xl font-semibold text-gray-900">Жалобы</h2>
        
        {/* Filters Panel */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-700 mb-1">Статус жалобы</label>
              <select
                value={reportsStatusFilter}
                onChange={(e) => {
                  setReportsStatusFilter(e.target.value);
                  setReportsPage(1);
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Все статусы</option>
                <option value="pending">Новые</option>
                <option value="reviewed">Проверенные</option>
                <option value="resolved">Решённые</option>
                <option value="dismissed">Отклонённые</option>
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-700 mb-1">Причина жалобы</label>
              <select
                value={reportsReasonFilter}
                onChange={(e) => {
                  setReportsReasonFilter(e.target.value);
                  setReportsPage(1);
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

            <div className="text-sm text-gray-600 ml-auto">
              Найдено: {filteredReports.length} жалоб
            </div>
          </div>
        </div>

      <div className="space-y-4">
        {paginatedReports.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <p className="text-gray-500">Жалобы не найдены</p>
          </div>
        ) : (
          paginatedReports.map(report => {
            const pet = pets.find(p => p.id === report.petId);
            return (
              <div key={report.id} className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        report.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                        report.status === 'resolved' ? 'bg-green-100 text-green-700' :
                        report.status === 'dismissed' ? 'bg-gray-100 text-gray-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {report.status === 'pending' ? 'Новая' : 
                         report.status === 'resolved' ? 'Решена' : 
                         report.status === 'dismissed' ? 'Отклонена' : 'Проверена'}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{reportReasonLabels[report.reason]}</span>
                    </div>
                    
                    <p className="font-medium text-gray-900 mb-1">
                      От: {report.reporterName}
                    </p>
                    <p className="text-sm text-gray-600 mb-3">{report.description}</p>
                    
                    {pet && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <img src={pet.photos[0]} alt="" className="w-12 h-12 object-cover rounded-lg" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{pet.breed || 'Без породы'}</p>
                          <p className="text-xs text-gray-600">{pet.city} · {pet.authorName}</p>
                        </div>
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500 mt-2">
                      {formatDate(report.createdAt)}
                    </p>
                  </div>

                  <div className="flex sm:flex-col gap-2">
                    {report.status === 'pending' && (
                      <>
                        <button
                          onClick={() => onUpdateReport({ ...report, status: 'resolved', reviewedAt: new Date() })}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Решить"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => onUpdateReport({ ...report, status: 'dismissed', reviewedAt: new Date() })}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
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
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
            className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Назад
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Страница {reportsPage} из {totalPages}
            </span>
            <span className="text-xs text-gray-500">
              ({filteredReports.length} всего)
            </span>
          </div>
          <button
            onClick={() => setReportsPage(Math.min(totalPages, reportsPage + 1))}
            disabled={reportsPage >= totalPages}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Вперед
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
  };

  const renderSettings = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">Настройки платформы</h2>
      
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Общие настройки</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Требуется ли модерация новых объявлений
            </label>
            <select
              value={settings.requireModeration ? 'yes' : 'no'}
              onChange={(e) => setSettings(s => ({ ...s, requireModeration: e.target.value === 'yes' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="yes">Да, требуется проверка</option>
              <option value="no">Нет, публиковать сразу</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Автоматическая архивация после (дней)
            </label>
            <input 
              type="number"
              min={1}
              max={365}
              value={settings.autoArchiveDays}
              onChange={(e) => setSettings(s => ({ ...s, autoArchiveDays: Math.max(1, parseInt(e.target.value) || 90) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Максимум фото на объявление
            </label>
            <input 
              type="number"
              min={1}
              max={20}
              value={settings.maxPhotos}
              onChange={(e) => setSettings(s => ({ ...s, maxPhotos: Math.max(1, Math.min(20, parseInt(e.target.value) || 5)) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Управление городами</h3>
        <p className="text-sm text-gray-600">
          Список городов настраивается в файле /utils/cities.ts
        </p>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSaveSettings}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Сохранить настройки
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1920px] mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Админ-панель</h1>
                <p className="text-sm text-gray-600 hidden sm:block">Управление платформой</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm">
              <Settings className="w-4 h-4 shrink-0" />
              Режим администратора
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1920px] mx-auto px-4 md:px-6 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1 min-w-max">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label}</span>
                  {tab.id === 'reports' && stats.pendingReports > 0 && (
                    <span className="px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded-full text-xs font-medium">
                      {stats.pendingReports}
                    </span>
                  )}
                  {tab.id === 'moderation' && pets.filter(p => p.moderationStatus === 'pending').length > 0 && (
                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded-full text-xs font-medium">
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
      <div className="max-w-[1920px] mx-auto px-4 md:px-6 py-6">
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
        {activeTab === 'pets' && <PetsAdminPanel pets={pets} onDeletePet={onDeletePet} />}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'reports' && renderReports()}
        {activeTab === 'settings' && renderSettings()}
      </div>
    </div>
  );
}
