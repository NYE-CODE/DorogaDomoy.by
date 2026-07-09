import { api } from '@/shared/api/http';

export interface BlogCategory {
  id: string;
  slug: string;
  title: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BlogPostListItem {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  cover_image_url?: string | null;
  category: string;
  category_title: string;
  published_at: string;
  reading_minutes: number;
}

export interface BlogPostPublic extends BlogPostListItem {
  body_md: string;
  meta_description?: string | null;
  telegram_post_url?: string | null;
}

export interface BlogPostAdmin extends BlogPostPublic {
  status: string;
  created_at: string;
  updated_at: string;
  author_id?: string | null;
  telegram_message_id?: number | null;
  telegram_channel_username?: string | null;
}

export const blogApi = {
  listCategories: () => api<BlogCategory[]>('/blog/categories'),

  listPublished: (params?: { limit?: number; offset?: number }) => {
    const q = new URLSearchParams();
    if (params?.limit != null) q.set('limit', String(params.limit));
    if (params?.offset != null && params.offset > 0) q.set('offset', String(params.offset));
    const suffix = q.toString() ? `?${q}` : '';
    return api<BlogPostListItem[]>(`/blog/posts${suffix}`);
  },

  getPublished: (slug: string) => api<BlogPostPublic>(`/blog/posts/${encodeURIComponent(slug)}`),

  adminList: (params?: { limit?: number; offset?: number }) => {
    const q = new URLSearchParams();
    if (params?.limit != null) q.set('limit', String(params.limit));
    if (params?.offset != null && params.offset > 0) q.set('offset', String(params.offset));
    const suffix = q.toString() ? `?${q}` : '';
    return api<BlogPostAdmin[]>(`/blog/admin/posts${suffix}`);
  },

  adminCategoryCreate: (data: { slug: string; title: string; sort_order?: number }) =>
    api<BlogCategory>('/blog/admin/categories', {
      method: 'POST',
      body: JSON.stringify({
        slug: data.slug,
        title: data.title,
        sort_order: data.sort_order ?? 0,
      }),
    }),

  adminCategoryUpdate: (id: string, data: Partial<{ title: string; sort_order: number }>) =>
    api<BlogCategory>(`/blog/admin/categories/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  adminCategoryDelete: (id: string) =>
    api<void>(`/blog/admin/categories/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  adminCreate: (data: {
    slug: string;
    title: string;
    excerpt?: string;
    body_md: string;
    cover_image_url?: string;
    meta_description?: string;
    category?: string;
    status?: 'draft' | 'published';
  }) =>
    api<BlogPostAdmin>('/blog/admin/posts', {
      method: 'POST',
      body: JSON.stringify({
        slug: data.slug,
        title: data.title,
        excerpt: data.excerpt ?? null,
        body_md: data.body_md,
        cover_image_url: data.cover_image_url ?? null,
        meta_description: data.meta_description ?? null,
        category: data.category ?? 'guides',
        status: data.status ?? 'draft',
      }),
    }),

  adminUpdate: (
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
  ) =>
    api<BlogPostAdmin>(`/blog/admin/posts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  adminDelete: (id: string) => api<void>(`/blog/admin/posts/${id}`, { method: 'DELETE' }),

  adminSendTelegram: (id: string) =>
    api<BlogPostAdmin>(`/blog/admin/posts/${id}/telegram`, { method: 'POST' }),
};

