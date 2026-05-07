import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { MoreHorizontal, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Footer } from '../components/layout/Footer';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { PageLoader } from '../components/ui/page-loader';
import { cn } from '../components/ui/utils';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import {
  sheltersApi,
  type ShelterMemberResponse,
  type ShelterMemberRole,
  type ShelterResponse,
} from '../api/client';
import {
  applySeo,
  canonicalUrlFromPath,
  SEO_KEYWORDS,
  SEO_ROBOTS_PRIVATE,
} from '../utils/seo';
import { appOutlineCtaClass, appPrimaryCtaClass } from '../styles/cta-classes';
import { BackQuickMenu } from '../components/navigation/BackQuickMenu';

function sortMembers(rows: ShelterMemberResponse[]): ShelterMemberResponse[] {
  const roleRank = (r: ShelterMemberRole) =>
    r === 'owner' ? 0 : r === 'manager' ? 1 : 2;
  return [...rows].sort((a, b) => {
      const rr = roleRank(a.role) - roleRank(b.role);
      if (rr !== 0) return rr;
      const na = (a.user_name ?? a.user_email ?? a.user_id ?? '').toLowerCase();
      const nb = (b.user_name ?? b.user_email ?? b.user_id ?? '').toLowerCase();
      return na.localeCompare(nb);
    });
}

