import { useState } from 'react';
import { Edit2, Plus, Save, Trash2 } from 'lucide-react';
import { API_BASE, type Partner } from '../api/client';
import { useI18n } from '../context/I18nContext';
import { adm } from './admin-panel-chrome';
import { AdminModalShell } from './admin/admin-modal-shell';

export interface AdminPartnersPanelProps {
  partners: Partner[];
  onPartnerCreate: (data: {
    logo_url?: string;
    name: string;
    link?: string;
    is_medallion_partner?: boolean;
  }) => void;
  onPartnerUpdate: (
    id: string,
    data: Partial<{ logo_url: string; name: string; link: string; is_medallion_partner: boolean }>,
  ) => void;
  onPartnerDelete: (id: string) => void;
}

function partnerLogoSrc(url: string): string {
  return url.startsWith('http') || url.startsWith('data:') ? url : `${API_BASE}${url}`;
}

export function AdminPartnersPanel({
  partners,
  onPartnerCreate,
  onPartnerUpdate,
  onPartnerDelete,
}: AdminPartnersPanelProps) {
  const { t } = useI18n();
  const ap = t.adminPanel;

  const [editingPartner, setEditingPartner] = useState<Partner | 'create' | null>(null);
  const [editPartnerLogoUrl, setEditPartnerLogoUrl] = useState('');
  const [editPartnerName, setEditPartnerName] = useState('');
  const [editPartnerLink, setEditPartnerLink] = useState('');
  const [editPartnerMedallion, setEditPartnerMedallion] = useState(false);

  const openPartnerCreate = () => {
    setEditingPartner('create');
    setEditPartnerLogoUrl('');
    setEditPartnerName('');
    setEditPartnerLink('');
    setEditPartnerMedallion(false);
  };

  const openPartnerEdit = (p: Partner) => {
    setEditingPartner(p);
    setEditPartnerLogoUrl(p.logo_url || '');
    setEditPartnerName(p.name);
    setEditPartnerLink(p.link || '');
    setEditPartnerMedallion(!!p.is_medallion_partner);
  };

  const handleSavePartner = () => {
    if (editingPartner === 'create') {
      onPartnerCreate({
        logo_url: editPartnerLogoUrl.trim() || undefined,
        name: editPartnerName.trim(),
        link: editPartnerLink.trim() || undefined,
        is_medallion_partner: editPartnerMedallion,
      });
    } else if (editingPartner && editingPartner !== 'create') {
      onPartnerUpdate(editingPartner.id, {
        logo_url: editPartnerLogoUrl.trim() || undefined,
        name: editPartnerName.trim(),
        link: editPartnerLink.trim() || undefined,
        is_medallion_partner: editPartnerMedallion,
      });
    }
    setEditingPartner(null);
  };

  return (
    <div className={adm.page}>
      <div className={adm.headerRow}>
        <div className={adm.headerText}>
          <h2 className={adm.title}>{ap.partners.title}</h2>
        </div>
        <button onClick={openPartnerCreate} className={adm.primaryBtn}>
          <Plus className="w-4 h-4" /> {ap.partners.add}
        </button>
      </div>

      <div className={adm.tableShell}>
        <div className={adm.tableWrap}>
          <table className={`${adm.table} min-w-[600px]`}>
            <thead className={adm.thead}>
              <tr>
                <th className={adm.th}>{ap.partners.colLogo}</th>
                <th className={adm.th}>{ap.partners.colName}</th>
                <th className={adm.th}>{ap.partners.colLink}</th>
                <th className={adm.th}>{ap.partners.colMedallions}</th>
                <th className={adm.th}>{ap.partners.colActions}</th>
              </tr>
            </thead>
            <tbody className={adm.tbody}>
              {partners.length === 0 ? (
                <tr>
                  <td colSpan={5} className={adm.tdEmpty}>
                    {ap.partners.empty}
                  </td>
                </tr>
              ) : (
                partners.map((p) => (
                  <tr key={p.id} className={adm.tr}>
                    <td className="px-4 py-3">
                      {p.logo_url ? (
                        <img src={partnerLogoSrc(p.logo_url)} alt="" className="h-8 object-contain max-w-[80px]" />
                      ) : (
                        <span className="text-muted-foreground/80 text-sm" aria-hidden>
                          ·
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground font-medium">{p.name}</td>
                    <td className="px-4 py-3">
                      {p.link ? (
                        <a
                          href={p.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm truncate max-w-[200px] block"
                        >
                          {p.link}
                        </a>
                      ) : (
                        <span className="text-muted-foreground/80 text-sm" aria-hidden>
                          ·
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          p.is_medallion_partner
                            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                            : 'bg-muted text-muted-foreground dark:text-muted-foreground/50'
                        }`}
                      >
                        {p.is_medallion_partner ? ap.partners.medallionYes : ap.partners.medallionNo}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openPartnerEdit(p)}
                          className="p-1.5 text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded transition-colors"
                          title={ap.blog.editTooltip}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(ap.partners.deleteConfirm)) onPartnerDelete(p.id);
                          }}
                          className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title={ap.blog.deleteTooltip}
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
        open={!!editingPartner}
        onClose={() => setEditingPartner(null)}
        title={editingPartner === 'create' ? ap.partners.modalAdd : ap.partners.modalEdit}
        footer={
          <>
            <button
              onClick={() => setEditingPartner(null)}
              className="px-4 py-3 text-sm text-foreground/90 border border-border rounded-lg hover:bg-accent dark:hover:bg-accent"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={handleSavePartner}
              disabled={!editPartnerName.trim()}
              className="flex items-center gap-2 px-4 py-3 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {t.common.save}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-1">{ap.partners.logoUrl}</label>
            <input
              type="text"
              value={editPartnerLogoUrl}
              onChange={(e) => setEditPartnerLogoUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-1">{ap.partners.nameLabel}</label>
            <input
              type="text"
              value={editPartnerName}
              onChange={(e) => setEditPartnerName(e.target.value.slice(0, 100))}
              maxLength={100}
              placeholder={ap.partners.namePlaceholder}
              className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <p className="text-xs text-muted-foreground mt-1">{editPartnerName.length}/100</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-1">{ap.partners.linkLabel}</label>
            <input
              type="url"
              value={editPartnerLink}
              onChange={(e) => setEditPartnerLink(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <label className="flex items-center gap-3 text-sm text-foreground/90">
            <input
              type="checkbox"
              checked={editPartnerMedallion}
              onChange={(e) => setEditPartnerMedallion(e.target.checked)}
              className="w-4 h-4 rounded border-border"
            />
            <span>{ap.partners.medallionCheckbox}</span>
          </label>
        </div>
      </AdminModalShell>
    </div>
  );
}
