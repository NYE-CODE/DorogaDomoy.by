import { BackQuickMenu } from '../../../components/navigation/BackQuickMenu';
import { RouteProgress } from '@/shared/ui/molecules';
import { SHELTER_FORM_STEPS } from '@/shared/lib/shelter-org-form';

export interface MyShelterFormPageHeaderProps {
  title: string;
  stepLabel: string;
  closeLabel: string;
  formStep: number;
  currentStepTitle: string;
  approvedLocked: boolean;
  approvedEditHint?: string;
  onClose: () => void;
}

export function MyShelterFormPageHeader({
  title,
  stepLabel,
  closeLabel,
  formStep,
  currentStepTitle,
  approvedLocked,
  approvedEditHint,
  onClose,
}: MyShelterFormPageHeaderProps) {
  return (
    <section className="border-b border-border bg-white dark:border-border dark:bg-card">
      <div className="mx-auto max-w-[736px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center gap-4">
          <BackQuickMenu />
          <div className="min-w-0 flex-1">
            <h1 className="typo-h1 truncate">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {stepLabel}:{' '}
              <span className="font-medium text-foreground">{currentStepTitle}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="whitespace-nowrap text-muted-foreground transition-colors hover:text-black dark:text-muted-foreground dark:hover:text-foreground"
          >
            {closeLabel}
          </button>
        </div>
        {approvedLocked && approvedEditHint ? (
          <p className="mb-3 text-sm text-muted-foreground">{approvedEditHint}</p>
        ) : null}
        <RouteProgress
          totalSteps={SHELTER_FORM_STEPS}
          currentStep={formStep}
          label={stepLabel}
          className="max-w-sm"
        />
      </div>
    </section>
  );
}
