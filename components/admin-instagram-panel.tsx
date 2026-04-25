import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  instagramApi,
  settingsApi,
  type InstagramAccountResponse,
  type InstagramPublicationResponse,
  type InstagramRegionRouteResponse,
  type PlatformSettings,
} from '../api/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { useI18n } from '../context/I18nContext';

type PublicationFilter = 'all' | 'pending' | 'processing' | 'published' | 'failed' | 'cancelled';

interface AccountFormState {
  name: string;
  instagramBusinessId: string;
  facebookPageId: string;
  accessToken: string;
  isActive: boolean;
}

const emptyAccountForm: AccountFormState = {
  name: '',
  instagramBusinessId: '',
  facebookPageId: '',
  accessToken: '',
  isActive: true,
};

function asBool(raw?: string, fallback = false): boolean {
  if (!raw) return fallback;
  return raw === 'true' || raw === '1' || raw.toLowerCase() === 'yes';
}

export function AdminInstagramPanel() {
  const { t } = useI18n();
  const ig = t.adminPanel.instagram;
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  const [accounts, setAccounts] = useState<InstagramAccountResponse[]>([]);
  const [routes, setRoutes] = useState<InstagramRegionRouteResponse[]>([]);
  const [publications, setPublications] = useState<InstagramPublicationResponse[]>([]);

  const [publicationFilter, setPublicationFilter] = useState<PublicationFilter>('all');
  const [manualPetId, setManualPetId] = useState('');

  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [accountForm, setAccountForm] = useState<AccountFormState>(emptyAccountForm);

  const [routeRegion, setRouteRegion] = useState('');
  const [routeAccountId, setRouteAccountId] = useState('');
  const [routeFallback, setRouteFallback] = useState(false);

  const [instagramAutopublishEnabled, setInstagramAutopublishEnabled] = useState(false);
  const [instagramStoryEnabled, setInstagramStoryEnabled] = useState(true);
  const [instagramManualWhenAutoOff, setInstagramManualWhenAutoOff] = useState(true);

  const publicationStatusOptions = useMemo(
    () => ['all', 'pending', 'processing', 'published', 'failed', 'cancelled'] as const,
    [],
  );

  const refreshAll = async () => {
    const [nextAccounts, nextRoutes, nextPublications, settings] = await Promise.all([
      instagramApi.listAccounts(),
      instagramApi.listRoutes(),
      instagramApi.listPublications({ limit: 200 }),
      settingsApi.get(),
    ]);
    setAccounts(nextAccounts);
    setRoutes(nextRoutes);
    setPublications(nextPublications);
    setInstagramAutopublishEnabled(asBool(settings.instagram_autopublish_enabled, false));
    setInstagramStoryEnabled(asBool(settings.instagram_story_enabled, true));
    setInstagramManualWhenAutoOff(asBool(settings.instagram_manual_when_auto_off, true));
  };

  useEffect(() => {
    setLoading(true);
    refreshAll()
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : ig.loadError);
      })
      .finally(() => setLoading(false));
  }, []);

  const resetAccountForm = () => {
    setEditingAccountId(null);
    setAccountForm(emptyAccountForm);
  };

  const beginEditAccount = (row: InstagramAccountResponse) => {
    setEditingAccountId(row.id);
    setAccountForm({
      name: row.name,
      instagramBusinessId: row.instagram_business_id,
      facebookPageId: row.facebook_page_id || '',
      accessToken: '',
      isActive: row.is_active,
    });
  };

  const handleAccountSubmit = async () => {
    if (!accountForm.name.trim() || !accountForm.instagramBusinessId.trim()) {
      toast.error(ig.validationAccountRequired);
      return;
    }
    setBusy(true);
    try {
      if (!editingAccountId) {
        await instagramApi.createAccount({
          name: accountForm.name.trim(),
          instagram_business_id: accountForm.instagramBusinessId.trim(),
          facebook_page_id: accountForm.facebookPageId.trim() || undefined,
          access_token: accountForm.accessToken.trim() || undefined,
          is_active: accountForm.isActive,
        });
        toast.success(ig.accountAdded);
      } else {
        await instagramApi.updateAccount(editingAccountId, {
          name: accountForm.name.trim(),
          instagram_business_id: accountForm.instagramBusinessId.trim(),
          facebook_page_id: accountForm.facebookPageId.trim() || null,
          access_token: accountForm.accessToken.trim() || undefined,
          is_active: accountForm.isActive,
        });
        toast.success(ig.accountUpdated);
      }
      await refreshAll();
      resetAccountForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ig.accountSaveError);
    } finally {
      setBusy(false);
    }
  };

  const handleCreateRoute = async () => {
    if (!routeRegion.trim() || !routeAccountId) {
      toast.error(ig.validationRouteRequired);
      return;
    }
    setBusy(true);
    try {
      await instagramApi.createRoute({
        region_key: routeRegion.trim(),
        account_id: routeAccountId,
        is_fallback: routeFallback,
      });
      toast.success(ig.routeAdded);
      setRouteRegion('');
      setRouteAccountId('');
      setRouteFallback(false);
      await refreshAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ig.routeCreateError);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteRoute = async (routeId: string) => {
    setBusy(true);
    try {
      await instagramApi.deleteRoute(routeId);
      toast.success(ig.routeDeleted);
      await refreshAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ig.routeDeleteError);
    } finally {
      setBusy(false);
    }
  };

  const toggleRouteFallback = async (row: InstagramRegionRouteResponse, value: boolean) => {
    setBusy(true);
    try {
      await instagramApi.updateRoute(row.id, {
        account_id: row.account_id,
        is_fallback: value,
      });
      toast.success(ig.routeUpdated);
      await refreshAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ig.routeUpdateError);
    } finally {
      setBusy(false);
    }
  };

  const handleManualQueue = async () => {
    if (!manualPetId.trim()) {
      toast.error(ig.validationPetIdRequired);
      return;
    }
    setBusy(true);
    try {
      await instagramApi.createManualPublication({
        pet_id: manualPetId.trim(),
        format: 'story',
      });
      toast.success(ig.manualAdded);
      setManualPetId('');
      setIsManualModalOpen(false);
      await refreshAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ig.manualAddError);
    } finally {
      setBusy(false);
    }
  };

  const handleQueueAction = async (
    publicationId: string,
    action: 'retry' | 'cancel' | 'publishNow',
  ) => {
    setBusy(true);
    try {
      if (action === 'retry') {
        await instagramApi.retryPublication(publicationId);
      } else if (action === 'cancel') {
        await instagramApi.cancelPublication(publicationId);
      } else {
        await instagramApi.publishNow(publicationId);
      }
      toast.success(ig.queueUpdated);
      await refreshAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ig.queueActionError);
    } finally {
      setBusy(false);
    }
  };

  const saveInstagramSettings = async () => {
    setBusy(true);
    try {
      const payload: Partial<PlatformSettings> = {
        instagram_autopublish_enabled: instagramAutopublishEnabled ? 'true' : 'false',
        instagram_story_enabled: instagramStoryEnabled ? 'true' : 'false',
        instagram_manual_when_auto_off: instagramManualWhenAutoOff ? 'true' : 'false',
      };
      await settingsApi.update(payload);
      toast.success(ig.settingsSaved);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ig.settingsSaveError);
    } finally {
      setBusy(false);
    }
  };

  const visiblePublications =
    publicationFilter === 'all'
      ? publications
      : publications.filter((x) => x.status === publicationFilter);
  const statusLabels: Record<PublicationFilter, string> = {
    all: ig.statusAll,
    pending: ig.statusPending,
    processing: ig.statusProcessing,
    published: ig.statusPublished,
    failed: ig.statusFailed,
    cancelled: ig.statusCancelled,
  };

  if (loading) {
    return (
      <div className="bg-card border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{ig.title}</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {ig.subtitle}
        </p>
      </div>

      <div className="bg-card border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{ig.modeTitle}</h3>
        <div className="mt-4 space-y-4">
          <label className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{ig.modeAutopublish}</span>
            <Switch
              checked={instagramAutopublishEnabled}
              onCheckedChange={setInstagramAutopublishEnabled}
            />
          </label>
          <label className="flex items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{ig.modeStory}</span>
            <Switch checked={instagramStoryEnabled} onCheckedChange={setInstagramStoryEnabled} />
          </label>
          <label className="flex items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{ig.modeManualWhenAutoOff}</span>
            <Switch
              checked={instagramManualWhenAutoOff}
              onCheckedChange={setInstagramManualWhenAutoOff}
            />
          </label>
        </div>
        <button
          className="mt-5 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm font-medium disabled:opacity-60"
          onClick={() => void saveInstagramSettings()}
          disabled={busy}
        >
          {ig.saveSettings}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-card border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{ig.accountsTitle}</h3>
            <button
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs dark:border-gray-700 dark:text-gray-200"
              onClick={resetAccountForm}
              disabled={busy}
            >
              {ig.clearForm}
            </button>
          </div>
          <div className="mt-4 grid gap-3">
            <input
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
              placeholder={ig.accountNamePlaceholder}
              value={accountForm.name}
              onChange={(e) => setAccountForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <input
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
              placeholder={ig.accountBusinessIdPlaceholder}
              value={accountForm.instagramBusinessId}
              onChange={(e) =>
                setAccountForm((prev) => ({ ...prev, instagramBusinessId: e.target.value }))
              }
            />
            <input
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
              placeholder={ig.accountFacebookPageIdPlaceholder}
              value={accountForm.facebookPageId}
              onChange={(e) => setAccountForm((prev) => ({ ...prev, facebookPageId: e.target.value }))}
            />
            <input
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
              placeholder={editingAccountId ? ig.accountTokenUpdatePlaceholder : ig.accountTokenPlaceholder}
              value={accountForm.accessToken}
              onChange={(e) => setAccountForm((prev) => ({ ...prev, accessToken: e.target.value }))}
            />
            <label className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2.5">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{ig.accountActiveLabel}</span>
              <Switch
                checked={accountForm.isActive}
                onCheckedChange={(value) => setAccountForm((prev) => ({ ...prev, isActive: value }))}
              />
            </label>
            <button
              className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm font-medium disabled:opacity-60"
              onClick={() => void handleAccountSubmit()}
              disabled={busy}
            >
              {editingAccountId ? ig.accountSaveButton : ig.accountAddButton}
            </button>
          </div>

          <div className="mt-5 bg-card border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            {accounts.length === 0 ? (
              <div className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">{ig.accountsEmpty}</div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {accounts.map((row) => (
                  <div key={row.id} className="px-4 py-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white truncate">{row.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {ig.accountBusinessIdLabel}: {row.instagram_business_id}
                        </div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {ig.accountTokenLabel}: {row.has_access_token ? ig.accountTokenConfigured : ig.accountTokenMissing} | {row.is_active ? ig.accountStateActive : ig.accountStateInactive}
                        </div>
                      </div>
                      <button
                        className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-xs hover:bg-accent dark:hover:bg-accent"
                        onClick={() => beginEditAccount(row)}
                        disabled={busy}
                      >
                        {ig.editButton}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-card border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{ig.routesTitle}</h3>
          <div className="mt-4 grid gap-3">
            <input
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
              placeholder={ig.routeRegionPlaceholder}
              value={routeRegion}
              onChange={(e) => setRouteRegion(e.target.value)}
            />
            <Select value={routeAccountId} onValueChange={setRouteAccountId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={ig.routeAccountPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <label className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2.5">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{ig.routeFallbackLabel}</span>
              <Switch checked={routeFallback} onCheckedChange={setRouteFallback} />
            </label>
            <button
              className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm font-medium disabled:opacity-60"
              onClick={() => void handleCreateRoute()}
              disabled={busy}
            >
              {ig.routeAddButton}
            </button>
          </div>

          <div className="mt-5 bg-card border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            {routes.length === 0 ? (
              <div className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">{ig.routesEmpty}</div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {routes.map((row) => (
                  <div key={row.id} className="px-4 py-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white truncate">{row.region_key}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{row.account_name}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="inline-flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                          <span>{ig.routeFallbackShort}</span>
                          <Switch
                            checked={row.is_fallback}
                            onCheckedChange={(value) => {
                              void toggleRouteFallback(row, value);
                            }}
                          />
                        </label>
                        <button
                          className="px-2.5 py-1.5 border border-red-300 dark:border-red-900 rounded-lg text-xs text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => {
                            void handleDeleteRoute(row.id);
                          }}
                          disabled={busy}
                        >
                          {ig.deleteButton}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{ig.queueTitle}</h3>
          <div className="flex items-center gap-2">
            <Select value={publicationFilter} onValueChange={(value) => setPublicationFilter(value as PublicationFilter)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {publicationStatusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {statusLabels[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-accent dark:hover:bg-accent"
              onClick={() => {
                void refreshAll();
              }}
              disabled={busy}
            >
              {ig.refreshButton}
            </button>
            <button
              className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 disabled:opacity-60"
              onClick={() => setIsManualModalOpen(true)}
              disabled={busy}
            >
              {ig.addButton}
            </button>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {visiblePublications.map((row) => (
            <div
              key={row.id}
              className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium text-gray-900 dark:text-white">
                  {row.pet_id} • {row.format} • {row.status}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{ig.attemptsLabel}: {row.attempts}</div>
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {ig.accountLabel}: {row.account_name || ig.notAssigned} • {ig.regionLabel}: {row.region_key || '—'}
              </div>
              {row.last_error ? (
                <div className="mt-1 text-xs text-red-600 dark:text-red-300">{row.last_error}</div>
              ) : null}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  className="px-2.5 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-xs hover:bg-accent dark:hover:bg-accent"
                  onClick={() => {
                    void handleQueueAction(row.id, 'publishNow');
                  }}
                  disabled={busy || row.status === 'published' || row.status === 'cancelled'}
                >
                  {ig.publishNowButton}
                </button>
                <button
                  className="px-2.5 py-1 border border-amber-300 dark:border-amber-900 rounded-lg text-xs text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                  onClick={() => {
                    void handleQueueAction(row.id, 'retry');
                  }}
                  disabled={busy || row.status === 'published'}
                >
                  {ig.retryButton}
                </button>
                <button
                  className="px-2.5 py-1 border border-red-300 dark:border-red-900 rounded-lg text-xs text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => {
                    void handleQueueAction(row.id, 'cancel');
                  }}
                  disabled={busy || row.status === 'published' || row.status === 'cancelled'}
                >
                  {ig.cancelButton}
                </button>
              </div>
            </div>
          ))}
          {visiblePublications.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              {ig.queueEmpty}
            </div>
          ) : null}
        </div>
      </div>

      {isManualModalOpen ? (
        <div
          className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4"
          onClick={() => setIsManualModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-card border border-gray-200 dark:border-gray-700 rounded-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{ig.manualModalTitle}</h3>
            <div className="mt-4 space-y-3">
              <input
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
                placeholder={ig.manualPetIdPlaceholder}
                value={manualPetId}
                onChange={(e) => setManualPetId(e.target.value)}
              />
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {ig.manualFormatLabel}: <span className="font-medium text-gray-900 dark:text-white">{ig.manualFormatValue}</span>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-accent dark:hover:bg-accent"
                  onClick={() => setIsManualModalOpen(false)}
                  disabled={busy}
                >
                  {ig.cancelButton}
                </button>
                <button
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 disabled:opacity-60"
                  onClick={() => void handleManualQueue()}
                  disabled={busy}
                >
                  {ig.manualAddButton}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
