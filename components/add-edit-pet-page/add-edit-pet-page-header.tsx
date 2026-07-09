import { ChevronLeft } from 'lucide-react';
import { RouteProgress } from '@/shared/ui/molecules';

export interface AddEditPetPageHeaderProps {
  title: string;
  stepLine: string;
  closeLabel: string;
  totalSteps: number;
  currentStep: number;
  onBack: () => void;
  onClose: () => void;
}

export function AddEditPetPageHeader({
  title,
  stepLine,
  closeLabel,
  totalSteps,
  currentStep,
  onBack,
  onClose,
}: AddEditPetPageHeaderProps) {
  return (
    <div className="bg-white dark:bg-card border-b border-border">
      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className="flex items-center gap-4 mb-4">
          <button
            type="button"
            onClick={onBack}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ChevronLeft size={24} className="text-muted-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="typo-h2">{title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{stepLine}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-black dark:hover:text-white shrink-0"
          >
            {closeLabel}
          </button>
        </div>

        <RouteProgress
          totalSteps={totalSteps}
          currentStep={currentStep}
          label={stepLine}
          className="max-w-sm"
        />
      </div>
    </div>
  );
}
