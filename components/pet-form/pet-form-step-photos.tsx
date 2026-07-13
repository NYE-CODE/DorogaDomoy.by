import { Upload, X, Sparkles } from 'lucide-react';
import type { ChangeEventHandler } from 'react';
import type { PetStatus } from '../../types/pet';
import { petScenarioFormToggleActiveClass } from '@/shared/lib/pet-helpers';
import type { PetFormStepBaseProps } from './pet-form-validation';
import { formatI18nTemplate } from '@/shared/lib/i18n-template';

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
        <div className="mb-6 pb-6 border-b border-border">
          <label className="block text-sm font-semibold text-muted-foreground uppercase mb-3">
            {t.petForm.whatHappened}
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, status: 'searching' })}
              className={`flex-1 rounded-lg px-6 py-3 font-medium transition-colors ${
                formData.status === 'searching'
                  ? petScenarioFormToggleActiveClass.lost
                  : 'bg-muted text-muted-foreground hover:bg-muted dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80'
              }`}
            >
              {t.petForm.statusToggleLost}
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, status: 'found' })}
              className={`flex-1 rounded-lg px-6 py-3 font-medium transition-colors ${
                formData.status === 'found'
                  ? petScenarioFormToggleActiveClass.found
                  : 'bg-muted text-muted-foreground hover:bg-muted dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80'
              }`}
            >
              {t.petForm.statusToggleFound}
            </button>
          </div>
        </div>
      )}
      <div className="text-right text-sm text-muted-foreground mb-4">
        {formatI18nTemplate(t.petForm.photosUploadedCount, {
          current: formData.photos.length,
          max: maxPhotos,
        })}
      </div>
      <div className="grid grid-cols-3 gap-4 mb-4">
        {formData.photos.map((photo, index) => (
          <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
            <img
              src={photo}
              alt={formatI18nTemplate(t.petForm.photoAltNumber, { n: index + 1 }, 'Photo')}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => setFormData({ ...formData, photos: formData.photos.filter((_, i) => i !== index) })}
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        ))}
        {formData.photos.length < maxPhotos && formData.photos.length > 0 && (
          <label className="aspect-square rounded-lg border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary hover:bg-muted/50/50 flex flex-col items-center justify-center transition-colors text-muted-foreground hover:text-primary">
            <Upload className="w-6 h-6 mb-2" />
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={onPhotoUpload}
              className="hidden"
            />
          </label>
        )}
      </div>
      {formData.photos.length === 0 && (
        <label className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary hover:bg-muted/50/50 transition-colors ${errors.photos ? '!border-destructive bg-red-50/50 dark:bg-red-950/20' : ''}`}>
          <Upload size={48} className="text-muted-foreground mb-4" />
          <span className="text-muted-foreground dark:text-foreground font-medium">{t.petForm.uploadPhotoHint}</span>
          <span className="text-sm text-muted-foreground mt-2">{t.petForm.uploadPhotoDrag}</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={onPhotoUpload}
            className="hidden"
          />
        </label>
      )}
      {formData.photos.length >= maxPhotos && (
        <p className="text-sm text-muted-foreground text-center py-1">{t.petForm.maxPhotosReached}</p>
      )}
      {formData.photos.length > 0 && showAiAssist ? (
        <p className="mb-3 text-center text-xs text-muted-foreground">{t.petForm.aiAutoHint}</p>
      ) : null}
      {formData.photos.length > 0 && showAiAssist ? (
        <button
          type="button"
          onClick={onAiAnalyze}
          disabled={aiAnalyzing}
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-60"
        >
          <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
          {aiAnalyzing ? t.petForm.aiAnalyzing : t.petForm.aiSuggestFromPhoto}
        </button>
      ) : null}
      {errors.photos && <p className="text-xs text-red-500 mt-1">{errors.photos}</p>}
    </div>
  );
}
