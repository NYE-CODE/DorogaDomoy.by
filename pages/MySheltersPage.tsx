import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Building2, MoreHorizontal, PawPrint, Pencil, Send, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { EmptyState } from '../components/ui/empty-state';
import { PageLoader } from '../components/ui/page-loader';
import { cn } from '../components/ui/utils';
import { Button } from '../components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';
import {
  sheltersApi,
  type ShelterAnimalFocus,
  type ShelterKind,
  type ShelterModerationStatus,
  type ShelterResponse,
} from '../api/client';
import {
  applySeo,
  canonicalUrlFromPath,
  SEO_KEYWORDS,
  SEO_ROBOTS_PRIVATE,
} from '../utils/seo';
import { appOutlineCtaClass, appPrimaryCtaClass } from '../styles/cta-classes';

export default function MySheltersPage() {
  const { t } = useI18n();
  const ms = t.myShelters;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [list, setList] = useState<ShelterResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    setLoading(true);
    sheltersApi
      .mine()
      .then(setList)
      .catch(() => {
        setList([]);
        toast.error(ms.loadError);
      })
      .finally(() => setLoading(false));
  }, [ms.loadError]);

  useEffect(() => {
    applySeo({
      title: `${ms.title} — DorogaDomoy.by`,
      description: ms.subtitle,
      canonicalUrl: canonicalUrlFromPath('/my-shelters'),
      robots: SEO_ROBOTS_PRIVATE,
      keywords: SEO_KEYWORDS,
    });
  }, [ms.title, ms.subtitle]);

  useEffect(() => {
    reload();
  }, [reload]);

  const openCreate = () => navigate('/my-shelters/new');
  const openEdit = (s: ShelterResponse) => navigate(`/my-shelters/edit/${s.id}`);

  const kindLabel = useCallback(
    (k: ShelterKind) => {
      switch (k) {
        case 'foster':
          return ms.kindFoster;
        case 'other':
          return ms.kindOther;
        case 'vet':
          return ms.kindOther;
        default:
          return ms.kindShelter;
      }
    },
    [ms.kindFoster, ms.kindOther, ms.kindShelter],
  );

  const focusLabel = useCallback(
    (f: ShelterAnimalFocus) => {
      switch (f) {
        case 'dogs':
          return ms.focusDogs;
        case 'cats':
          return ms.focusCats;
        case 'mixed':
        default:
          return ms.focusMixed;
      }
    },
    [ms.focusCats, ms.focusDogs, ms.focusMixed],
  );

  const statusLabel = useCallback(
    (st: ShelterModerationStatus) => {
      switch (st) {
        case 'draft':
          return ms.statusDraft;
        case 'pending':
          return ms.statusPending;
        case 'approved':
          return ms.statusApproved;
        case 'rejected':
          return ms.statusRejected;
        case 'hidden':
          return ms.statusHidden;
        default:
          return st;
      }
    },
    [
      ms.statusApproved,
      ms.statusDraft,
      ms.statusHidden,
      ms.statusPending,
      ms.statusRejected,
    ],
  );

  const handleSubmitModeration = async (id: string) => {
    try {
      await sheltersApi.submit(id);
      toast.success(ms.submitSuccess);
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ms.submitError);
    }
  };

  const renderActionsMenu = (row: ShelterResponse) => {
    const isOwner = user?.id === row.owner_user_id;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex size-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={ms.colActions}
          >
            <MoreHorizontal className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onClick={() => navigate(`/my-shelters/${row.id}/pets`)}>
            <PawPrint className="mr-2 size-4" />
            {ms.petsButton}
          </DropdownMenuItem>
          {isOwner && (
            <DropdownMenuItem onClick={() => navigate(`/my-shelters/${row.id}/team`)}>
              <Users className="mr-2 size-4" />
              {ms.teamButton}
            </DropdownMenuItem>
          )}
          {isOwner && (
            <DropdownMenuItem onClick={() => openEdit(row)}>
              <Pencil className="mr-2 size-4" />
              {ms.editCard}
            </DropdownMenuItem>
          )}
          {isOwner && (row.moderation_status === 'draft' || row.moderation_status === 'rejected') && (
            <DropdownMenuItem onClick={() => void handleSubmitModeration(row.id)}>
              <Send className="mr-2 size-4" />
              {ms.submitModeration}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24 md:pb-8 dark:bg-gray-950">
      <Header showCitySelector />
      <main className="flex-1 py-6 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 rounded-2xl border border-border bg-card p-4 sm:mb-8 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                  <Building2 className="size-7 shrink-0 text-primary" aria-hidden />
                  {ms.title}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">{ms.subtitle}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" className={cn('shrink-0', appPrimaryCtaClass)} onClick={openCreate}>
                  <Building2 className="size-5 shrink-0" aria-hidden />
                  {ms.createCard}
                </Button>
              </div>
            </div>
          </div>

          {loading ? (
            <PageLoader />
          ) : list.length === 0 ? (
            <EmptyState
              title={ms.emptyTitle}
              description={ms.empty}
              icon={<Building2 className="size-7 text-muted-foreground" aria-hidden />}
              action={
                <Button type="button" className={appPrimaryCtaClass} onClick={openCreate}>
                  <Building2 className="size-5 shrink-0" aria-hidden />
                  {ms.createCard}
                </Button>
              }
            />
          ) : (
            <>
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="hidden grid-cols-[minmax(200px,2fr)_minmax(90px,1fr)_minmax(130px,1fr)_minmax(160px,1fr)_auto_auto] gap-4 border-b border-border bg-muted/40 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:grid">
                  <span>{ms.fieldName}</span>
                  <span>{ms.fieldCity}</span>
                  <span>{ms.fieldKind}</span>
                  <span>{ms.fieldAnimalFocus}</span>
                  <span>{ms.colStatus}</span>
                  <span className="text-right">{ms.colActions}</span>
                </div>

                <ul className="divide-y divide-border">
                  {list.map((row) => (
                    <li key={row.id} className="px-4 py-4">
                      <div className="hidden items-center gap-4 lg:grid lg:grid-cols-[minmax(200px,2fr)_minmax(90px,1fr)_minmax(130px,1fr)_minmax(160px,1fr)_auto_auto]">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">{row.name}</p>
                          {row.moderation_reason &&
                          (row.moderation_status === 'rejected' || row.moderation_status === 'hidden') ? (
                            <p className="mt-1 truncate text-xs text-destructive">
                              {ms.moderationReason}: {row.moderation_reason}
                            </p>
                          ) : null}
                        </div>
                        <span className="truncate text-sm text-muted-foreground">{row.city || '—'}</span>
                        <span className="truncate text-sm text-muted-foreground">{kindLabel(row.kind)}</span>
                        <span className="truncate text-sm text-muted-foreground">{focusLabel(row.animal_focus)}</span>
                        <span
                          className={cn(
                            'inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums',
                            row.moderation_status === 'approved' &&
                              'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                            row.moderation_status === 'pending' &&
                              'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
                            row.moderation_status === 'rejected' &&
                              'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
                            (row.moderation_status === 'draft' || row.moderation_status === 'hidden') &&
                              'bg-muted text-muted-foreground',
                          )}
                        >
                          {statusLabel(row.moderation_status)}
                        </span>
                        <div className="flex justify-end">{renderActionsMenu(row)}</div>
                      </div>

                      <div className="space-y-3 lg:hidden">
                        <div>
                          <p className="font-semibold text-foreground">{row.name}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {row.city || '—'} · {kindLabel(row.kind)} · {focusLabel(row.animal_focus)}
                          </p>
                        </div>
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums',
                            row.moderation_status === 'approved' &&
                              'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                            row.moderation_status === 'pending' &&
                              'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
                            row.moderation_status === 'rejected' &&
                              'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
                            (row.moderation_status === 'draft' || row.moderation_status === 'hidden') &&
                              'bg-muted text-muted-foreground',
                          )}
                        >
                          {statusLabel(row.moderation_status)}
                        </span>
                        <div className="flex justify-end">{renderActionsMenu(row)}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
