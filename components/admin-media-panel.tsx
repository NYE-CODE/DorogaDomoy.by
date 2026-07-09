import { useState } from 'react';
import { Edit2, Plus, Save, Trash2 } from 'lucide-react';
import { API_BASE, type MediaArticle } from '../api/client';
import { useI18n } from '../context/I18nContext';
import { adm } from './admin-panel-chrome';
import { AdminModalShell } from './admin/admin-modal-shell';

export interface AdminMediaPanelProps {
  mediaArticles: MediaArticle[];
  onMediaCreate: (data: {
    logo_url?: string;
    title: string;
    published_at: string;
    link?: string;
  }) => void;
  onMediaUpdate: (
    id: string,
    data: Partial<{ logo_url: string; title: string; published_at: string; link: string }>,
  ) => void;
  onMediaDelete: (id: string) => void;
}

function mediaLogoSrc(url: string): string {
  return url.startsWith('http') || url.startsWith('data:') ? url : `${API_BASE}${url}`;
}

export function AdminMediaPanel({
  mediaArticles,
  onMediaCreate,
  onMediaUpdate,
  onMediaDelete,
}: AdminMediaPanelProps) {
  const { t } = useI18n();
  const ap = t.adminPanel;

  const [editingMedia, setEditingMedia] = useState<MediaArticle | 'create' | null>(null);
  const [editLogoUrl, setEditLogoUrl] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editPublishedAt, setEditPublishedAt] = useState('');
  const [editLink, setEditLink] = useState('');

  const openMediaCreate = () => {
    setEditingMedia('create');
    setEditLogoUrl('');
    setEditTitle('');
    setEditPublishedAt(new Date().toISOString().slice(0, 10));
    setEditLink('');
  };

  const openMediaEdit = (m: MediaArticle) => {
    setEditingMedia(m);
    setEditLogoUrl(m.logo_url || '');
    setEditTitle(m.title);
    setEditPublishedAt(
      m.published_at ? m.published_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
    );
    setEditLink(m.link || '');
  };

  const handleSaveMedia = () => {
    const dateVal = editPublishedAt
      ? new Date(`${editPublishedAt}T12:00:00`).toISOString()
      : new Date().toISOString();
    if (editingMedia === 'create') {
      onMediaCreate({
        logo_url: editLogoUrl.trim() || undefined,
        title: editTitle.trim(),
        published_at: dateVal,
        link: editLink.trim() || undefined,
      });
    } else if (editingMedia && editingMedia !== 'create') {
      onMediaUpdate(editingMedia.id, {
        logo_url: editLogoUrl.trim() || undefined,
        title: editTitle.trim(),
        published_at: dateVal,
        link: editLink.trim() || undefined,
      });
    }
    setEditingMedia(null);
  };

  return (
    <div className={adm.page}>
      <div className={adm.headerRow}>
        <div className={adm.headerText}>
          <h2 className={adm.title}>{ap.media.title}</h2>
        </div>
        <button onClick={openMediaCreate} className={adm.primaryBtn}>
          <Plus className="w-4 h-4" /> {ap.media.add}
        </button>
      </div>

      <div className={adm.tableShell}>
        <div className={adm.tableWrap}>
          <table className={`${adm.table} min-w-[600px]`}>
            <thead className={adm.thead}>
              <tr>
                <th className={adm.th}>{ap.media.colLogo}</th>
                <th className={adm.th}>{ap.media.colTitle}</th>
                <th className={adm.th}>{ap.media.colDate}</th>
                <th className={adm.th}>{ap.media.colLink}</th>
                <th className={adm.th}>{ap.media.colActions}</th>
              </tr>
            </thead>
            <tbody className={adm.tbody}>
              {mediaArticles.length === 0 ? (
                <tr>
                  <td colSpan={5} className={adm.tdEmpty}>
                    {ap.media.empty}
                  </td>
                </tr>
              ) : (
                mediaArticles.map((m) => (
                  <tr key={m.id} className={adm.tr}>
                    <td className="px-4 py-3">
                      {m.logo_url ? (
                        <img src={mediaLogoSrc(m.logo_url)} alt="" className="h-8 object-contain max-w-[80px]" />
                      ) : (
                        <span className="text-muted-foreground/80 text-sm" aria-hidden>
                          ·
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground max-w-[200px] truncate">{m.title}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {m.published_at ? new Date(m.published_at).toLocaleDateString('ru-RU') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {m.link ? (
                        <a
                          href={m.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm truncate max-w-[150px] block"
                        >
                          {m.link}
                        </a>
                      ) : (
                        <span className="text-muted-foreground/80 text-sm" aria-hidden>
                          ·
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openMediaEdit(m)}
                          className="p-1.5 text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded transition-colors"
                          title={ap.blog.editTooltip}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(ap.media.deletePublicationConfirm)) onMediaDelete(m.id);
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
        open={!!editingMedia}
        onClose={() => setEditingMedia(null)}
        title={editingMedia === 'create' ? ap.media.modalAdd : ap.media.modalEdit}
        footer={
          <>
            <button
              onClick={() => setEditingMedia(null)}
              className="px-4 py-3 text-sm text-foreground/90 border border-border rounded-lg hover:bg-accent dark:hover:bg-accent"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={handleSaveMedia}
              disabled={!editTitle.trim() || editTitle.length > 100}
              className="flex items-center gap-2 px-4 py-3 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {t.common.save}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-1">{ap.media.logoUrl}</label>
            <input
              type="text"
              value={editLogoUrl}
              onChange={(e) => setEditLogoUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-1">{ap.media.titleLabel}</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value.slice(0, 100))}
              maxLength={100}
              placeholder={ap.media.titleHint}
              className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <p className="text-xs text-muted-foreground mt-1">{editTitle.length}/100</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-1">{ap.media.dateLabel}</label>
            <input
              type="date"
              value={editPublishedAt}
              onChange={(e) => setEditPublishedAt(e.target.value)}
              className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-1">{ap.media.linkLabel}</label>
            <input
              type="url"
              value={editLink}
              onChange={(e) => setEditLink(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      </AdminModalShell>
    </div>
  );
}
