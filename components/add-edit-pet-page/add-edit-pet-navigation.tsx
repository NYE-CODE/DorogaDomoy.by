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
  return (
    <div className="mt-8 flex gap-4">
      {currentStep < totalSteps ? (
        <button
          type="button"
          onClick={onNext}
          className="w-full h-12 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium text-lg"
        >
          {nextLabel}
        </button>
      ) : (
        <button
          type="button"
          onClick={onSubmit}
          disabled={isUploadingPhotos || isSubmitting}
          className={`w-full h-12 text-white rounded-lg transition-colors font-medium text-lg ${
            isUploadingPhotos || isSubmitting
              ? 'bg-green-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isSubmitting ? submittingLabel : submitLabel}
        </button>
      )}
    </div>
  );
}
