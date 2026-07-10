import { api } from '@/shared/api/http';
import type { PartnerAdPlacement } from '@/shared/lib/partner-ad-placements';

export interface PartnerAd {
  id: string;
  partner_id?: string | null;
  partner_name?: string | null;
  title: string;
  sponsor_label?: string | null;
  image_desktop: string;
  image_mobile?: string | null;
  link_url: string;
  alt_text?: string | null;
  placements: string[];
  priority: number;
  starts_at?: string | null;
  ends_at?: string | null;
  is_active: boolean;
  created_at?: string | null;
}

export type PartnerAdCreatePayload = {
  partner_id?: string | null;
  title: string;
  sponsor_label?: string | null;
  image_desktop: string;
  image_mobile?: string | null;
  link_url: string;
  alt_text?: string | null;
  placements: PartnerAdPlacement[];
  priority?: number;
  starts_at?: string | null;
  ends_at?: string | null;
  is_active?: boolean;
};

export const partnerAdsApi = {
  listPlacements: () => api<string[]>('/partner-ads/placements'),

  listActive: () => api<PartnerAd[]>('/partner-ads/active'),

  listAdmin: () => api<PartnerAd[]>('/partner-ads'),

  create: (data: PartnerAdCreatePayload) =>
    api<PartnerAd>('/partner-ads', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<PartnerAdCreatePayload>) =>
    api<PartnerAd>(`/partner-ads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) => api<void>(`/partner-ads/${id}`, { method: 'DELETE' }),
};
