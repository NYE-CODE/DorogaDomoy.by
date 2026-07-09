import { useCallback, useEffect, useState } from 'react';
import { Edit2, ExternalLink, MapPin, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { User } from '../context/AuthContext';
import {
  sheltersApi,
  type ShelterAnimalFocus,
  type ShelterKind,
  type ShelterResponse,
} from '../api/client';
import { formatDate } from '../utils/pet-helpers';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useI18n } from '../context/I18nContext';
import { adm } from './admin-panel-chrome';
import { AdminModalShell } from './admin/admin-modal-shell';
import {
  shelterAnimalFocusAdminLabel,
  shelterCatalogStatusLabel,
  shelterKindLabel,
} from './admin-panel-helpers';

export interface AdminSheltersCatalogPanelProps {
  users: User[];
  onRefreshPendingQueue?: () => void;
}

export function AdminSheltersCatalogPanel({
  users,
  onRefreshPendingQueue,
}: AdminSheltersCatalogPanelProps) {
  const { t } = useI18n();
  const ap = t.adminPanel;
  const sc = ap.sheltersCatalog;

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

  const reload = useCallback(() => {
    setShelterAllLoading(true);
    sheltersApi
      .adminListAll()
      .then(setShelterAllList)
      .catch(() => setShelterAllList([]))
      .finally(() => setShelterAllLoading(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

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
      toast.error(sc.validationGeo);
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
                    <span className="inline-flex justify-end gap-1 text-muted-foreground">
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
                      <td className="px-4 py-3 font-medium text-foreground">{row.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.city}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {shelterKindLabel(row.kind, ap.shelters)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {shelterAnimalFocusAdminLabel(row.animal_focus, ap.shelters)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {shelterCatalogStatusLabel(row.moderation_status, sc)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
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
                          <span className="font-mono text-xs text-muted-foreground">{row.owner_user_id}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
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
                                  onRefreshPendingQueue?.();
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

      <AdminModalShell
        open={!!shelterCatalogEdit}
        onClose={() => setShelterCatalogEdit(null)}
        title={sc.modalEditTitle}
        maxWidthClass="max-w-lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShelterCatalogEdit(null)}
              className="px-4 py-3 text-sm text-foreground/90 border border-border rounded-lg hover:bg-accent dark:hover:bg-accent"
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
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-1">{sc.fieldName}</label>
            <input
              type="text"
              value={editScName}
              onChange={(e) => setEditScName(e.target.value)}
              className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground/90 mb-1">{sc.fieldKind}</label>
              <Select value={editScKind} onValueChange={(v) => setEditScKind(v as ShelterKind)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shelter">{shelterKindLabel('shelter', ap.shelters)}</SelectItem>
                  <SelectItem value="foster">{shelterKindLabel('foster', ap.shelters)}</SelectItem>
                  <SelectItem value="other">{shelterKindLabel('other', ap.shelters)}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/90 mb-1">{sc.fieldFocus}</label>
              <Select value={editScFocus} onValueChange={(v) => setEditScFocus(v as ShelterAnimalFocus)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mixed">{shelterAnimalFocusAdminLabel('mixed', ap.shelters)}</SelectItem>
                  <SelectItem value="dogs">{shelterAnimalFocusAdminLabel('dogs', ap.shelters)}</SelectItem>
                  <SelectItem value="cats">{shelterAnimalFocusAdminLabel('cats', ap.shelters)}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-1">{sc.fieldDescription}</label>
            <textarea
              value={editScDescription}
              onChange={(e) => setEditScDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-y min-h-[96px]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-1">{sc.fieldCity}</label>
            <input
              type="text"
              value={editScCity}
              onChange={(e) => setEditScCity(e.target.value)}
              className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-1">{sc.fieldAddress}</label>
            <input
              type="text"
              value={editScAddress}
              onChange={(e) => setEditScAddress(e.target.value)}
              className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground/90 mb-1">{sc.fieldLat}</label>
              <input
                type="text"
                inputMode="decimal"
                value={editScLat}
                onChange={(e) => setEditScLat(e.target.value)}
                className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/90 mb-1">{sc.fieldLng}</label>
              <input
                type="text"
                inputMode="decimal"
                value={editScLng}
                onChange={(e) => setEditScLng(e.target.value)}
                className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground/90 mb-1">{sc.fieldLogo}</label>
              <input
                type="text"
                value={editScLogo}
                onChange={(e) => setEditScLogo(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/90 mb-1">{sc.fieldCover}</label>
              <input
                type="text"
                value={editScCover}
                onChange={(e) => setEditScCover(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
          <p className="text-xs font-medium text-muted-foreground">{sc.contactsSection}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground/90 mb-1">{sc.contactPhone}</label>
              <input
                type="text"
                value={editScPhone}
                onChange={(e) => setEditScPhone(e.target.value)}
                className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/90 mb-1">{sc.contactTelegram}</label>
              <input
                type="text"
                value={editScTelegram}
                onChange={(e) => setEditScTelegram(e.target.value)}
                className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/90 mb-1">{sc.contactWebsite}</label>
              <input
                type="text"
                value={editScWebsite}
                onChange={(e) => setEditScWebsite(e.target.value)}
                className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/90 mb-1">{sc.contactEmail}</label>
              <input
                type="email"
                value={editScEmail}
                onChange={(e) => setEditScEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </AdminModalShell>
    </div>
  );
}
