import { RotateCw, Send, XCircle } from 'lucide-react';
import type { InstagramPublicationResponse } from '../../api/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AdminTablePagination } from '../admin-table-pagination';
import { adm } from '../admin-panel-chrome';
import type { PublicationFilter } from './admin-instagram-types';

export interface AdminInstagramQueueSectionProps {
  ig: Record<string, unknown>;
  paginationLabels: Record<string, string>;
  publicationFilter: PublicationFilter;
  publicationPetFilter: string;
  setPublicationPetFilter: (v: string) => void;
  publicationStatusOptions: readonly PublicationFilter[];
  statusLabels: Record<PublicationFilter, string>;
  visiblePublications: InstagramPublicationResponse[];
  publications: InstagramPublicationResponse[];
  publicationsTotal: number;
  queuePage: number;
  queueTotalPages: number;
  queueLoading: boolean;
  busy: boolean;
  onFilterChange: (filter: PublicationFilter) => void;
  onRefresh: () => void;
  onOpenManualModal: () => void;
  onQueueAction: (publicationId: string, action: 'retry' | 'cancel' | 'publishNow') => void;
  onPageChange: (page: number) => void;
  queueStatusBadgeClass: (status: string) => string;
  queueStatusLabel: (status: string) => string;
  formatQueueDate: (value?: string | null) => string;
}

export function AdminInstagramQueueSection({
  ig,
  paginationLabels,
  publicationFilter,
  publicationPetFilter,
  setPublicationPetFilter,
  publicationStatusOptions,
  statusLabels,
  visiblePublications,
  publications,
  publicationsTotal,
  queuePage,
  queueTotalPages,
  queueLoading,
  busy,
  onFilterChange,
  onRefresh,
  onOpenManualModal,
  onQueueAction,
  onPageChange,
  queueStatusBadgeClass,
  queueStatusLabel,
  formatQueueDate,
}: AdminInstagramQueueSectionProps) {
  const labels = ig as Record<string, string>;

  return (
    <div className={adm.settingsCard}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-foreground">{labels.queueTitle}</h3>
        <div className="flex items-center gap-2">
          <Select
            value={publicationFilter}
            onValueChange={(value) => onFilterChange(value as PublicationFilter)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {publicationStatusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {statusLabels[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input
            className="w-[180px] px-3 py-2 border border-border dark:bg-muted dark:text-white rounded-lg text-sm"
            placeholder={labels.queuePetFilterPlaceholder}
            value={publicationPetFilter}
            onChange={(e) => {
              setPublicationPetFilter(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              onRefresh();
            }}
          />
          <button
            className="px-3 py-2 border border-border rounded-lg text-sm hover:bg-accent dark:hover:bg-accent"
            onClick={onRefresh}
            disabled={busy}
          >
            {labels.refreshButton}
          </button>
          <button
            className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 disabled:opacity-60"
            onClick={onOpenManualModal}
            disabled={busy}
          >
            {labels.addButton}
          </button>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {queueLoading ? (
          <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground dark:border-border dark:text-muted-foreground/80">
            {labels.loadingQueue}
          </div>
        ) : null}
        {visiblePublications.map((row) => (
          <div
            key={row.id}
            className="rounded-lg border border-border p-3 text-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-medium text-foreground flex items-center flex-wrap gap-2">
                <span>{row.pet_id}</span>
                <span className="text-muted-foreground">• {row.format}</span>
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${queueStatusBadgeClass(row.status)}`}
                >
                  {queueStatusLabel(row.status)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">{labels.attemptsLabel}: {row.attempts}</div>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {labels.accountLabel}: {row.account_name || labels.notAssigned} • {labels.regionLabel}: {row.region_key || '—'}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {labels.createdAtLabel}: {formatQueueDate(row.created_at)} • {labels.updatedAtLabel}: {formatQueueDate(row.updated_at)}
              {' • '}
              {labels.publishedAtLabel}: {formatQueueDate(row.published_at)}
            </div>
            {row.external_media_id ? (
              <div className="mt-1 text-xs text-muted-foreground">
                {labels.externalMediaIdLabel}: <span className="font-mono">{row.external_media_id}</span>
              </div>
            ) : null}
            {row.last_error ? (
              <div className="mt-1 text-xs text-red-600 dark:text-red-300">{row.last_error}</div>
            ) : null}
            <div className="mt-2 flex flex-wrap items-center gap-1">
              <button
                type="button"
                title={labels.publishNowButton}
                className="inline-flex items-center justify-center p-2 rounded-lg border border-border hover:bg-accent dark:hover:bg-accent disabled:opacity-50"
                onClick={() => {
                  onQueueAction(row.id, 'publishNow');
                }}
                disabled={busy || row.status === 'published' || row.status === 'cancelled'}
              >
                <Send className="w-4 h-4" />
                <span className="sr-only">{labels.publishNowButton}</span>
              </button>
              <button
                type="button"
                title={labels.retryButton}
                className="inline-flex items-center justify-center p-2 rounded-lg border border-amber-300 dark:border-amber-900 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 disabled:opacity-50"
                onClick={() => {
                  onQueueAction(row.id, 'retry');
                }}
                disabled={busy || row.status === 'published'}
              >
                <RotateCw className="w-4 h-4" />
                <span className="sr-only">{labels.retryButton}</span>
              </button>
              <button
                type="button"
                title={labels.cancelButton}
                className="inline-flex items-center justify-center p-2 rounded-lg border border-red-300 dark:border-red-900 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                onClick={() => {
                  onQueueAction(row.id, 'cancel');
                }}
                disabled={busy || row.status === 'published' || row.status === 'cancelled'}
              >
                <XCircle className="w-4 h-4" />
                <span className="sr-only">{labels.cancelButton}</span>
              </button>
            </div>
          </div>
        ))}
        {visiblePublications.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground dark:border-border dark:text-muted-foreground/80">
            {labels.queueEmpty}
          </div>
        ) : null}
      </div>
      <AdminTablePagination
        currentPage={queuePage}
        totalPages={queueTotalPages}
        onPageChange={onPageChange}
        labels={paginationLabels}
        summary={
          <span className="text-xs text-muted-foreground">
            {(labels.queuePageSummary as (page: number, pageSize: number, shown: number, total: number) => string)(
              queuePage,
              30,
              publications.length,
              publicationsTotal,
            )}
          </span>
        }
        className="mt-4"
      />
    </div>
  );
}
