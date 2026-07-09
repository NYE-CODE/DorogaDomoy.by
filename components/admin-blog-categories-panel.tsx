import { useCallback, useEffect, useState } from 'react';
import { Edit2, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { blogApi, type BlogCategory } from '../api/client';
import { titleToBlogSlug } from '../utils/blog-slug';
import { useI18n } from '../context/I18nContext';
import { adm } from './admin-panel-chrome';
import { AdminModalShell } from './admin/admin-modal-shell';

export function AdminBlogCategoriesPanel() {
  const { t } = useI18n();
  const ap = t.adminPanel;

  const [blogCategories, setBlogCategories] = useState<BlogCategory[]>([]);
  const [editingBlogCategory, setEditingBlogCategory] = useState<BlogCategory | 'create' | null>(null);
  const [editCatSlug, setEditCatSlug] = useState('');
  const [editCatTitle, setEditCatTitle] = useState('');
  const [editCatSort, setEditCatSort] = useState(0);

  const refreshBlogCategories = useCallback(() => {
    blogApi.listCategories().then(setBlogCategories).catch(() => setBlogCategories([]));
  }, []);

  useEffect(() => {
    refreshBlogCategories();
  }, [refreshBlogCategories]);

  const openBlogCategoryCreate = () => {
    setEditingBlogCategory('create');
    setEditCatSlug('');
    setEditCatTitle('');
    setEditCatSort(0);
  };

  const openBlogCategoryEdit = (c: BlogCategory) => {
    setEditingBlogCategory(c);
    setEditCatSlug(c.slug);
    setEditCatTitle(c.title);
    setEditCatSort(c.sort_order);
  };

  const handleSaveBlogCategory = () => {
    if (editingBlogCategory === 'create') {
      const slug = editCatSlug.trim().toLowerCase();
      const title = editCatTitle.trim();
      if (!slug || !title) {
        toast.error(ap.toasts.categoryFillSlugTitle);
        return;
      }
      blogApi
        .adminCategoryCreate({ slug, title, sort_order: editCatSort })
        .then(() => {
          toast.success(ap.toasts.categoryCreated);
          setEditingBlogCategory(null);
          refreshBlogCategories();
        })
        .catch((e: unknown) =>
          toast.error(e instanceof Error ? e.message : ap.toasts.categoryCreateError),
        );
    } else if (editingBlogCategory && editingBlogCategory !== 'create') {
      const title = editCatTitle.trim();
      if (!title) {
        toast.error(ap.toasts.categoryTitleRequired);
        return;
      }
      blogApi
        .adminCategoryUpdate(editingBlogCategory.id, { title, sort_order: editCatSort })
        .then(() => {
          toast.success(ap.toasts.savedShort);
          setEditingBlogCategory(null);
          refreshBlogCategories();
        })
        .catch((e: unknown) =>
          toast.error(e instanceof Error ? e.message : ap.toasts.saveErrorShort),
        );
    }
  };

  return (
    <div className={adm.page}>
      <div className={adm.headerRow}>
        <div className={adm.headerText}>
          <h2 className={adm.title}>{ap.categories.title}</h2>
        </div>
        <button type="button" onClick={openBlogCategoryCreate} className={adm.primaryBtn}>
          <Plus className="w-4 h-4" /> {ap.categories.new}
        </button>
      </div>
      <p className={adm.lead}>{ap.categories.hint}</p>

      <div className={adm.tableShell}>
        <div className={adm.tableWrap}>
          <table className={`${adm.table} min-w-[560px]`}>
            <thead className={adm.thead}>
              <tr>
                <th className={adm.th}>{ap.categories.colOrder}</th>
                <th className={adm.th}>{ap.categories.colName}</th>
                <th className={adm.th}>{ap.categories.colSlug}</th>
                <th className={adm.th}>{ap.categories.colActions}</th>
              </tr>
            </thead>
            <tbody className={adm.tbody}>
              {blogCategories.length === 0 ? (
                <tr>
                  <td colSpan={4} className={adm.tdEmpty}>
                    {ap.categories.empty}
                  </td>
                </tr>
              ) : (
                [...blogCategories]
                  .sort((a, b) => a.sort_order - b.sort_order || a.slug.localeCompare(b.slug))
                  .map((c) => (
                    <tr key={c.id} className={adm.tr}>
                      <td className="px-4 py-3 text-sm text-muted-foreground dark:text-muted-foreground/50">
                        {c.sort_order}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground font-medium">{c.title}</td>
                      <td className="px-4 py-3 text-sm font-mono text-muted-foreground dark:text-muted-foreground/50">
                        {c.slug}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openBlogCategoryEdit(c)}
                            className="p-1.5 text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded transition-colors"
                            title={ap.users.editTitleTooltip}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!window.confirm(ap.categories.deleteConfirm)) return;
                              blogApi
                                .adminCategoryDelete(c.id)
                                .then(() => {
                                  toast.success(ap.toasts.categoryDeleted);
                                  refreshBlogCategories();
                                })
                                .catch((e: unknown) =>
                                  toast.error(
                                    e instanceof Error ? e.message : ap.toasts.categoryDeleteError,
                                  ),
                                );
                            }}
                            className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            title={ap.users.deleteTooltip}
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
        open={!!editingBlogCategory}
        onClose={() => setEditingBlogCategory(null)}
        title={editingBlogCategory === 'create' ? ap.categories.modalNew : ap.categories.modalEdit}
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditingBlogCategory(null)}
              className="px-4 py-3 text-sm text-foreground/90 border border-border rounded-lg hover:bg-accent"
            >
              {t.common.cancel}
            </button>
            <button
              type="button"
              onClick={handleSaveBlogCategory}
              className="flex items-center gap-2 px-4 py-3 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              <Save className="w-4 h-4" /> {t.common.save}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {editingBlogCategory === 'create' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground/90 mb-1">
                  {ap.categories.nameLabel}
                </label>
                <input
                  type="text"
                  value={editCatTitle}
                  onChange={(e) => setEditCatTitle(e.target.value.slice(0, 200))}
                  className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg"
                />
              </div>
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <label className="block text-sm font-medium text-foreground/90">
                    {ap.categories.slugLabel}
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditCatSlug(titleToBlogSlug(editCatTitle))}
                    className="text-xs text-primary hover:underline"
                  >
                    {ap.categories.slugFromTitle}
                  </button>
                </div>
                <input
                  type="text"
                  value={editCatSlug}
                  onChange={(e) =>
                    setEditCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                  }
                  placeholder={ap.categories.slugPlaceholder}
                  className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg font-mono text-sm"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground/90 mb-1">
                  {ap.categories.nameLabel}
                </label>
                <input
                  type="text"
                  value={editCatTitle}
                  onChange={(e) => setEditCatTitle(e.target.value.slice(0, 200))}
                  className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/90 mb-1">
                  {ap.blog.colSlug}
                </label>
                <input
                  type="text"
                  value={editCatSlug}
                  readOnly
                  className="w-full px-3 py-2.5 border border-border dark:bg-card dark:text-muted-foreground/80 rounded-lg font-mono text-sm cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1">{ap.categories.slugReadonlyHint}</p>
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-1">
              {ap.categories.sortLabel}
            </label>
            <input
              type="number"
              value={editCatSort}
              onChange={(e) => setEditCatSort(parseInt(e.target.value, 10) || 0)}
              className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg"
            />
          </div>
        </div>
      </AdminModalShell>
    </div>
  );
}
