import { Button } from '../ui/button';
import { cn } from '@/shared/lib/classNames';
import { surfaceCtaOutline, surfaceCtaPrimary, surfaceEmpty, surfacePage } from '@/shared/styles/surface-classes';

export interface AddEditPetLoadStatesProps {
  isLoading: boolean;
  loadError: string | null;
  loadErrorTitle: string;
  loadErrorDesc: string;
  retryLabel: string;
  backLabel: string;
  onRetry: () => void;
  onBack: () => void;
}

export function AddEditPetLoadingState() {
  return (
    <div className={cn('flex flex-1 items-center justify-center py-12', surfacePage)}>
      <div className="size-12 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
    </div>
  );
}

export function AddEditPetErrorState({
  loadError,
  loadErrorTitle,
  loadErrorDesc,
  retryLabel,
  backLabel,
  onRetry,
  onBack,
}: Omit<AddEditPetLoadStatesProps, 'isLoading'>) {
  return (
    <div className={cn('flex flex-1 items-center justify-center px-4 py-12', surfacePage)}>
      <div className={cn(surfaceEmpty, 'max-w-md w-full space-y-4')}>
        <h1 className="typo-h2 font-display">{loadErrorTitle}</h1>
        <p className="text-muted-foreground">{loadErrorDesc}</p>
        <p className="text-sm text-muted-foreground">{loadError}</p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button type="button" className={surfaceCtaPrimary} onClick={onRetry}>
            {retryLabel}
          </Button>
          <Button type="button" className={surfaceCtaOutline} onClick={onBack}>
            {backLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
