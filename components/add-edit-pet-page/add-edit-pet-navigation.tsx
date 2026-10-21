import { cn } from '@/shared/lib/classNames';
import { surfaceCtaPrimary } from '@/shared/styles/surface-classes';

export interface AddEditPetNavigationProps {
  currentStep: number;
  totalSteps: number;
  nextLabel: string;
  submitLabel: string;
  submittingLabel: string;
  isUploadingPhotos: boolean;
  isSubmitting: boolean;
  onNext: () => void;
  onSubmit: () => void;
}

export function AddEditPetNavigation({
  currentStep,
  totalSteps,
  nextLabel,
  submitLabel,
  submittingLabel,
  isUploadingPhotos,
  isSubmitting,
  onNext,
  onSubmit,
}: AddEditPetNavigationProps) {
  const busy = isUploadingPhotos || isSubmitting;
  const label =
    currentStep < totalSteps ? nextLabel : isSubmitting ? submittingLabel : submitLabel;

  return (
    <div className="mt-8 flex items-center justify-between gap-3 border-t border-border/60 pt-6">
      <div />
      <button
        type="button"
        onClick={currentStep < totalSteps ? onNext : onSubmit}
        disabled={currentStep >= totalSteps ? busy : false}
        className={cn(surfaceCtaPrimary, 'w-full')}
      >
        {label}
      </button>
    </div>
  );
}
