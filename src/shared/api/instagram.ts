import { api } from '@/shared/api/http';

export interface InstagramAccountResponse {
  id: string;
  name: string;
  instagram_business_id: string;
  facebook_page_id?: string | null;
  has_access_token: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InstagramRegionRouteResponse {
  id: string;
  region_key: string;
  account_id: string;
  account_name: string;
  is_fallback: boolean;
  created_at: string;
  updated_at: string;
}

export interface InstagramPublicationResponse {
  id: string;
  pet_id: string;
  account_id?: string | null;
  account_name?: string | null;
  initiated_by?: string | null;
  region_key?: string | null;
  mode: string;
  source?: 'auto' | 'manual_admin' | 'boost_user';
  requested_by_user_id?: string | null;
  requested_at?: string | null;
  format: 'story';
  status: string;
  attempts: number;
  last_error?: string | null;
  external_media_id?: string | null;
  idempotency_key: string;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  published_at?: string | null;
}

export interface InstagramPublicationListResponse {
  items: InstagramPublicationResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface InstagramBoostEligibilityResponse {
  eligible: boolean;
  reason:
    | 'ok'
    | 'pet_not_found'
    | 'not_owner'
    | 'not_approved'
    | 'archived_or_found'
    | 'too_early'
    | 'route_missing'
    | 'limit_reached';
  next_available_at?: string | null;
  pet_age_days?: number | null;
}

export const instagramApi = {
  listAccounts: () => api<InstagramAccountResponse[]>('/instagram/accounts'),
  createAccount: (data: {
    name: string;
    instagram_business_id: string;
    facebook_page_id?: string;
    access_token?: string;
    is_active?: boolean;
  }) =>
    api<InstagramAccountResponse>('/instagram/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateAccount: (accountId: string, data: Partial<{
    name: string;
    instagram_business_id: string;
    facebook_page_id: string | null;
    access_token: string | null;
    is_active: boolean;
  }>) =>
    api<InstagramAccountResponse>(`/instagram/accounts/${accountId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  listRoutes: () => api<InstagramRegionRouteResponse[]>('/instagram/routes'),
  createRoute: (data: { region_key: string; account_id: string; is_fallback?: boolean }) =>
    api<InstagramRegionRouteResponse>('/instagram/routes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateRoute: (routeId: string, data: Partial<{ account_id: string; is_fallback: boolean }>) =>
    api<InstagramRegionRouteResponse>(`/instagram/routes/${routeId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteRoute: (routeId: string) =>
    api<void>(`/instagram/routes/${routeId}`, { method: 'DELETE' }),

  listPublications: (params?: { status?: string; pet_id?: string; limit?: number; offset?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.pet_id) q.set('pet_id', params.pet_id);
    if (params?.limit != null) q.set('limit', String(params.limit));
    if (params?.offset != null) q.set('offset', String(params.offset));
    const suffix = q.toString() ? `?${q}` : '';
    return api<InstagramPublicationListResponse>(`/instagram/publications${suffix}`);
  },
  createManualPublication: (data: { pet_id: string; format: 'story' }) =>
    api<InstagramPublicationResponse[]>('/instagram/publications/manual', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  boostEligibility: (petId: string) =>
    api<InstagramBoostEligibilityResponse>(`/instagram/boosts/eligibility?pet_id=${encodeURIComponent(petId)}`),
  createBoostPublication: (pet_id: string) =>
    api<InstagramPublicationResponse>('/instagram/publications/boost', {
      method: 'POST',
      body: JSON.stringify({ pet_id }),
    }),
  retryPublication: (publicationId: string) =>
    api<InstagramPublicationResponse>(`/instagram/publications/${publicationId}/retry`, {
      method: 'POST',
    }),
  cancelPublication: (publicationId: string) =>
    api<InstagramPublicationResponse>(`/instagram/publications/${publicationId}/cancel`, {
      method: 'POST',
    }),
  publishNow: (publicationId: string) =>
    api<InstagramPublicationResponse>(`/instagram/publications/${publicationId}/publish-now`, {
      method: 'POST',
    }),
};

