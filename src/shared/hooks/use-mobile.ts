import { useMediaQuery, MOBILE_MEDIA_QUERY } from '@/shared/hooks/useMediaQuery';

/** true если viewport уже mobile (<768px). */
export function useIsMobile(): boolean {
  return useMediaQuery(MOBILE_MEDIA_QUERY);
}

export { MOBILE_MEDIA_QUERY };
