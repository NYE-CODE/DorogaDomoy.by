import { api } from '@/shared/api/http';

export interface Partner {
  id: string;
  logo_url?: string | null;
  name: string;
  link?: string | null;
  is_medallion_partner?: boolean;
}

export const partnersApi = {
  list: () => api<Partner[]>('/partners'),

  create: (data: { logo_url?: string; name: string; link?: string; is_medallion_partner?: boolean }) =>
    api<Partner>('/partners', {
      method: 'POST',
      body: JSON.stringify({
        logo_url: data.logo_url || null,
        name: data.name,
        link: data.link || null,
        is_medallion_partner: data.is_medallion_partner ?? false,
      }),
    }),

  update: (id: string, data: Partial<{ logo_url: string; name: string; link: string; is_medallion_partner: boolean }>) =>
    api<Partner>(`/partners/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) => api<void>(`/partners/${id}`, { method: 'DELETE' }),
};

