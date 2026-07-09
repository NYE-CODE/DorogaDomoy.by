import { useCallback, useEffect, useState } from 'react';
import { Edit2, ExternalLink, Plus, Save, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { blogApi, type BlogCategory, type BlogPostAdmin } from '../api/client';
import { BlogMarkdownEditor } from './blog-markdown-editor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { titleToBlogSlug } from '../utils/blog-slug';
import { useI18n } from '../context/I18nContext';
import { adm } from './admin-panel-chrome';
import { AdminModalShell } from './admin/admin-modal-shell';

export interface AdminBlogPanelProps {
  blogPosts: BlogPostAdmin[];
  onBlogCreate: (data: {
    slug: string;
    title: string;
    excerpt?: string;
    body_md: string;
    cover_image_url?: string;
    meta_description?: string;
    category?: string;
    status?: 'draft' | 'published';
  }) => void;
  onBlogUpdate: (
    id: string,
    data: Partial<{
      slug: string;
      title: string;
      excerpt: string;
      body_md: string;
      cover_image_url: string;
      meta_description: string;
      category: string;
      status: 'draft' | 'published';
    }>,
  ) => void;
  onBlogDelete: (id: string) => void;
  onBlogSendTelegram: (id: string) => void;
  onOpenCategories?: () => void;
  onOpenTelegramSettings?: () => void;
}

function blogTelegramUrl(p: BlogPostAdmin): string | null {
  if (p.telegram_message_id == null) return null;
  const u = (p.telegram_channel_username || '').replace(/^@/, '');
  if (!u) return null;
  return `https://t.me/${u}/${p.telegram_message_id}`;
}

export function AdminBlogPanel({
  blogPosts,
  onBlogCreate,
  onBlogUpdate,
  onBlogDelete,
  onBlogSendTelegram,
  onOpenCategories,
  onOpenTelegramSettings,
}: AdminBlogPanelProps) {
  const { t } = useI18n();
  const ap = t.adminPanel;

  const [blogCategories, setBlogCategories] = useState<BlogCategory[]>([]);
  const [editingBlog, setEditingBlog] = useState<BlogPostAdmin | 'create' | null>(null);
  const [editBlogSlug, setEditBlogSlug] = useState('');
  const [editBlogTitle, setEditBlogTitle] = useState('');
  const [editBlogExcerpt, setEditBlogExcerpt] = useState('');
  const [editBlogBody, setEditBlogBody] = useState('');
  const [editBlogCover, setEditBlogCover] = useState('');
  const [editBlogMeta, setEditBlogMeta] = useState('');
  const [editBlogCategory, setEditBlogCategory] = useState('');
  const [editBlogStatus, setEditBlogStatus] = useState<'draft' | 'published'>('draft');
  const [blogSlugUserTouched, setBlogSlugUserTouched] = useState(false);

  const refreshBlogCategories = useCallback(() => {
    blogApi.listCategories().then(setBlogCategories).catch(() => setBlogCategories([]));
  }, []);

  useEffect(() => {
    refreshBlogCategories();
  }, [refreshBlogCategories]);

  const openBlogCreate = () => {
    setEditingBlog('create');
    setEditBlogSlug('');
    setEditBlogTitle('');
    setEditBlogExcerpt('');
    setEditBlogBody('');
    setEditBlogCover('');
    setEditBlogMeta('');
    setEditBlogCategory(blogCategories[0]?.slug ?? '');
    setEditBlogStatus('draft');
    setBlogSlugUserTouched(false);
  };

  const openBlogEdit = (bp: BlogPostAdmin) => {
    setEditingBlog(bp);
    setEditBlogSlug(bp.slug);
    setEditBlogTitle(bp.title);
    setBlogSlugUserTouched(true);
    setEditBlogExcerpt(bp.excerpt || '');
    setEditBlogBody(bp.body_md);
    setEditBlogCover(bp.cover_image_url || '');
    setEditBlogMeta(bp.meta_description || '');
    setEditBlogCategory(bp.category || blogCategories[0]?.slug || '');
    setEditBlogStatus(bp.status === 'published' ? 'published' : 'draft');
  };

  const handleSaveBlog = () => {
    const slug = editBlogSlug.trim().toLowerCase();
    const title = editBlogTitle.trim();
    const body = editBlogBody.trim();
    if (!slug || !title || !body) {
      toast.error(ap.toasts.blogFillRequired);
      return;
    }
    if (!blogCategories.length) {
      toast.error(ap.toasts.blogNeedCategory);
      return;
    }
    const categorySlug = blogCategories.some((c) => c.slug === editBlogCategory)
      ? editBlogCategory
      : blogCategories[0].slug;
    if (editingBlog === 'create') {
      onBlogCreate({
        slug,
        title,
        excerpt: editBlogExcerpt.trim() || undefined,
        body_md: body,
        cover_image_url: editBlogCover.trim() || undefined,
        meta_description: editBlogMeta.trim() || undefined,
        category: categorySlug,
        status: editBlogStatus,
      });
    } else if (editingBlog && editingBlog !== 'create') {
      onBlogUpdate(editingBlog.id, {
        slug,
        title,
        excerpt: editBlogExcerpt.trim() || undefined,
        body_md: body,
        cover_image_url: editBlogCover.trim() || undefined,
        meta_description: editBlogMeta.trim() || undefined,
        category: categorySlug,
        status: editBlogStatus,
      });
    }
    setEditingBlog(null);
  };

  const blogCategorySelectValue = blogCategories.some((c) => c.slug === editBlogCategory)
    ? editBlogCategory
    : (blogCategories[0]?.slug ?? '');

  return (
    <div className={adm.page}>
      <div className={adm.headerRow}>
        <div className={adm.headerText}>
          <h2 className={adm.title}>{ap.tabs.articles}</h2>
        </div>
        <button type="button" onClick={openBlogCreate} className={adm.primaryBtn}>
          <Plus className="w-4 h-4" /> {ap.blog.newArticle}
        </button>
      </div>

      <p className={adm.lead}>
        {ap.blog.hintTelegramPrefix}{' '}
        <button
          type="button"
          onClick={onOpenTelegramSettings}
          className="text-primary font-medium hover:underline"
        >
          {ap.blog.hintTelegramLink}
        </button>
        .
      </p>

      {blogCategories.length === 0 ? (
        <p className={adm.warnBanner}>
          {ap.blog.hintCategoriesEmptyPrefix}{' '}
          <button type="button" onClick={onOpenCategories} className="font-medium underline">
            {ap.blog.hintCategoriesLink}
          </button>
          {ap.blog.hintCategoriesEmptySuffix}
        </p>
      ) : null}

      <div className={adm.tableShell}>
        <div className={adm.tableWrap}>
          <table className={`${adm.table} min-w-[720px]`}>
            <thead className={adm.thead}>
              <tr>
                <th className={adm.th}>{ap.blog.colTitle}</th>
                <th className={adm.th}>{ap.blog.colSlug}</th>
                <th className={adm.th}>{ap.blog.colStatus}</th>
                <th className={adm.th}>{ap.blog.colTelegram}</th>
                <th className={adm.th}>{ap.blog.colActions}</th>
              </tr>
            </thead>
            <tbody className={adm.tbody}>
              {blogPosts.length === 0 ? (
                <tr>
                  <td colSpan={5} className={adm.tdEmpty}>
                    {ap.blog.empty}
                  </td>
                </tr>
              ) : (
                blogPosts.map((p) => {
                  const tg = blogTelegramUrl(p);
                  return (
                    <tr key={p.id} className={adm.tr}>
                      <td className="px-4 py-3 text-sm text-foreground font-medium max-w-[200px]">
                        <span className="line-clamp-2">{p.title}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground dark:text-muted-foreground/50 font-mono">
                        {p.slug}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={
                            p.status === 'published'
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }
                        >
                          {p.status === 'published' ? ap.blog.published : ap.blog.draft}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {tg ? (
                          <a
                            href={tg}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={ap.blog.tgOpen}
                            className="inline-flex items-center justify-center p-2 rounded-lg text-primary hover:bg-primary/10 dark:hover:bg-primary/20"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span className="sr-only">{ap.blog.tgOpen}</span>
                          </a>
                        ) : p.status === 'published' ? (
                          <button
                            type="button"
                            onClick={() => onBlogSendTelegram(p.id)}
                            title={ap.blog.tgSend}
                            className="inline-flex items-center justify-center p-2 rounded-lg text-primary hover:bg-primary/10 dark:hover:bg-primary/20"
                          >
                            <Send className="w-4 h-4" />
                            <span className="sr-only">{ap.blog.tgSend}</span>
                          </button>
                        ) : (
                          <span className="text-muted-foreground/80">{ap.blog.tgDash}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {p.status === 'published' ? (
                            <button
                              type="button"
                              onClick={() => window.open(`/blog/${p.slug}`, '_blank')}
                              className="p-1.5 text-primary hover:bg-primary/10 rounded transition-colors"
                              title={ap.blog.previewSite}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => openBlogEdit(p)}
                            className="p-1.5 text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded transition-colors"
                            title={ap.blog.editTooltip}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(ap.toasts.deleteArticleConfirm)) onBlogDelete(p.id);
                            }}
                            className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            title={ap.blog.deleteTooltip}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AdminModalShell
        open={!!editingBlog}
        onClose={() => setEditingBlog(null)}
        title={editingBlog === 'create' ? ap.blog.modalNewTitle : ap.blog.modalEditTitle}
        maxWidthClass="max-w-3xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditingBlog(null)}
              className="px-4 py-3 text-sm text-foreground/90 border border-border rounded-lg hover:bg-accent"
            >
              {t.common.cancel}
            </button>
            <button
              type="button"
              onClick={handleSaveBlog}
              className="flex items-center gap-2 px-4 py-3 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              <Save className="w-4 h-4" /> {t.common.save}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-1">{ap.blog.fieldTitle}</label>
            <input
              type="text"
              value={editBlogTitle}
              onChange={(e) => {
                const v = e.target.value.slice(0, 200);
                setEditBlogTitle(v);
                if (editingBlog === 'create' && !blogSlugUserTouched) {
                  setEditBlogSlug(titleToBlogSlug(v));
                }
              }}
              maxLength={200}
              className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg"
            />
          </div>
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <label className="block text-sm font-medium text-foreground/90">{ap.blog.fieldSlug}</label>
              <button
                type="button"
                onClick={() => {
                  setEditBlogSlug(titleToBlogSlug(editBlogTitle));
                  setBlogSlugUserTouched(false);
                }}
                className="text-xs text-primary hover:underline"
              >
                {ap.blog.slugFromTitle}
              </button>
            </div>
            <input
              type="text"
              value={editBlogSlug}
              onChange={(e) => {
                setBlogSlugUserTouched(true);
                setEditBlogSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
              }}
              placeholder={ap.blog.slugPlaceholder}
              className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg font-mono text-sm"
            />
            {editingBlog === 'create' && !blogSlugUserTouched ? (
              <p className="text-xs text-muted-foreground mt-1">{ap.blog.slugHint}</p>
            ) : null}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-1">{ap.blog.fieldExcerpt}</label>
            <textarea
              value={editBlogExcerpt}
              onChange={(e) => setEditBlogExcerpt(e.target.value.slice(0, 2000))}
              rows={3}
              className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg resize-y min-h-[80px]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-1">{ap.blog.fieldBody}</label>
            <BlogMarkdownEditor value={editBlogBody} onChange={setEditBlogBody} rows={14} />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-1">{ap.blog.fieldCover}</label>
            <input
              type="text"
              value={editBlogCover}
              onChange={(e) => setEditBlogCover(e.target.value)}
              placeholder={ap.blog.coverPlaceholder}
              className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">{ap.blog.coverHint}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-1">{ap.blog.fieldMeta}</label>
            <input
              type="text"
              value={editBlogMeta}
              onChange={(e) => setEditBlogMeta(e.target.value.slice(0, 320))}
              maxLength={320}
              className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg text-sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground/90 mb-2">{ap.blog.fieldCategory}</label>
              <Select
                value={blogCategorySelectValue}
                onValueChange={setEditBlogCategory}
                disabled={blogCategories.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={ap.blog.categoryNone} />
                </SelectTrigger>
                <SelectContent>
                  {blogCategories.map((c) => (
                    <SelectItem key={c.id} value={c.slug}>
                      {c.title} ({c.slug})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/90 mb-2">{ap.blog.fieldStatus}</label>
              <Select
                value={editBlogStatus}
                onValueChange={(v) => setEditBlogStatus(v as 'draft' | 'published')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">{ap.blog.statusDraft}</SelectItem>
                  <SelectItem value="published">{ap.blog.statusPublished}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </AdminModalShell>
    </div>
  );
}
