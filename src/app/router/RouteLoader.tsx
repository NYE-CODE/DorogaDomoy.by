import { PageLoader } from '@/shared/ui/page-loader';

/** Fallback при lazy-loading страниц и проверке auth. */
export function RouteLoader() {
  return <PageLoader />;
}
