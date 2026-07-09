import { api } from '@/shared/api/http';

export interface HelpDonationTier {
  id: string;
  label: string;
  payment_url: string;
  sort_order: number;
}

export interface HelpLandingConfig {
  volunteer_url: string;
  donation_tiers: HelpDonationTier[];
}

export const helpApi = {
  get: () => api<HelpLandingConfig>('/help'),

  updateVolunteerUrl: (volunteer_url: string) =>
    api<{ volunteer_url: string }>('/help/volunteer-url', {
      method: 'PATCH',
      body: JSON.stringify({ volunteer_url }),
    }),

  createDonationTier: (data: { label: string; payment_url: string; sort_order?: number }) =>
    api<HelpDonationTier>('/help/donation-tiers', {
      method: 'POST',
      body: JSON.stringify({
        label: data.label,
        payment_url: data.payment_url,
        sort_order: data.sort_order ?? 0,
      }),
    }),

  updateDonationTier: (
    id: string,
    data: Partial<{ label: string; payment_url: string; sort_order: number }>,
  ) =>
    api<HelpDonationTier>(`/help/donation-tiers/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteDonationTier: (id: string) =>
    api<void>(`/help/donation-tiers/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

