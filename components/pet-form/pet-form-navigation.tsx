import { ChevronLeft } from 'lucide-react';
import type { PetFormData } from './pet-form-types';
import type { PetFormT } from './pet-form-validation';

export interface PetFormNavigationProps {
  variant: 'modal' | 'page';
  step: number;
  totalSteps: number;
  isEditing: boolean;
  formData: PetFormData;
  t: PetFormT;
  canProceed: boolean;
  onBack: () => void;
  onNext: () => void;
  onTryProceed: () => void;
}

export function PetFormNavigation({
  variant,
  step,
  totalSteps,
  isEditing,
  formData,
  t,
  canProceed,
  onBack,
  onNext,
  onTryProceed,
}: PetFormNavigationProps) {
  return (
    <div className="flex items-center justify-between mt-8 pt-5 border-t border-border/60 dark:border-border">
      {variant === 'page' ? (
        <div />
      ) : step > 1 ? (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-3 text-sm text-muted-foreground hover:bg-accent dark:hover:bg-accent rounded-lg transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          {t.common.back}
        </button>
      ) : (
        <div />
      )}

      {step < totalSteps ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onTryProceed();
            if (canProceed) onNext();
          }}
          className={`flex items-center justify-center gap-1.5 px-6 py-3 text-white font-medium rounded-lg transition-colors ${variant === 'page' ? 'w-full h-12 bg-primary hover:bg-primary-hover text-lg' : 'bg-primary hover:bg-primary/90 text-sm'}`}
        >
          {variant === 'page' ? t.petForm.nextStep : t.common.next}
        </button>
      ) : (
        <button
          type="submit"
          disabled={!isEditing && !formData.agreeToPrivacy}
          className="w-full h-12 bg-primary hover:bg-primary-hover text-white text-lg font-medium rounded-lg disabled:bg-muted dark:disabled:bg-muted/80 disabled:cursor-not-allowed transition-colors"
        >
          {isEditing ? t.common.save : t.petForm.createAd}
        </button>
      )}
    </div>
  );
}
