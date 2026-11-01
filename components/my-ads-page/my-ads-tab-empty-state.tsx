import { CheckCircle, Clock, Plus, XCircle } from 'lucide-react';
import type { ModerationStatus } from '@/entities/pet/model/types';
import { EmptyState } from '../ui/empty-state';
import { cn } from '@/shared/lib/classNames';
import { surfaceCtaPrimary } from '@/shared/styles/surface-classes';

export interface MyAdsTabEmptyStateProps {
  statusTab: ModerationStatus;
  labels: {
    noPublished: string;
    noPending: string;
    noRejected: string;
    emptyPublishedDesc: string;
    emptyPendingDesc: string;
    emptyRejectedDesc: string;
    createFirst: string;
  };
  onCreateClick: () => void;
}

export function MyAdsTabEmptyState({ statusTab, labels, onCreateClick }: MyAdsTabEmptyStateProps) {
  const title =
    statusTab === 'approved'
      ? labels.noPublished
      : statusTab === 'pending'
        ? labels.noPending
        : labels.noRejected;
  const description =
    statusTab === 'approved'
      ? labels.emptyPublishedDesc
      : statusTab === 'pending'
        ? labels.emptyPendingDesc
        : labels.emptyRejectedDesc;
  const icon =
    statusTab === 'approved' ? (
      <CheckCircle className="size-7 text-muted-foreground" />
    ) : statusTab === 'pending' ? (
      <Clock className="size-7 text-muted-foreground" />
    ) : (
      <XCircle className="size-7 text-muted-foreground" />
    );

  return (
    <EmptyState
      title={title}
      description={description}
      icon={icon}
      action={
        statusTab === 'approved' ? (
          <button
            type="button"
            className={cn(surfaceCtaPrimary, 'w-auto min-w-[12rem] px-7')}
            onClick={onCreateClick}
          >
            <Plus className="size-5" aria-hidden />
            {labels.createFirst}
          </button>
        ) : undefined
      }
      className="border-0 bg-transparent px-2 py-10 shadow-none md:px-4 md:py-14"
    />
  );
}
