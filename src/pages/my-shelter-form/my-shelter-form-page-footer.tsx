import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/ui/utils';
import { appOutlineCtaClass, appPrimaryCtaClass } from '@/shared/styles/cta-classes';
import { SHELTER_FORM_STEPS } from '@/shared/lib/shelter-org-form';

export interface MyShelterFormPageFooterProps {
  formStep: number;
  saving: boolean;
  approvedLocked: boolean;
  cancelLabel: string;
  backLabel: string;
  nextLabel: string;
  loadingLabel: string;
  savePublishedLabel: string;
  saveDraftLabel: string;
  onCancel: () => void;
  onBack: () => void;
  onNext: () => void;
  onSave: () => void;
}

export function MyShelterFormPageFooter({
  formStep,
  saving,
  approvedLocked,
  cancelLabel,
  backLabel,
  nextLabel,
  loadingLabel,
  savePublishedLabel,
  saveDraftLabel,
  onCancel,
  onBack,
  onNext,
  onSave,
}: MyShelterFormPageFooterProps) {
  return (
    <div className="mt-8 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:gap-2">
        <Button
          type="button"
          variant="outline"
          className={cn('w-full sm:w-auto', appOutlineCtaClass)}
          onClick={onCancel}
          disabled={saving}
        >
          {cancelLabel}
        </Button>
        {formStep > 1 ? (
          <Button
            type="button"
            variant="outline"
            className={cn('w-full sm:w-auto', appOutlineCtaClass)}
            onClick={onBack}
            disabled={saving}
          >
            {backLabel}
          </Button>
        ) : null}
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">
        {formStep < SHELTER_FORM_STEPS ? (
          <Button type="button" className={cn('w-full sm:w-auto', appPrimaryCtaClass)} onClick={onNext}>
            {nextLabel}
          </Button>
        ) : (
          <Button
            type="button"
            className={cn('w-full sm:w-auto', appPrimaryCtaClass)}
            onClick={onSave}
            disabled={saving}
          >
            {saving ? loadingLabel : approvedLocked ? savePublishedLabel : saveDraftLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
