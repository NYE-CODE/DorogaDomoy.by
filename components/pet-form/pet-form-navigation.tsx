import { ChevronLeft } from 'lucide-react';
import type { PetFormData } from './pet-form-types';
import type { PetFormT } from './pet-form-validation';
import { cn } from '@/shared/lib/classNames';
import { surfaceCtaPrimary } from '@/shared/styles/surface-classes';

export interface PetFormNavigationProps {
  variant: 'modal' | 'page';
  step: number;
  totalSteps: number;
  isEditing: boolean;
  formData: PetFormData;
  t: PetFormT;
  canProceed: boolean;
  submitting?: boolean;
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
  submitting = false,
  onBack,
  onNext,
  onTryProceed,
}: PetFormNavigationProps) {
  const primaryLabel =
    step < totalSteps
      ? variant === 'page'
        ? t.petForm.nextStep
        : t.common.next
      : submitting
        ? t.common.loading
        : isEditing
          ? t.common.save
          : t.petForm.createAd;

  return (
    <div className="mt-8 flex items-center justify-between gap-3 border-t border-border/60 pt-6">
      {variant === 'page' ? (
        <div />
      ) : step > 1 ? (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-landing-muted hover:text-foreground"
        >
          <ChevronLeft className="size-4" aria-hidden />
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
          className={cn(
            surfaceCtaPrimary,
            variant === 'page' ? 'w-full' : 'w-auto min-w-[8rem] px-6 text-sm',
          )}
        >
          {primaryLabel}
        </button>
      ) : (
        <button
          type="submit"
          disabled={submitting || (!isEditing && !formData.agreeToPrivacy)}
          className={cn(surfaceCtaPrimary, 'w-full')}
        >
          {primaryLabel}
        </button>
      )}
    </div>
  );
}
