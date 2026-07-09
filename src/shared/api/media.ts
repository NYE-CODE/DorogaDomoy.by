import { api } from '@/shared/api/http';

export interface MediaArticle {
  id: string;
  logo_url?: string | null;
  title: string;
  published_at: string;
  link?: string | null;
}

export const mediaApi = {
  list: (params?: { limit?: number; offset?: number }) => {
    const q = new URLSearchParams();
    if (params?.limit != null) q.set('limit', String(params.limit));
    if (params?.offset != null && params.offset > 0) q.set('offset', String(params.offset));
    const suffix = q.toString() ? `?${q}` : '';
    return api<MediaArticle[]>(`/media${suffix}`);
  },

  create: (data: { logo_url?: string; title: string; published_at: string; link?: string }) =>
    api<MediaArticle>('/media', {
      method: 'POST',
      body: JSON.stringify({
        logo_url: data.logo_url || null,
        title: data.title,
        published_at: data.published_at,
        link: data.link || null,
      }),
    }),

  update: (id: string, data: Partial<{ logo_url: string; title: string; published_at: string; link: string }>) =>
    api<MediaArticle>(`/media/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) => api<void>(`/media/${id}`, { method: 'DELETE' }),
};

