import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ExternalLink, Heart, Plus, Save, Trash2, X } from 'lucide-react';
import { helpApi, type HelpDonationTier } from '../api/client';
import { useI18n } from '../context/I18nContext';
import { adm } from './admin-panel-chrome';

type TierEditMode = { mode: 'create' } | { mode: 'edit'; id: string };

export function AdminHelpSectionPanel() {
  const { t } = useI18n();
  const h = t.adminPanel.helpSection;
  const [loading, setLoading] = useState(true);
  const [savingVolunteer, setSavingVolunteer] = useState(false);
  const [volunteerUrl, setVolunteerUrl] = useState('');
  const [tiers, setTiers] = useState<HelpDonationTier[]>([]);
  const [tierEdit, setTierEdit] = useState<TierEditMode | null>(null);
  const [tierLabel, setTierLabel] = useState('');
  const [tierPaymentUrl, setTierPaymentUrl] = useState('');
  const [tierSortOrder, setTierSortOrder] = useState(0);
  const [tierSaving, setTierSaving] = useState(false);

  const tiersSorted = useMemo(
    () => [...tiers].sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label)),
    [tiers],
  );

  const refresh = async () => {
    const cfg = await helpApi.get();
    setVolunteerUrl(cfg.volunteer_url ?? '');
    setTiers(cfg.donation_tiers ?? []);
  };

  useEffect(() => {
    setLoading(true);
    refresh()
      .catch((err) => toast.error(err instanceof Error ? err.message : h.loadError))
      .finally(() => setLoading(false));
  }, []);

  const openCreateTier = () => {
    const nextOrder = tiers.length ? Math.max(...tiers.map((x) => x.sort_order), 0) + 1 : 0;
    setTierEdit({ mode: 'create' });
    setTierLabel('');
    setTierPaymentUrl('');
    setTierSortOrder(nextOrder);
  };

  const openEditTier = (row: HelpDonationTier) => {
    setTierEdit({ mode: 'edit', id: row.id });
    setTierLabel(row.label);
    setTierPaymentUrl(row.payment_url);
    setTierSortOrder(row.sort_order);
  };

  const closeTierModal = () => {
    setTierEdit(null);
    setTierLabel('');
    setTierPaymentUrl('');
    setTierSortOrder(0);
  };

  const saveVolunteerUrl = async () => {
    setSavingVolunteer(true);
    try {
      const res = await helpApi.updateVolunteerUrl(volunteerUrl.trim());
      setVolunteerUrl(res.volunteer_url);
      toast.success(h.volunteerSaved);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : h.saveError);
    } finally {
      setSavingVolunteer(false);
    }
  };

  const saveTier = async () => {
    const label = tierLabel.trim();
    const payment_url = tierPaymentUrl.trim();
    if (!label || !payment_url) {
      toast.error(h.tierValidation);
      return;
    }
    setTierSaving(true);
    try {
      if (tierEdit?.mode === 'create') {
        const row = await helpApi.createDonationTier({
          label,
          payment_url,
          sort_order: tierSortOrder,
        });
        setTiers((prev) => [...prev, row]);
        toast.success(h.tierCreated);
      } else if (tierEdit?.mode === 'edit') {
        const row = await helpApi.updateDonationTier(tierEdit.id, {
          label,
          payment_url,
          sort_order: tierSortOrder,
        });
        setTiers((prev) => prev.map((x) => (x.id === row.id ? row : x)));
        toast.success(h.tierUpdated);
      }
      closeTierModal();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : h.saveError);
    } finally {
      setTierSaving(false);
    }
  };

  const deleteTier = async (id: string) => {
    if (!window.confirm(h.tierDeleteConfirm)) return;
    try {
      await helpApi.deleteDonationTier(id);
      setTiers((prev) => prev.filter((x) => x.id !== id));
      toast.success(h.tierDeleted);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : h.saveError);
    }
  };

  if (loading) {
    return <p className={adm.subtitle}>{h.loading}</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className={adm.title}>{h.title}</h2>
        <p className={adm.subtitle}>{h.hint}</p>
      </div>

      <section className="rounded-xl border border-border bg-white dark:bg-card/50 p-5 space-y-4">
        <h3 className="text-base font-semibold text-foreground">{h.volunteerTitle}</h3>
        <p className="text-sm text-muted-foreground">{h.volunteerHint}</p>
        <label className="block text-sm font-medium text-foreground/90">{h.volunteerUrlLabel}</label>
        <input
          type="url"
          value={volunteerUrl}
          onChange={(e) => setVolunteerUrl(e.target.value.slice(0, 2000))}
          placeholder={h.volunteerUrlPlaceholder}
          className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        <button
          type="button"
          onClick={() => void saveVolunteerUrl()}
          disabled={savingVolunteer}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {savingVolunteer ? h.saving : h.volunteerSave}
        </button>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" />
              {h.donationsTitle}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{h.donationsHint}</p>
          </div>
          <button
            type="button"
            onClick={openCreateTier}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            {h.tierAdd}
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 dark:bg-muted/80">
              <tr>
                <th className={adm.th}>{h.colOrder}</th>
                <th className={adm.th}>{h.colLabel}</th>
                <th className={adm.th}>{h.colPaymentUrl}</th>
                <th className={adm.th}>{h.colActions}</th>
              </tr>
            </thead>
            <tbody>
              {tiersSorted.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    {h.tiersEmpty}
                  </td>
                </tr>
              ) : (
                tiersSorted.map((row) => (
                  <tr key={row.id} className="border-t border-border/60 dark:border-border">
                    <td className="px-4 py-3 text-foreground/90">{row.sort_order}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{row.label}</td>
                    <td className="px-4 py-3 max-w-xs truncate">
                      <a
                        href={row.payment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        {row.payment_url}
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditTier(row)}
                          className="text-sm text-primary hover:underline"
                        >
                          {h.edit}
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteTier(row.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          aria-label={h.delete}
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
      </section>

      {tierEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white dark:bg-card border border-border shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                {tierEdit.mode === 'create' ? h.tierModalAdd : h.tierModalEdit}
              </h3>
              <button type="button" onClick={closeTierModal} className="p-1 rounded hover:bg-muted dark:hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground/90 mb-1">{h.tierLabel}</label>
                <input
                  type="text"
                  value={tierLabel}
                  onChange={(e) => setTierLabel(e.target.value.slice(0, 80))}
                  placeholder={h.tierLabelPlaceholder}
                  className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/90 mb-1">{h.tierPaymentUrl}</label>
                <input
                  type="url"
                  value={tierPaymentUrl}
                  onChange={(e) => setTierPaymentUrl(e.target.value.slice(0, 2000))}
                  placeholder="https://"
                  className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/90 mb-1">{h.tierSortLabel}</label>
                <input
                  type="number"
                  min={0}
                  max={10000}
                  value={tierSortOrder}
                  onChange={(e) => setTierSortOrder(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeTierModal}
                className="px-4 py-2 rounded-lg border border-border text-sm"
              >
                {h.cancel}
              </button>
              <button
                type="button"
                onClick={() => void saveTier()}
                disabled={tierSaving}
                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-50"
              >
                {tierSaving ? h.saving : h.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
