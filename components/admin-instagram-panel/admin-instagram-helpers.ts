import type { PublicationFilter } from './admin-instagram-types';

export function queueStatusBadgeClass(status: string): string {
  switch (status) {
    case 'published':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    case 'failed':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
    case 'processing':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    case 'cancelled':
      return 'bg-muted text-foreground/90 dark:bg-muted dark:text-muted-foreground/50';
    case 'pending':
    default:
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
  }
}

export function formatQueueDate(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
}

export function buildStatusLabels(ig: Record<string, string>): Record<PublicationFilter, string> {
  return {
    all: ig.statusAll,
    pending: ig.statusPending,
    processing: ig.statusProcessing,
    published: ig.statusPublished,
    failed: ig.statusFailed,
    cancelled: ig.statusCancelled,
  };
}

export function queueStatusLabel(
  status: string,
  statusLabels: Record<PublicationFilter, string>,
): string {
  const key = status as PublicationFilter;
  return statusLabels[key] ?? status;
}
