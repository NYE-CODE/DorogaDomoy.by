import { useMemo, useState } from 'react';
import { Edit2, Plus, Save, Trash2 } from 'lucide-react';
import { API_BASE, type Partner, type PartnerAd, type PartnerAdCreatePayload } from '../api/client';
import { useI18n } from '../context/I18nContext';
import { adm } from './admin-panel-chrome';
import { AdminModalShell } from './admin/admin-modal-shell';
import { PARTNER_AD_PLACEMENTS, type PartnerAdPlacement } from '@/shared/lib/partner-ad-placements';
import { Switch } from './ui/switch';

export interface AdminPartnerAdsPanelProps {
  partnerAds: PartnerAd[];
  partners: Partner[];
  onCreate: (data: PartnerAdCreatePayload) => void;
  onUpdate: (id: string, data: Partial<PartnerAdCreatePayload>) => void;
  onDelete: (id: string) => void;
}

function bannerSrc(url: string): string {
  return url.startsWith('http') || url.startsWith('data:') ? url : `${API_BASE}${url}`;
}

function formatPeriod(ad: PartnerAd, openLabel: string): string {
  const start = ad.starts_at ? new Date(ad.starts_at).toLocaleDateString() : null;
  const end = ad.ends_at ? new Date(ad.ends_at).toLocaleDateString() : null;
  if (start && end) return `${start} — ${end}`;
  if (start) return `${start} — …`;
  if (end) return `… — ${end}`;
  return openLabel;
}

