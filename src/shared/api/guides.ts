import { api } from '@/shared/api/http';

export interface GuideCategory {
  id: string;
  slug: string;
  title: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface GuideVideoPublic {
  id: string;
  category: string;
  category_title: string;
  title: string;
  description?: string | null;
  youtube_url: string;
  video_id: string;
  embed_url: string;
  thumbnail_url: string;
  sort_order: number;
  published_at?: string | null;
}

export interface GuideVideoAdmin extends GuideVideoPublic {
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

export const guidesApi = {
  listCategories: () => api<GuideCategory[]>('/guides/categories'),

  listPublished: (category?: string) => {
    const q = category ? `?category=${encodeURIComponent(category)}` : '';
    return api<GuideVideoPublic[]>(`/guides/videos${q}`);
  },

  adminListVideos: () => api<GuideVideoAdmin[]>('/guides/admin/videos'),

  adminCategoryCreate: (data: { slug: string; title: string; sort_order?: number }) =>
    api<GuideCategory>('/guides/admin/categories', {
      method: 'POST',
      body: JSON.stringify({
        slug: data.slug,
        title: data.title,
        sort_order: data.sort_order ?? 0,
      }),
    }),

  adminCategoryUpdate: (id: string, data: Partial<{ title: string; sort_order: number }>) =>
    api<GuideCategory>(`/guides/admin/categories/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  adminCategoryDelete: (id: string) =>
    api<void>(`/guides/admin/categories/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  adminVideoCreate: (data: {
    category: string;
    title: string;
    description?: string;
    youtube_url: string;
    sort_order?: number;
    status?: 'draft' | 'published';
  }) =>
    api<GuideVideoAdmin>('/guides/admin/videos', {
      method: 'POST',
      body: JSON.stringify({
        category: data.category,
        title: data.title,
        description: data.description ?? null,
        youtube_url: data.youtube_url,
        sort_order: data.sort_order ?? 0,
        status: data.status ?? 'draft',
      }),
    }),

  adminVideoUpdate: (
    id: string,
    data: Partial<{
      category: string;
      title: string;
      description: string;
      youtube_url: string;
      sort_order: number;
      status: 'draft' | 'published';
    }>,
  ) =>
    api<GuideVideoAdmin>(`/guides/admin/videos/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  adminVideoDelete: (id: string) =>
    api<void>(`/guides/admin/videos/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

