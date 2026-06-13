import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Edit2, ExternalLink, Plus, Trash2, Video, X } from 'lucide-react';
import {
  guidesApi,
  type GuideCategory,
  type GuideVideoAdmin,
} from '../api/client';
import { useI18n } from '../context/I18nContext';
import { adm, admFieldClass } from './admin-panel-chrome';
import { cn } from './ui/utils';

type PanelView = 'videos' | 'categories';
type CategoryEdit = { mode: 'create' } | { mode: 'edit'; id: string };
type VideoEdit = { mode: 'create' } | { mode: 'edit'; id: string };

function slugFromTitle(title: string): string {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
    к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
    х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  };
  return title
    .trim()
    .toLowerCase()
    .split('')
    .map((ch) => map[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export function AdminGuidesPanel() {
  const { t } = useI18n();
  const g = t.adminPanel.guidesSection;

  const [view, setView] = useState<PanelView>('videos');
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<GuideCategory[]>([]);
  const [videos, setVideos] = useState<GuideVideoAdmin[]>([]);

  const [categoryEdit, setCategoryEdit] = useState<CategoryEdit | null>(null);
  const [catTitle, setCatTitle] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catSort, setCatSort] = useState(0);
  const [catSaving, setCatSaving] = useState(false);

  const [videoEdit, setVideoEdit] = useState<VideoEdit | null>(null);
  const [vidTitle, setVidTitle] = useState('');
  const [vidDesc, setVidDesc] = useState('');
  const [vidUrl, setVidUrl] = useState('');
  const [vidCategory, setVidCategory] = useState('');
  const [vidSort, setVidSort] = useState(0);
  const [vidStatus, setVidStatus] = useState<'draft' | 'published'>('draft');
  const [vidSaving, setVidSaving] = useState(false);

  const categoriesSorted = useMemo(
    () => [...categories].sort((a, b) => a.sort_order - b.sort_order || a.slug.localeCompare(b.slug)),
    [categories],
  );

  const videosSorted = useMemo(
    () => [...videos].sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title)),
    [videos],
  );

  const refresh = async () => {
    const [cats, vids] = await Promise.all([
      guidesApi.listCategories(),
      guidesApi.adminListVideos(),
    ]);
    setCategories(cats);
    setVideos(vids);
  };

  useEffect(() => {
    setLoading(true);
    refresh()
      .catch((err) => toast.error(err instanceof Error ? err.message : g.loadError))
      .finally(() => setLoading(false));
  }, []);

  const openCreateCategory = () => {
    const next = categories.length ? Math.max(...categories.map((c) => c.sort_order), 0) + 1 : 0;
    setCategoryEdit({ mode: 'create' });
    setCatTitle('');
    setCatSlug('');
    setCatSort(next);
  };

  const openEditCategory = (row: GuideCategory) => {
    setCategoryEdit({ mode: 'edit', id: row.id });
    setCatTitle(row.title);
    setCatSlug(row.slug);
    setCatSort(row.sort_order);
  };

  const saveCategory = async () => {
    const title = catTitle.trim();
    if (!title) {
      toast.error(g.categoryNameRequired);
      return;
    }
    setCatSaving(true);
    try {
      if (categoryEdit?.mode === 'create') {
        const slug = (catSlug.trim() || slugFromTitle(title)).replace(/[^a-z0-9-]/g, '-');
        if (!slug) {
          toast.error(g.categorySlugRequired);
          return;
        }
        await guidesApi.adminCategoryCreate({ slug, title, sort_order: catSort });
        toast.success(g.categoryCreated);
      } else if (categoryEdit?.mode === 'edit') {
        await guidesApi.adminCategoryUpdate(categoryEdit.id, { title, sort_order: catSort });
        toast.success(g.categoryUpdated);
      }
      setCategoryEdit(null);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : g.saveError);
    } finally {
      setCatSaving(false);
    }
  };

  const openCreateVideo = () => {
    if (!categories.length) {
      toast.error(g.needCategoryFirst);
      setView('categories');
      return;
    }
    const next = videos.length ? Math.max(...videos.map((v) => v.sort_order), 0) + 1 : 0;
    setVideoEdit({ mode: 'create' });
    setVidTitle('');
    setVidDesc('');
    setVidUrl('');
    setVidCategory(categoriesSorted[0]?.slug ?? '');
    setVidSort(next);
    setVidStatus('draft');
  };

  const openEditVideo = (row: GuideVideoAdmin) => {
    setVideoEdit({ mode: 'edit', id: row.id });
    setVidTitle(row.title);
    setVidDesc(row.description ?? '');
    setVidUrl(row.youtube_url);
    setVidCategory(row.category);
    setVidSort(row.sort_order);
    setVidStatus(row.status);
  };

  const saveVideo = async () => {
    const title = vidTitle.trim();
    const youtube_url = vidUrl.trim();
    if (!title || !youtube_url || !vidCategory) {
      toast.error(g.videoValidation);
      return;
    }
    setVidSaving(true);
    try {
      const payload = {
        category: vidCategory,
        title,
        description: vidDesc.trim() || undefined,
        youtube_url,
        sort_order: vidSort,
        status: vidStatus,
      };
      if (videoEdit?.mode === 'create') {
        await guidesApi.adminVideoCreate(payload);
        toast.success(g.videoCreated);
      } else if (videoEdit?.mode === 'edit') {
        await guidesApi.adminVideoUpdate(videoEdit.id, payload);
        toast.success(g.videoUpdated);
      }
      setVideoEdit(null);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : g.saveError);
    } finally {
      setVidSaving(false);
    }
  };

  if (loading) {
    return <p className={adm.lead}>{g.loading}</p>;
  }

  return (
    <div className={adm.page}>
      <div className={adm.headerRow}>
        <div className={adm.headerText}>
          <h2 className={adm.title}>{g.title}</h2>
          <p className={adm.lead}>{g.hint}</p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setView('videos')}
          className={cn(
            'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            view === 'videos'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80',
          )}
        >
          {g.tabVideos}
        </button>
        <button
          type="button"
          onClick={() => setView('categories')}
          className={cn(
            'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            view === 'categories'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80',
          )}
        >
          {g.tabCategories}
        </button>
      </div>

      {view === 'categories' ? (
        <>
          <div className="mb-4 flex justify-end">
            <button type="button" onClick={openCreateCategory} className={adm.primaryBtn}>
              <Plus className="size-4" /> {g.categoryNew}
            </button>
          </div>
          <div className={adm.tableShell}>
            <div className={adm.tableWrap}>
              <table className={`${adm.table} min-w-[560px]`}>
                <thead className={adm.thead}>
                  <tr>
                    <th className={adm.th}>{g.colOrder}</th>
                    <th className={adm.th}>{g.colName}</th>
                    <th className={adm.th}>{g.colSlug}</th>
                    <th className={adm.th}>{g.colActions}</th>
                  </tr>
                </thead>
                <tbody className={adm.tbody}>
                  {categoriesSorted.length === 0 ? (
                    <tr>
                      <td colSpan={4} className={adm.tdEmpty}>
                        {g.categoriesEmpty}
                      </td>
                    </tr>
                  ) : (
                    categoriesSorted.map((c) => (
                      <tr key={c.id} className={adm.tr}>
                        <td className="px-4 py-3 text-sm text-muted-foreground dark:text-muted-foreground/50">{c.sort_order}</td>
                        <td className="px-4 py-3 text-sm font-medium text-foreground">{c.title}</td>
                        <td className="px-4 py-3 font-mono text-sm text-muted-foreground dark:text-muted-foreground/50">{c.slug}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditCategory(c)}
                              className="rounded p-1.5 text-primary transition-colors hover:bg-primary/10"
                            >
                              <Edit2 className="size-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (!window.confirm(g.categoryDeleteConfirm)) return;
                                guidesApi
                                  .adminCategoryDelete(c.id)
                                  .then(() => {
                                    toast.success(g.categoryDeleted);
                                    return refresh();
                                  })
                                  .catch((e: unknown) =>
                                    toast.error(e instanceof Error ? e.message : g.saveError),
                                  );
                              }}
                              className="rounded p-1.5 text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
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
        </>
      ) : (
        <>
          <div className="mb-4 flex justify-end">
            <button type="button" onClick={openCreateVideo} className={adm.primaryBtn}>
              <Plus className="size-4" /> {g.videoNew}
            </button>
          </div>
          {categories.length === 0 ? (
            <p className={adm.lead}>
              {g.needCategoryFirst}{' '}
              <button type="button" className="font-medium underline" onClick={() => setView('categories')}>
                {g.tabCategories}
              </button>
            </p>
          ) : null}
          <div className={adm.tableShell}>
            <div className={adm.tableWrap}>
              <table className={`${adm.table} min-w-[720px]`}>
                <thead className={adm.thead}>
                  <tr>
                    <th className={adm.th}>{g.colOrder}</th>
                    <th className={adm.th}>{g.colTitle}</th>
                    <th className={adm.th}>{g.colCategory}</th>
                    <th className={adm.th}>{g.colStatus}</th>
                    <th className={adm.th}>{g.colActions}</th>
                  </tr>
                </thead>
                <tbody className={adm.tbody}>
                  {videosSorted.length === 0 ? (
                    <tr>
                      <td colSpan={5} className={adm.tdEmpty}>
                        {g.videosEmpty}
                      </td>
                    </tr>
                  ) : (
                    videosSorted.map((v) => (
                      <tr key={v.id} className={adm.tr}>
                        <td className="px-4 py-3 text-sm text-muted-foreground dark:text-muted-foreground/50">{v.sort_order}</td>
                        <td className="px-4 py-3 text-sm font-medium text-foreground">
                          <div className="flex items-center gap-2">
                            <Video className="size-4 shrink-0 text-muted-foreground" />
                            {v.title}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground dark:text-muted-foreground/50">{v.category_title}</td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-xs font-medium',
                              v.status === 'published'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                                : 'bg-muted text-muted-foreground',
                            )}
                          >
                            {v.status === 'published' ? g.statusPublished : g.statusDraft}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <a
                              href={v.youtube_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted"
                              title={g.openYoutube}
                            >
                              <ExternalLink className="size-4" />
                            </a>
                            <button
                              type="button"
                              onClick={() => openEditVideo(v)}
                              className="rounded p-1.5 text-primary transition-colors hover:bg-primary/10"
                            >
                              <Edit2 className="size-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (!window.confirm(g.videoDeleteConfirm)) return;
                                guidesApi
                                  .adminVideoDelete(v.id)
                                  .then(() => {
                                    toast.success(g.videoDeleted);
                                    return refresh();
                                  })
                                  .catch((e: unknown) =>
                                    toast.error(e instanceof Error ? e.message : g.saveError),
                                  );
                              }}
                              className="rounded p-1.5 text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
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
        </>
      )}

      {categoryEdit ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setCategoryEdit(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b px-6 py-4 dark:border-border">
              <h3 className="font-semibold text-foreground">
                {categoryEdit.mode === 'create' ? g.categoryModalNew : g.categoryModalEdit}
              </h3>
              <button type="button" onClick={() => setCategoryEdit(null)} className="rounded p-1 hover:bg-accent">
                <X className="size-5 dark:text-muted-foreground/80" />
              </button>
            </div>
            <div className="space-y-4 px-6 py-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/90">{g.nameLabel}</label>
                <input
                  className={admFieldClass}
                  value={catTitle}
                  onChange={(e) => setCatTitle(e.target.value)}
                />
              </div>
              {categoryEdit.mode === 'create' ? (
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground/90">{g.slugLabel}</label>
                  <div className="flex gap-2">
                    <input
                      className={admFieldClass}
                      value={catSlug}
                      onChange={(e) => setCatSlug(e.target.value)}
                      placeholder={g.slugPlaceholder}
                    />
                    <button
                      type="button"
                      className={adm.ghostBtn}
                      onClick={() => setCatSlug(slugFromTitle(catTitle))}
                    >
                      {g.slugFromTitle}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {g.slugLabel}: <code>{catSlug}</code>
                </p>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/90">{g.sortLabel}</label>
                <input
                  type="number"
                  className={admFieldClass}
                  value={catSort}
                  onChange={(e) => setCatSort(Number(e.target.value))}
                />
              </div>
              <button type="button" disabled={catSaving} onClick={() => void saveCategory()} className={adm.primaryBtn}>
                {catSaving ? g.saving : g.save}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {videoEdit ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setVideoEdit(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b px-6 py-4 dark:border-border">
              <h3 className="font-semibold text-foreground">
                {videoEdit.mode === 'create' ? g.videoModalNew : g.videoModalEdit}
              </h3>
              <button type="button" onClick={() => setVideoEdit(null)} className="rounded p-1 hover:bg-accent">
                <X className="size-5 dark:text-muted-foreground/80" />
              </button>
            </div>
            <div className="space-y-4 px-6 py-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/90">{g.fieldTitle}</label>
                <input className={admFieldClass} value={vidTitle} onChange={(e) => setVidTitle(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/90">{g.fieldYoutube}</label>
                <input
                  className={admFieldClass}
                  value={vidUrl}
                  onChange={(e) => setVidUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=…"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/90">{g.fieldCategory}</label>
                <select
                  className={admFieldClass}
                  value={vidCategory}
                  onChange={(e) => setVidCategory(e.target.value)}
                >
                  {categoriesSorted.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/90">{g.fieldDescription}</label>
                <textarea
                  className={admFieldClass}
                  rows={3}
                  value={vidDesc}
                  onChange={(e) => setVidDesc(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground/90">{g.sortLabel}</label>
                  <input
                    type="number"
                    className={admFieldClass}
                    value={vidSort}
                    onChange={(e) => setVidSort(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground/90">{g.fieldStatus}</label>
                  <select
                    className={admFieldClass}
                    value={vidStatus}
                    onChange={(e) => setVidStatus(e.target.value as 'draft' | 'published')}
                  >
                    <option value="draft">{g.statusDraft}</option>
                    <option value="published">{g.statusPublished}</option>
                  </select>
                </div>
              </div>
              <button type="button" disabled={vidSaving} onClick={() => void saveVideo()} className={adm.primaryBtn}>
                {vidSaving ? g.saving : g.save}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
