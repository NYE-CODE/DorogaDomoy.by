import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  instagramApi,
  settingsApi,
  type InstagramAccountResponse,
  type InstagramPublicationResponse,
  type InstagramRegionRouteResponse,
  type PlatformSettings,
} from '../../api/client';
import { useI18n } from '../../context/I18nContext';
import {
  buildStatusLabels,
  formatQueueDate,
  queueStatusBadgeClass,
  queueStatusLabel,
} from './admin-instagram-helpers';
import {
  asBool,
  emptyAccountForm,
  INSTAGRAM_QUEUE_PAGE_SIZE,
  publicationStatusOptions,
  type AccountFormState,
  type PublicationFilter,
} from './admin-instagram-types';

export function useAdminInstagramPanel() {
  const { t } = useI18n();
  const ig = t.adminPanel.instagram;
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [queueLoading, setQueueLoading] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  const [accounts, setAccounts] = useState<InstagramAccountResponse[]>([]);
  const [routes, setRoutes] = useState<InstagramRegionRouteResponse[]>([]);
  const [publications, setPublications] = useState<InstagramPublicationResponse[]>([]);
  const [publicationsTotal, setPublicationsTotal] = useState(0);

  const [publicationFilter, setPublicationFilter] = useState<PublicationFilter>('all');
  const [publicationPetFilter, setPublicationPetFilter] = useState('');
  const [queuePage, setQueuePage] = useState(1);
  const [manualPetId, setManualPetId] = useState('');

  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [accountForm, setAccountForm] = useState<AccountFormState>(emptyAccountForm);

  const [routeRegion, setRouteRegion] = useState('');
  const [routeAccountId, setRouteAccountId] = useState('');
  const [routeFallback, setRouteFallback] = useState(false);

  const [instagramAutopublishEnabled, setInstagramAutopublishEnabled] = useState(false);
  const [instagramStoryEnabled, setInstagramStoryEnabled] = useState(true);
  const [instagramManualWhenAutoOff, setInstagramManualWhenAutoOff] = useState(true);

  const statusLabels = useMemo(() => buildStatusLabels(ig), [ig]);

  const fetchQueue = async (
    status: PublicationFilter = publicationFilter,
    page: number = queuePage,
    petId: string = publicationPetFilter,
  ) => {
    setQueueLoading(true);
    try {
      const normalizedPetId = petId.trim();
      const nextPublications = await instagramApi.listPublications({
        status: status === 'all' ? undefined : status,
        pet_id: normalizedPetId || undefined,
        limit: INSTAGRAM_QUEUE_PAGE_SIZE,
        offset: (page - 1) * INSTAGRAM_QUEUE_PAGE_SIZE,
      });
      setPublications(nextPublications.items);
      setPublicationsTotal(nextPublications.total);
    } finally {
      setQueueLoading(false);
    }
  };

  const refreshAll = async () => {
    const [nextAccounts, nextRoutes, settings] = await Promise.all([
      instagramApi.listAccounts(),
      instagramApi.listRoutes(),
      settingsApi.get(),
    ]);
    setAccounts(nextAccounts);
    setRoutes(nextRoutes);
    setInstagramAutopublishEnabled(asBool(settings.instagram_autopublish_enabled, false));
    setInstagramStoryEnabled(asBool(settings.instagram_story_enabled, true));
    setInstagramManualWhenAutoOff(asBool(settings.instagram_manual_when_auto_off, true));
    await fetchQueue();
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
    publicationFilter === 'all' ? publications : publications.filter((x) => x.status === publicationFilter);
  const queueTotalPages = Math.max(1, Math.ceil(publicationsTotal / INSTAGRAM_QUEUE_PAGE_SIZE));

  const applyQueueFilter = (nextFilter: PublicationFilter) => {
    setPublicationFilter(nextFilter);
    setQueuePage(1);
    void fetchQueue(nextFilter, 1, publicationPetFilter);
  };

  const refreshQueueFromFilters = () => {
    const nextPage = 1;
    setQueuePage(nextPage);
    void fetchQueue(publicationFilter, nextPage, publicationPetFilter);
  };

  const goToQueuePage = (page: number) => {
    setQueuePage(page);
    void fetchQueue(publicationFilter, page, publicationPetFilter);
  };

  return {
    t,
    ig,
    loading,
    busy,
    queueLoading,
    isManualModalOpen,
    setIsManualModalOpen,
    accounts,
    routes,
    publications,
    publicationsTotal,
    publicationFilter,
    publicationPetFilter,
    setPublicationPetFilter,
    queuePage,
    manualPetId,
    setManualPetId,
    editingAccountId,
    accountForm,
    setAccountForm,
    routeRegion,
    setRouteRegion,
    routeAccountId,
    setRouteAccountId,
    routeFallback,
    setRouteFallback,
    instagramAutopublishEnabled,
    setInstagramAutopublishEnabled,
    instagramStoryEnabled,
    setInstagramStoryEnabled,
    instagramManualWhenAutoOff,
    setInstagramManualWhenAutoOff,
    publicationStatusOptions,
    statusLabels,
    visiblePublications,
    queueTotalPages,
    resetAccountForm,
    beginEditAccount,
    handleAccountSubmit,
    handleCreateRoute,
    handleDeleteRoute,
    toggleRouteFallback,
    handleManualQueue,
    handleQueueAction,
    saveInstagramSettings,
    applyQueueFilter,
    refreshQueueFromFilters,
    goToQueuePage,
    queueStatusBadgeClass,
    formatQueueDate,
    queueStatusLabel: (status: string) => queueStatusLabel(status, statusLabels),
  };
}
