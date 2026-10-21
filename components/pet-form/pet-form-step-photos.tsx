import { Upload, X, Sparkles } from 'lucide-react';
import type { ChangeEventHandler } from 'react';
import type { PetStatus } from '../../types/pet';
import { petScenarioFormToggleActiveClass } from '@/shared/lib/pet-helpers';
import { cn } from '@/shared/lib/classNames';
import { formatI18nTemplate } from '@/shared/lib/i18n-template';
import {
  surfaceFieldLabel,
  surfaceUploadZone,
} from '@/shared/styles/surface-classes';
import type { PetFormStepBaseProps } from './pet-form-validation';

export interface PetFormStepPhotosProps extends PetFormStepBaseProps {
  isEditing: boolean;
  initialStatus?: PetStatus;
  maxPhotos: number;
  aiAnalyzing: boolean;
  showAiAssist?: boolean;
  onPhotoUpload: ChangeEventHandler<HTMLInputElement>;
  onAiAnalyze: () => void;
}

export function PetFormStepPhotos({
  variant,
  formData,
  setFormData,
  errors,
  t,
  isEditing,
  initialStatus,
  maxPhotos,
  aiAnalyzing,
  showAiAssist = true,
  onPhotoUpload,
  onAiAnalyze,
}: PetFormStepPhotosProps) {
  return (
    <div>
      {!isEditing && !initialStatus && (
        <div className="mb-6 border-b border-border pb-6">
          <label className={surfaceFieldLabel}>{t.petForm.whatHappened}</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, status: 'searching' })}
              className={cn(
                'flex-1 rounded-xl px-6 py-3 font-medium transition-colors',
                formData.status === 'searching'
                  ? petScenarioFormToggleActiveClass.lost
                  : 'bg-landing-muted/80 text-muted-foreground hover:bg-landing-muted',
              )}
            >
              {t.petForm.statusToggleLost}
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, status: 'found' })}
              className={cn(
                'flex-1 rounded-xl px-6 py-3 font-medium transition-colors',
                formData.status === 'found'
                  ? petScenarioFormToggleActiveClass.found
                  : 'bg-landing-muted/80 text-muted-foreground hover:bg-landing-muted',
              )}
            >
              {t.petForm.statusToggleFound}
            </button>
          </div>
        </div>
      )}
      <div className="mb-4 text-right text-sm text-muted-foreground">
        {formatI18nTemplate(t.petForm.photosUploadedCount, {
          current: formData.photos.length,
          max: maxPhotos,
        })}
      </div>
      <div className="mb-4 grid grid-cols-3 gap-3 sm:gap-4">
        {formData.photos.map((photo, index) => (
          <div key={index} className="group relative aspect-square overflow-hidden rounded-2xl">
            <img
              src={photo}
              alt={formatI18nTemplate(t.petForm.photoAltNumber, { n: index + 1 }, 'Photo')}
              className="size-full object-cover"
            />
            <button
              type="button"
              onClick={() =>
                setFormData({ ...formData, photos: formData.photos.filter((_, i) => i !== index) })
              }
              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X className="size-6 text-white" aria-hidden />
            </button>
          </div>
        ))}
        {formData.photos.length < maxPhotos && formData.photos.length > 0 && (
          <label
            className={cn(
              surfaceUploadZone,
              'aspect-square cursor-pointer text-muted-foreground hover:text-primary',
            )}
          >
            <Upload className="mb-2 size-6" aria-hidden />
            <input type="file" accept="image/*" multiple onChange={onPhotoUpload} className="hidden" />
          </label>
        )}
      </div>
      {formData.photos.length === 0 && (
        <label
          className={cn(
            surfaceUploadZone,
            'h-64 w-full cursor-pointer',
            errors.photos && 'border-destructive bg-destructive/5',
          )}
        >
          <Upload size={48} className="mb-4 text-muted-foreground" aria-hidden />
          <span className="font-medium text-foreground">{t.petForm.uploadPhotoHint}</span>
          <span className="mt-2 text-sm text-muted-foreground">{t.petForm.uploadPhotoDrag}</span>
          <input type="file" accept="image/*" multiple onChange={onPhotoUpload} className="hidden" />
        </label>
      )}
      {formData.photos.length >= maxPhotos && (
        <p className="py-1 text-center text-sm text-muted-foreground">{t.petForm.maxPhotosReached}</p>
      )}
      {formData.photos.length > 0 && showAiAssist ? (
        <p className="mb-3 text-center text-xs text-muted-foreground">{t.petForm.aiAutoHint}</p>
      ) : null}
      {formData.photos.length > 0 && showAiAssist ? (
        <button
          type="button"
          onClick={onAiAnalyze}
          disabled={aiAnalyzing}
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-60"
        >
          <Sparkles className="size-4 shrink-0" aria-hidden />
          {aiAnalyzing ? t.petForm.aiAnalyzing : t.petForm.aiSuggestFromPhoto}
        </button>
      ) : null}
      {errors.photos && <p className="mt-1 text-xs text-destructive">{errors.photos}</p>}
    </div>
  );
}
