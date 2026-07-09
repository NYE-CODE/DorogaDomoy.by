export type PublicationFilter = 'all' | 'pending' | 'processing' | 'published' | 'failed' | 'cancelled';

export interface AccountFormState {
  name: string;
  instagramBusinessId: string;
  facebookPageId: string;
  accessToken: string;
  isActive: boolean;
}

export const emptyAccountForm: AccountFormState = {
  name: '',
  instagramBusinessId: '',
  facebookPageId: '',
  accessToken: '',
  isActive: true,
};

export const INSTAGRAM_QUEUE_PAGE_SIZE = 30;

export function asBool(raw?: string, fallback = false): boolean {
  if (!raw) return fallback;
  return raw === 'true' || raw === '1' || raw.toLowerCase() === 'yes';
}

export const publicationStatusOptions = ['all', 'pending', 'processing', 'published', 'failed', 'cancelled'] as const;