export default function MyShelterTeamPage() {
  const { shelterId } = useParams<{ shelterId: string }>();
  const { user } = useAuth();
  const { t } = useI18n();
  const tm = t.myShelterTeam;

  const [shelter, setShelter] = useState<ShelterResponse | null>(null);
  const [members, setMembers] = useState<ShelterMemberResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteUserId, setInviteUserId] = useState('');
  const [inviteRole, setInviteRole] = useState<'manager' | 'volunteer'>('volunteer');
  const [inviting, setInviting] = useState(false);

  const reload = useCallback(async () => {
    if (!shelterId) return;
    setLoading(true);
    setForbidden(false);
    setNotFound(false);
    try {
      const [s, list] = await Promise.all([
        sheltersApi.get(shelterId),
        sheltersApi.members(shelterId),
      ]);
      setShelter(s);
      setMembers(list);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (/\(403\)|\b403\b|доступ|forbidden|Access|not.*permit/i.test(msg)) {
        setForbidden(true);
      } else if (/\(404\)|\b404\b|не найден|not found/i.test(msg)) {
        setNotFound(true);
      } else {
        toast.error(tm.loadError);
      }
      setShelter(null);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [shelterId, tm.loadError]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    applySeo({
      title: `${tm.title} — DorogaDomoy.by`,
      description: tm.subtitle,
      canonicalUrl: canonicalUrlFromPath(shelterId ? `/my-shelters/${shelterId}/team` : '/my-shelters'),
      robots: SEO_ROBOTS_PRIVATE,
      keywords: SEO_KEYWORDS,
    });
  }, [tm.title, tm.subtitle, shelterId]);

  const myMembership = useMemo(
    () => (user ? members.find((m) => m.user_id === user.id) : undefined),
    [members, user],
  );

  const canManage = useMemo(() => {
    if (!user || !shelter) return false;
    if (user.role === 'admin') return true;
    if (shelter.owner_user_id === user.id) return true;
    if (!myMembership || myMembership.status !== 'active') return false;
    return myMembership.role === 'owner' || myMembership.role === 'manager';
  }, [myMembership, shelter, user]);

  const visibleMembers = useMemo(
    () => sortMembers(members.filter((m) => m.status !== 'removed')),
    [members],
  );

  const roleLabel = useCallback(
    (role: ShelterMemberRole) => {
      switch (role) {
        case 'owner':
          return tm.roleOwner;
        case 'manager':
          return tm.roleManager;
        default:
          return tm.roleVolunteer;
      }
    },
    [tm.roleManager, tm.roleOwner, tm.roleVolunteer],
  );

  const statusLabel = useCallback(
    (st: ShelterMemberResponse['status']) => {
      switch (st) {
        case 'invited':
          return tm.statusInvited;
        case 'active':
          return tm.statusActive;
        default:
          return tm.statusRemoved;
      }
    },
    [tm.statusActive, tm.statusInvited, tm.statusRemoved],
  );

  const onInvite = async () => {
    if (!shelterId) return;
    const email = inviteEmail.trim();
    const uid = inviteUserId.trim();
    if (!email && !uid) {
      toast.error(tm.inviteNeedEmail);
      return;
    }
    setInviting(true);
    try {
      await sheltersApi.inviteMember(shelterId, {
        role: inviteRole,
        ...(uid ? { user_id: uid } : { email }),
      });
      toast.success(tm.inviteSuccess);
      setInviteEmail('');
      setInviteUserId('');
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tm.inviteError);
    } finally {
      setInviting(false);
    }
  };

  const onAccept = async (membershipId: string) => {
    if (!shelterId) return;
    try {
      await sheltersApi.acceptMemberInvite(shelterId, membershipId);
      toast.success(tm.acceptSuccess);
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tm.acceptError);
    }
  };

  const onRemove = async (m: ShelterMemberResponse) => {
    if (!shelterId || m.role === 'owner') return;
    const ok = confirm(m.status === 'invited' ? tm.cancelInviteConfirm : tm.removeConfirm);
    if (!ok) return;
    try {
      await sheltersApi.removeMember(shelterId, m.id);
      toast.success(tm.removeSuccess);
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tm.removeError);
    }
  };

  const onRoleChange = async (m: ShelterMemberResponse, next: ShelterMemberRole) => {
    if (!shelterId || m.role === 'owner' || next === m.role) return;
    try {
      await sheltersApi.updateMember(shelterId, m.id, { role: next });
      toast.success(tm.roleUpdated);
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tm.roleUpdateError);
    }
  };

  if (!shelterId) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background pb-24 md:pb-8 dark:bg-gray-950">
        <Header showCitySelector />
        <main className="flex-1 py-10">
          <PageLoader />
        </main>
        <Footer />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col bg-background pb-24 md:pb-8 dark:bg-gray-950">
        <Header showCitySelector />
        <main className="flex-1 px-4 py-10">
          <p className="text-center text-muted-foreground">{tm.notFound}</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="flex min-h-screen flex-col bg-background pb-24 md:pb-8 dark:bg-gray-950">
        <Header showCitySelector />
        <main className="flex-1 px-4 py-10">
          <p className="text-center text-muted-foreground">{tm.accessDenied}</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24 md:pb-8 dark:bg-gray-950">
      <Header showCitySelector />
      <main className="flex-1 py-6 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <BackQuickMenu />
          </div>

          <div className="mb-6 rounded-2xl border border-border bg-card p-4 sm:mb-8 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h1 className="flex flex-wrap items-center gap-2 text-xl font-bold text-foreground sm:text-2xl">
                  <Users className="size-6 shrink-0 text-primary" aria-hidden />
                  {shelter?.name ?? '—'}
                  <span className="text-base font-semibold text-muted-foreground sm:ml-1">
                    · {tm.title}
                  </span>
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{tm.subtitle}</p>
              </div>
            </div>
          </div>

          {canManage ? (
            <div className="mb-6 rounded-2xl border border-border bg-card p-4 sm:mb-8 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">{tm.inviteTitle}</h2>
              </div>
              <div className="grid gap-3 lg:grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_minmax(160px,auto)_auto]">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-muted-foreground">{tm.inviteEmail}</span>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="rounded-lg border border-border bg-background px-3 py-2"
                    autoComplete="off"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-muted-foreground">{tm.inviteUserId}</span>
                  <input
                    value={inviteUserId}
                    onChange={(e) => setInviteUserId(e.target.value)}
                    className="rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs"
                    placeholder="uuid…"
                    autoComplete="off"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-muted-foreground">{tm.inviteRole}</span>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'manager' | 'volunteer')}
                    className="rounded-lg border border-border bg-background px-3 py-2"
                  >
                    <option value="manager">{tm.roleManager}</option>
                    <option value="volunteer">{tm.roleVolunteer}</option>
                  </select>
                </label>
                <div className="flex items-end">
                  <Button
                    type="button"
                    className={cn('w-full', appPrimaryCtaClass)}
                    disabled={inviting}
                    onClick={onInvite}
                  >
                    {tm.inviteSubmit}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="hidden grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-border bg-muted/40 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:grid">
              <span>{tm.colMember}</span>
              <span>{tm.colRole}</span>
              <span>{tm.colStatus}</span>
              <span className="text-right">{tm.colActions}</span>
            </div>
            {visibleMembers.length === 0 ? (
              <p className="px-4 py-12 text-center text-sm text-muted-foreground">{tm.empty}</p>
            ) : (
              <ul className="divide-y divide-border">
                {visibleMembers.map((m) => {
                  const isSelf = user?.id === m.user_id;
                  const label =
                    m.user_name ||
                    m.user_email ||
                    (m.user_id ? `${m.user_id.slice(0, 8)}…` : '—');
                  const showAccept = isSelf && m.status === 'invited';
                  const showManage =
                    canManage && m.role !== 'owner' && (m.status === 'active' || m.status === 'invited');
                  const hasActions = showAccept || showManage;

                  return (
                    <li key={m.id} className="flex flex-col gap-3 px-4 py-4 sm:grid sm:grid-cols-[1fr_auto_auto_auto] sm:items-center sm:gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">
                          {label}
                          {isSelf ? (
                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                              ({tm.you})
                            </span>
                          ) : null}
                        </p>
                        {m.user_email ? (
                          <p className="truncate text-xs text-muted-foreground">{m.user_email}</p>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:justify-center">
                        {m.role === 'owner' ? (
                          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                            {roleLabel(m.role)}
                          </span>
                        ) : showManage ? (
                          <select
                            value={m.role}
                            onChange={(e) =>
                              onRoleChange(m, e.target.value as ShelterMemberRole)
                            }
                            className="rounded-lg border border-border bg-background px-2 py-1 text-sm"
                          >
                            <option value="manager">{tm.roleManager}</option>
                            <option value="volunteer">{tm.roleVolunteer}</option>
                          </select>
                        ) : (
                          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                            {roleLabel(m.role)}
                          </span>
                        )}
                      </div>

                      <div className="sm:text-center">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
                            m.status === 'invited' &&
                              'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200',
                            m.status === 'active' &&
                              'bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-200',
                          )}
                        >
                          {statusLabel(m.status)}
                        </span>
                      </div>

                      <div className="flex justify-end">
                        {hasActions ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="inline-flex size-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                aria-label={tm.colActions}
                              >
                                <MoreHorizontal className="size-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              {showAccept ? (
                                <DropdownMenuItem onClick={() => onAccept(m.id)}>
                                  {tm.acceptInvite}
                                </DropdownMenuItem>
                              ) : null}
                              {showManage ? (
                                <DropdownMenuItem onClick={() => onRemove(m)}>
                                  {m.status === 'invited' ? tm.cancelInvite : tm.removeMember}
                                </DropdownMenuItem>
                              ) : null}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
