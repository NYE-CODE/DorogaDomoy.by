import { Button } from '../ui/button';
import { appPrimaryCtaClass } from '@/shared/styles/cta-classes';

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
    <div className="min-h-screen bg-muted/30 dark:bg-background flex items-center justify-center py-12">
      <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
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
    <div className="min-h-screen bg-muted/30 dark:bg-background flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white dark:bg-card rounded-lg border border-border shadow-sm p-6 text-center">
        <h1 className="typo-h2 mb-3">{loadErrorTitle}</h1>
        <p className="text-muted-foreground mb-3">{loadErrorDesc}</p>
        <p className="text-sm text-muted-foreground mb-6">{loadError}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button type="button" className={appPrimaryCtaClass} onClick={onRetry}>
            {retryLabel}
          </Button>
          <Button type="button" variant="secondary" size="cta" onClick={onBack}>
            {backLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
