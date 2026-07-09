import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  guidesApi,
  type GuideCategory,
  type GuideVideoAdmin,
} from '../../api/client';
import { useI18n } from '../../context/I18nContext';
import { slugFromTitle } from './admin-guides-helpers';
import type {
  AdminGuidesCategoryEdit,
  AdminGuidesPanelView,
  AdminGuidesVideoEdit,
} from './admin-guides-types';

export function useAdminGuidesPanel() {
  const { t } = useI18n();
  const g = t.adminPanel.guidesSection;

  const [view, setView] = useState<AdminGuidesPanelView>('videos');
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<GuideCategory[]>([]);
  const [videos, setVideos] = useState<GuideVideoAdmin[]>([]);

  const [categoryEdit, setCategoryEdit] = useState<AdminGuidesCategoryEdit | null>(null);
  const [catTitle, setCatTitle] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catSort, setCatSort] = useState(0);
  const [catSaving, setCatSaving] = useState(false);

  const [videoEdit, setVideoEdit] = useState<AdminGuidesVideoEdit | null>(null);
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

  const deleteCategory = async (id: string) => {
    if (!window.confirm(g.categoryDeleteConfirm)) return;
    try {
      await guidesApi.adminCategoryDelete(id);
      toast.success(g.categoryDeleted);
      await refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : g.saveError);
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

  const deleteVideo = async (id: string) => {
    if (!window.confirm(g.videoDeleteConfirm)) return;
    try {
      await guidesApi.adminVideoDelete(id);
      toast.success(g.videoDeleted);
      await refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : g.saveError);
    }
  };

  return {
    g,
    view,
    setView,
    loading,
    categories,
    categoriesSorted,
    videosSorted,
    categoryEdit,
    setCategoryEdit,
    catTitle,
    setCatTitle,
    catSlug,
    setCatSlug,
    catSort,
    setCatSort,
    catSaving,
    videoEdit,
    setVideoEdit,
    vidTitle,
    setVidTitle,
    vidDesc,
    setVidDesc,
    vidUrl,
    setVidUrl,
    vidCategory,
    setVidCategory,
    vidSort,
    setVidSort,
    vidStatus,
    setVidStatus,
    vidSaving,
    openCreateCategory,
    openEditCategory,
    saveCategory,
    deleteCategory,
    openCreateVideo,
    openEditVideo,
    saveVideo,
    deleteVideo,
  };
}
