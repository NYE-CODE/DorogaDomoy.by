import { AdFormStepHeader } from '../ad-form-step-header';

export interface AddEditPetPageHeaderProps {
  title: string;
  stepLine: string;
  closeLabel: string;
  totalSteps: number;
  currentStep: number;
  onBack: () => void;
  onClose: () => void;
  backAriaLabel?: string;
}

/** Шапка шагов — тот же визуал, что у создания объявления. */
export function AddEditPetPageHeader({
  title,
  stepLine,
  closeLabel,
  totalSteps,
  currentStep,
  onBack,
  onClose,
  backAriaLabel = 'Назад',
}: AddEditPetPageHeaderProps) {
  return (
    <AdFormStepHeader
      pageTitle={title}
      stepLabel={stepLine}
      totalSteps={totalSteps}
      currentStep={currentStep}
      progressLabel={stepLine}
      backAriaLabel={backAriaLabel}
      closeLabel={closeLabel}
      onBack={onBack}
      onClose={onClose}
    />
  );
}
