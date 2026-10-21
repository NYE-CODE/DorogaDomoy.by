import { ChevronLeft } from 'lucide-react';
import { RouteProgress } from '@/shared/ui/molecules';
import { pageContainerNarrow } from '@/shared/styles/layout-classes';
import { surfaceIconButton } from '@/shared/styles/surface-classes';
import { cn } from '@/shared/lib/classNames';

type AdFormStepHeaderProps = {
  pageTitle: string;
  stepLabel: string;
  totalSteps: number;
  currentStep: number;
  progressLabel: string;
  backAriaLabel: string;
  closeLabel: string;
  onBack: () => void;
  onClose: () => void;
};

export function AdFormStepHeader({
  pageTitle,
  stepLabel,
  totalSteps,
  currentStep,
  progressLabel,
  backAriaLabel,
  closeLabel,
  onBack,
  onClose,
}: AdFormStepHeaderProps) {
  return (
    <div className={cn(pageContainerNarrow, 'mx-auto px-4 py-4 sm:px-6')}>
      <div className="mb-4 flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onBack}
          className={surfaceIconButton}
          aria-label={backAriaLabel}
        >
          <ChevronLeft className="size-5" aria-hidden />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="typo-h2 truncate font-display">{pageTitle}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{stepLabel}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-landing-muted hover:text-foreground"
        >
          {closeLabel}
        </button>
      </div>
      <RouteProgress
        totalSteps={totalSteps}
        currentStep={currentStep}
        label={progressLabel}
        className="max-w-sm"
      />
    </div>
  );
}