function toDatetimeLocal(value?: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const d = new Date(trimmed);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

type EditState = PartnerAd | 'create' | null;

const emptyForm = () => ({
  title: '',
  partnerId: '',
  sponsorLabel: '',
  imageDesktop: '',
  imageMobile: '',
  linkUrl: '',
  altText: '',
  placements: [] as PartnerAdPlacement[],
  priority: 0,
  startsAt: '',
  endsAt: '',
  isActive: true,
});

export function AdminPartnerAdsPanel({
  partnerAds,
  partners,
  onCreate,
  onUpdate,
  onDelete,
}: AdminPartnerAdsPanelProps) {
  const { t } = useI18n();
  const ap = t.adminPanel.partnerAds;

  const [editing, setEditing] = useState<EditState>(null);
  const [form, setForm] = useState(emptyForm);

  const placementLabels = useMemo(
    () => ap.placement as Record<PartnerAdPlacement, string>,
    [ap.placement],
  );

  const openCreate = () => {
    setEditing('create');
    setForm(emptyForm());
  };

  const openEdit = (ad: PartnerAd) => {
    setEditing(ad);
    setForm({
      title: ad.title,
      partnerId: ad.partner_id ?? '',
      sponsorLabel: ad.sponsor_label ?? '',
      imageDesktop: ad.image_desktop,
      imageMobile: ad.image_mobile ?? '',
      linkUrl: ad.link_url,
      altText: ad.alt_text ?? '',
      placements: (ad.placements ?? []).filter((p): p is PartnerAdPlacement =>
        PARTNER_AD_PLACEMENTS.includes(p as PartnerAdPlacement),
      ),
      priority: ad.priority ?? 0,
      startsAt: toDatetimeLocal(ad.starts_at),
      endsAt: toDatetimeLocal(ad.ends_at),
      isActive: ad.is_active,
    });
  };

  const togglePlacement = (placement: PartnerAdPlacement) => {
    setForm((f) => ({
      ...f,
      placements: f.placements.includes(placement)
        ? f.placements.filter((p) => p !== placement)
        : [...f.placements, placement],
    }));
  };

  const handleSave = () => {
    const payload: PartnerAdCreatePayload = {
      title: form.title.trim(),
      partner_id: form.partnerId.trim() || null,
      sponsor_label: form.sponsorLabel.trim() || null,
      image_desktop: form.imageDesktop.trim(),
      image_mobile: form.imageMobile.trim() || null,
      link_url: form.linkUrl.trim(),
      alt_text: form.altText.trim() || null,
      placements: form.placements,
      priority: form.priority,
      starts_at: fromDatetimeLocal(form.startsAt),
      ends_at: fromDatetimeLocal(form.endsAt),
      is_active: form.isActive,
    };

    if (editing === 'create') {
      onCreate(payload);
    } else if (editing && editing !== 'create') {
      onUpdate(editing.id, payload);
    }
    setEditing(null);
  };

  const canSave =
    form.title.trim().length > 0 &&
    form.imageDesktop.trim().length > 0 &&
    form.linkUrl.trim().length > 0 &&
    form.placements.length > 0;

  return (
    <div className={adm.page}>
      <div className={adm.headerRow}>
        <div className={adm.headerText}>
          <h2 className={adm.title}>{ap.title}</h2>
        </div>
        <button type="button" onClick={openCreate} className={adm.primaryBtn}>
          <Plus className="size-4" /> {ap.add}
        </button>
      </div>

      <div className={adm.tableShell}>
        <div className={adm.tableWrap}>
          <table className={`${adm.table} min-w-[900px]`}>
            <thead className={adm.thead}>
              <tr>
                <th className={adm.th}>{ap.colTitle}</th>
                <th className={adm.th}>{ap.colPartner}</th>
                <th className={adm.th}>{ap.colPlacements}</th>
                <th className={adm.th}>{ap.colPeriod}</th>
                <th className={adm.th}>{ap.colPriority}</th>
                <th className={adm.th}>{ap.colStatus}</th>
                <th className={adm.th}>{ap.colActions}</th>
              </tr>
            </thead>
            <tbody className={adm.tbody}>
              {partnerAds.length === 0 ? (
                <tr>
                  <td colSpan={7} className={adm.tdEmpty}>
                    {ap.empty}
                  </td>
                </tr>
              ) : (
                partnerAds.map((ad) => (
                  <tr key={ad.id} className={adm.tr}>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{ad.title}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {ad.partner_name || ap.noPartner}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex max-w-xs flex-wrap gap-1">
                        {ad.placements.map((p) => (
                          <span
                            key={p}
                            className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                          >
                            {placementLabels[p as PartnerAdPlacement] ?? p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatPeriod(ad, ap.periodOpen)}
                    </td>
                    <td className="px-4 py-3 text-sm tabular-nums">{ad.priority}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs ${
                          ad.is_active
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {ad.is_active ? ap.statusActive : ap.statusInactive}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(ad)}
                          className="rounded p-1.5 text-primary transition-colors hover:bg-primary/10"
                          title={t.common.edit}
                        >
                          <Edit2 className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(ap.deleteConfirm)) onDelete(ad.id);
                          }}
                          className="rounded p-1.5 text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                          title={t.common.delete}
                        >
                          <Trash2 className="size-4" />
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
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing === 'create' ? ap.modalAdd : ap.modalEdit}
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="rounded-lg border border-border px-4 py-3 text-sm text-foreground/90 hover:bg-accent"
            >
              {t.common.cancel}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Save className="size-4" /> {t.common.save}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground/90">{ap.fieldTitle}</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder={ap.fieldTitlePlaceholder}
              className="w-full rounded-lg border border-border px-3 py-2.5 dark:bg-muted dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground/90">{ap.fieldPartner}</label>
            <select
              value={form.partnerId}
              onChange={(e) => setForm((f) => ({ ...f, partnerId: e.target.value }))}
              className="w-full rounded-lg border border-border px-3 py-2.5 dark:bg-muted dark:text-white"
            >
              <option value="">{ap.fieldPartnerNone}</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground/90">{ap.fieldSponsorLabel}</label>
            <input
              type="text"
              value={form.sponsorLabel}
              onChange={(e) => setForm((f) => ({ ...f, sponsorLabel: e.target.value }))}
              className="w-full rounded-lg border border-border px-3 py-2.5 dark:bg-muted dark:text-white"
            />
            <p className="mt-1 text-xs text-muted-foreground">{ap.fieldSponsorLabelHint}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground/90">{ap.fieldImageDesktop}</label>
              <input
                type="text"
                value={form.imageDesktop}
                onChange={(e) => setForm((f) => ({ ...f, imageDesktop: e.target.value }))}
                placeholder="https://..."
                className="w-full rounded-lg border border-border px-3 py-2.5 dark:bg-muted dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground/90">{ap.fieldImageMobile}</label>
              <input
                type="text"
                value={form.imageMobile}
                onChange={(e) => setForm((f) => ({ ...f, imageMobile: e.target.value }))}
                placeholder="https://..."
                className="w-full rounded-lg border border-border px-3 py-2.5 dark:bg-muted dark:text-white"
              />
              <p className="mt-1 text-xs text-muted-foreground">{ap.fieldImageMobileHint}</p>
            </div>
          </div>

          {form.imageDesktop.trim() ? (
            <img
              src={bannerSrc(form.imageDesktop.trim())}
              alt=""
              className="max-h-24 w-full rounded-md border border-border object-contain bg-muted/30 p-2"
            />
          ) : null}

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground/90">{ap.fieldLink}</label>
            <input
              type="url"
              value={form.linkUrl}
              onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
              className="w-full rounded-lg border border-border px-3 py-2.5 dark:bg-muted dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground/90">{ap.fieldAlt}</label>
            <input
              type="text"
              value={form.altText}
              onChange={(e) => setForm((f) => ({ ...f, altText: e.target.value }))}
              className="w-full rounded-lg border border-border px-3 py-2.5 dark:bg-muted dark:text-white"
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-foreground/90">{ap.fieldPlacements}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {PARTNER_AD_PLACEMENTS.map((placement) => (
                <label key={placement} className="flex items-center gap-2 text-sm text-foreground/90">
                  <input
                    type="checkbox"
                    checked={form.placements.includes(placement)}
                    onChange={() => togglePlacement(placement)}
                    className="size-4 rounded border-border"
                  />
                  <span>{placementLabels[placement]}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground/90">{ap.fieldPriority}</label>
              <input
                type="number"
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) || 0 }))}
                className="w-full rounded-lg border border-border px-3 py-2.5 dark:bg-muted dark:text-white"
              />
              <p className="mt-1 text-xs text-muted-foreground">{ap.fieldPriorityHint}</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground/90">{ap.fieldStartsAt}</label>
              <input
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
                className="w-full rounded-lg border border-border px-3 py-2.5 dark:bg-muted dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground/90">{ap.fieldEndsAt}</label>
              <input
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
                className="w-full rounded-lg border border-border px-3 py-2.5 dark:bg-muted dark:text-white"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 text-sm text-foreground/90">
            <Switch checked={form.isActive} onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
            <span>{ap.fieldActive}</span>
          </label>
        </div>
      </AdminModalShell>
    </div>
  );
}
