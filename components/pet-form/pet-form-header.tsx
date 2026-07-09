import { ChevronLeft, X } from 'lucide-react';
import { RouteProgress } from '@/shared/ui/molecules';
import type { PetFormData } from './pet-form-types';
import type { PetFormT } from './pet-form-validation';

export interface PetFormHeaderProps {
  variant: 'modal' | 'page';
  renderStepHeaderExternally: boolean;
  step: number;
  totalSteps: number;
  isEditing: boolean;
  formData: PetFormData;
  currentStepTitle: string;
  currentStepDesc: string;
  pageTitle: string;
  t: PetFormT;
  onClose: () => void;
  onBack: () => void;
}

export function PetFormHeader({
  variant,
  renderStepHeaderExternally,
  step,
  totalSteps,
  isEditing,
  formData,
  currentStepTitle,
  currentStepDesc,
  pageTitle,
  t,
  onClose,
  onBack,
}: PetFormHeaderProps) {
  if (variant === 'page' && renderStepHeaderExternally) return null;

  return (
    <div className={`sticky top-0 z-10 ${variant === 'page' ? 'pb-6 border-b border-border' : 'bg-white/95 dark:bg-card/95 backdrop-blur-sm border-b border-border/60 dark:border-border rounded-t-2xl'}`}>
      {variant === 'page' ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground dark:hover:text-white text-sm font-medium"
            >
              <ChevronLeft className="w-5 h-5" />
              {t.petForm.statusToggleLost}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-medium text-muted-foreground hover:text-foreground dark:hover:text-white"
            >
              {t.petForm.close}
            </button>
          </div>
          <h1 className="typo-h2 mb-3">
            {pageTitle}
          </h1>
          <RouteProgress
            totalSteps={totalSteps}
            currentStep={step}
            label={`${t.petForm.step} ${step} ${t.petForm.of} ${totalSteps}`}
            className="mb-3 max-w-sm"
          />
          <p className="text-sm font-medium text-foreground/90">
            {t.petForm.step} {step} {t.petForm.of} {totalSteps}: {currentStepTitle}
          </p>
          {currentStepDesc && (
            <p className="text-sm text-muted-foreground mt-1">
              {currentStepDesc}
            </p>
          )}
        </div>
      ) : (
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {isEditing ? t.petForm.editTitle : formData.status === 'searching' ? t.petForm.formTitleLost : t.petForm.formTitleFound}
            </h2>
            <div className="flex items-center gap-3 mt-1.5">
              <RouteProgress
                totalSteps={totalSteps}
                currentStep={step}
                label={`${t.petForm.step} ${step} ${t.petForm.of} ${totalSteps}`}
                className="w-44"
              />
              <span className="text-xs text-muted-foreground/80">{t.petForm.step} {step} {t.petForm.of} {totalSteps}</span>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-accent dark:hover:bg-accent rounded-lg transition-colors" aria-label={t.common.back}>
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      )}
    </div>
  );
}
