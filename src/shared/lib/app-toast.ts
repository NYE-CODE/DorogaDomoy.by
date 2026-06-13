import { toast } from 'sonner';

/** Единый разбор ошибок API / Error для sonner. */
export function toastApiError(err: unknown, fallback: string): void {
  toast.error(err instanceof Error ? err.message : fallback);
}
