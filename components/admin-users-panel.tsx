import { useState } from 'react';
import {
  ArrowUpDown,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Edit2,
  Save,
  Trash2,
  XCircle,
} from 'lucide-react';
import { User } from '../context/AuthContext';
import { API_BASE } from '../api/client';
import { BELARUS_MOBILE_PHONE_PLACEHOLDER } from '../utils/belarus-phone';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useI18n } from '../context/I18nContext';
import { adm } from './admin-panel-chrome';
import { AdminTablePagination } from './admin-table-pagination';
import { AdminModalShell } from './admin/admin-modal-shell';

export interface AdminUsersPanelProps {
  users: User[];
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
}

export function AdminUsersPanel({ users, onUpdateUser, onDeleteUser }: AdminUsersPanelProps) {
  const { t } = useI18n();
  const ap = t.adminPanel;

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<User['role']>('user');
  const [editPhone, setEditPhone] = useState('');
  const [editViber, setEditViber] = useState('');

  const [usersSearch, setUsersSearch] = useState('');
  const [usersRoleFilter, setUsersRoleFilter] = useState<string>('all');
  const [usersStatusFilter, setUsersStatusFilter] = useState<string>('all');
  const [usersPage, setUsersPage] = useState(1);
  const usersPerPage = 15;
  const [usersSortBy, setUsersSortBy] = useState<'confirmed' | 'points' | null>(null);
  const [usersSortDir, setUsersSortDir] = useState<'asc' | 'desc'>('desc');

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

  const filteredUsers = users
    .filter((user) => {
      if (usersSearch) {
        return (
          user.name.toLowerCase().includes(usersSearch.toLowerCase()) ||
          user.email.toLowerCase().includes(usersSearch.toLowerCase())
        );
      }
      return true;
    })
    .filter((user) => {
      if (usersRoleFilter !== 'all') return user.role === usersRoleFilter;
      return true;
    })
    .filter((user) => {
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
    'w-full px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground inline-flex items-center gap-1 hover:bg-muted/50 dark:hover:bg-muted/30 transition-colors';

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
              className="w-full px-4 py-2.5 text-sm border border-border dark:bg-muted dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="min-w-[180px]">
            <label className={adm.labelFilter}>{ap.users.role}</label>
            <Select
              value={usersRoleFilter}
              onValueChange={(v) => {
                setUsersRoleFilter(v);
                setUsersPage(1);
              }}
            >
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
            <Select
              value={usersStatusFilter}
              onValueChange={(v) => {
                setUsersStatusFilter(v);
                setUsersPage(1);
              }}
            >
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

          <div className="text-sm text-muted-foreground ml-auto">
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
                paginatedUsers.map((user) => (
                  <tr key={user.id} className={adm.tr}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {user.avatar && (
                          <img
                            src={
                              user.avatar.startsWith('http') || user.avatar.startsWith('data:')
                                ? user.avatar
                                : `${API_BASE}${user.avatar}`
                            }
                            alt=""
                            className="w-8 h-8 rounded-full shrink-0"
                          />
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
                    <td className="px-4 py-3 text-sm text-muted-foreground truncate" title={user.email}>
                      {user.email}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          user.role === 'admin'
                            ? 'bg-primary/10 dark:bg-primary/20 text-primary'
                            : 'bg-muted text-foreground/90'
                        }`}
                      >
                        {user.role === 'admin'
                          ? ap.users.roleAdmin
                          : user.role === 'user'
                            ? ap.users.roleUser
                            : ap.users.roleVolunteer}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-xs text-foreground/90 font-mono truncate"
                      title={user.helperCode || '—'}
                    >
                      {user.helperCode || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground/90">
                      {user.helperConfirmedCount ?? 0}
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground/90">
                      <div>
                        {ap.users.pointsBalance} {user.pointsBalance ?? 0}
                      </div>
                      <div className="text-muted-foreground">
                        {ap.users.pointsEarnedTotal} {user.pointsEarnedTotal ?? 0}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
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
                          {user.isBlocked ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
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

      <AdminModalShell
        open={!!editingUser}
        onClose={() => setEditingUser(null)}
        title={ap.users.modalTitle}
        footer={
          <>
            <button
              onClick={() => setEditingUser(null)}
              className="px-4 py-3 text-sm text-foreground/90 border border-border rounded-lg hover:bg-accent dark:hover:bg-accent"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={handleSaveEditUser}
              className="flex items-center gap-2 px-4 py-3 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              <Save className="w-4 h-4" /> {t.common.save}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-1">{ap.users.name}</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-1">{ap.users.email}</label>
            <input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-1">{ap.users.roleField}</label>
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
            <label className="block text-sm font-medium text-foreground/90 mb-1">{ap.users.phone}</label>
            <input
              type="tel"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              placeholder={BELARUS_MOBILE_PHONE_PLACEHOLDER}
              className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-1">{ap.users.viber}</label>
            <input
              type="text"
              value={editViber}
              onChange={(e) => setEditViber(e.target.value)}
              placeholder={ap.users.viberPlaceholder}
              className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      </AdminModalShell>

      {totalPages > 1 && (
        <AdminTablePagination
          currentPage={usersPage}
          totalPages={totalPages}
          onPageChange={setUsersPage}
          labels={ap.pagination}
          summary={
            <>
              <span className="text-sm text-muted-foreground">
                {ap.users.pageOf(usersPage, totalPages)}
              </span>
              <span className="text-xs text-muted-foreground">
                {ap.users.totalShort(sortedUsers.length)}
              </span>
            </>
          }
        />
      )}
    </div>
  );
}
