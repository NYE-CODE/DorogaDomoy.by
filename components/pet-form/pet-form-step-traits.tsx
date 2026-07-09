import type { Dispatch, SetStateAction } from 'react';
import type { PetColor } from '../../types/pet';
import { BreedCombobox } from '../breed-combobox';
import { CAT_BREEDS, DOG_BREEDS } from '../../utils/breeds';
import type { AiFilledAdFields } from '@/shared/lib/ai-photo-analyze';
import { AiFieldBadge } from './pet-form-ai-field-badge';
import { agePresetValues, animalTypeOptions, genderOptions } from './pet-form-constants';
import type { PetFormStepBaseProps } from './pet-form-validation';

export interface PetFormStepTraitsProps extends PetFormStepBaseProps {
  isMobile: boolean;
  aiDescriptionBanner: boolean;
  aiFilledFields: AiFilledAdFields;
  setAiFilledFields: Dispatch<SetStateAction<AiFilledAdFields>>;
  onGoToDescription: () => void;
  onToggleColor: (color: PetColor) => void;
  getAgeLabel: (value: string, short: boolean) => string;
}

export function PetFormStepTraits({
  variant,
  formData,
  setFormData,
  errors,
  t,
  isMobile,
  aiDescriptionBanner,
  aiFilledFields,
  setAiFilledFields,
  onGoToDescription,
  onToggleColor,
  getAgeLabel,
}: PetFormStepTraitsProps) {
  return (
    <div className="space-y-6">
      {aiDescriptionBanner && formData.description?.trim() ? (
        <div
          role="status"
          className="rounded-lg border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-foreground"
        >
          <p className="font-medium">{t.petForm.aiDescriptionBannerTitle}</p>
          <p className="mt-1 text-muted-foreground line-clamp-2">{formData.description}</p>
          <button
            type="button"
            onClick={onGoToDescription}
            className="mt-2 text-sm font-medium text-primary hover:underline"
          >
            {t.petForm.aiDescriptionBannerAction}
          </button>
        </div>
      ) : null}
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="shrink-0">
          <label className="block text-sm font-semibold text-muted-foreground uppercase mb-3">
            {t.petForm.whoIsThis}
            <AiFieldBadge show={aiFilledFields.animalType} label={t.petForm.aiFieldBadge} />
          </label>
          <div className={`flex gap-3 ${variant === 'page' ? '' : 'bg-muted rounded-lg p-0.5'}`}>
            {animalTypeOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFormData({ ...formData, animalType: opt.value, breed: '' })}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                  variant === 'page'
                    ? formData.animalType === opt.value
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-muted-foreground hover:bg-muted dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80'
                    : formData.animalType === opt.value
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                } ${variant === 'page' ? 'text-sm' : 'px-3 py-1.5 text-sm'}`}
              >
                <span className="text-base leading-none">{opt.icon}</span>
                {(opt.value === 'cat' || opt.value === 'dog') && isMobile ? null : (
                  <span>{t.pet.animalType[opt.value]}</span>
                )}
              </button>
            ))}
          </div>
          {errors.animalType && <p className="text-xs text-red-500 mt-1">{errors.animalType}</p>}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wide">
            {t.petForm.breedLabel} <span className="text-red-500">*</span>
            <AiFieldBadge show={aiFilledFields.breed} label={t.petForm.aiFieldBadge} />
          </span>
          <div className="mt-1.5">
            {formData.animalType === 'other' ? (
              <input
                type="text"
                value={formData.breed}
                onChange={(e) => {
                  setFormData({ ...formData, breed: e.target.value.slice(0, 80) });
                  setAiFilledFields((prev) => ({ ...prev, breed: false }));
                }}
                placeholder={t.petForm.otherBreedPlaceholder}
                maxLength={80}
                className={variant === 'page' ? 'w-full px-4 py-3 border border-black/10 dark:border-border rounded-lg bg-input-background dark:bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent' : 'w-full px-4 py-3 border border-border dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'}
              />
            ) : (
              <BreedCombobox
                breeds={formData.animalType === 'cat' ? CAT_BREEDS : DOG_BREEDS}
                value={formData.breed}
                onChange={(breed) => {
                  setFormData({ ...formData, breed });
                  setAiFilledFields((prev) => ({ ...prev, breed: false }));
                }}
                placeholder={t.petForm.selectOrEnterBreed}
                className={variant === 'page' ? 'bg-input-background dark:bg-input-background border-black/10 dark:border-border' : undefined}
              />
            )}
          </div>
          {errors.breed && <p className="text-xs text-red-500 mt-1">{errors.breed}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-muted-foreground uppercase mb-3">
          {t.petForm.colorLabel}
          <AiFieldBadge show={aiFilledFields.colors} label={t.petForm.aiFieldBadge} />
        </label>
        <div className={`flex flex-wrap gap-2 mt-1.5 ${errors.colors ? 'ring-2 ring-red-300 bg-red-50/50 dark:bg-red-900/20 p-2 rounded-md' : ''}`}>
          {(Object.keys(t.pet.color) as PetColor[]).map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onToggleColor(color)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                variant === 'page'
                  ? formData.colors.includes(color)
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-muted-foreground hover:bg-muted dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80'
                  : formData.colors.includes(color)
                    ? 'bg-muted text-muted-foreground border border-border'
                    : 'bg-card text-foreground border border-border hover:bg-muted hover:border-border'
              }`}
            >
              {t.pet.color[color]}
            </button>
          ))}
        </div>
        {errors.colors && <p className="text-xs text-red-500 mt-1">{errors.colors}</p>}
      </div>

      <div className="flex flex-col gap-6">
        <div>
          <label className="block text-sm font-semibold text-muted-foreground uppercase mb-3">
            {t.petForm.genderLabel}
            <AiFieldBadge show={aiFilledFields.gender} label={t.petForm.aiFieldBadge} />
          </label>
          <div className={`flex gap-3 ${variant === 'page' ? '' : 'bg-muted rounded-lg p-0.5 w-fit'}`}>
            {genderOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFormData({ ...formData, gender: opt.value })}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  variant === 'page'
                    ? formData.gender === opt.value
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-muted-foreground hover:bg-muted dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80'
                    : formData.gender === opt.value
                      ? 'bg-card text-foreground shadow-sm px-3 py-1.5'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground px-3 py-1.5'
                }`}
              >
                {isMobile && opt.value === 'unknown'
                  ? t.pet.gender.unknownShort
                  : t.pet.gender[opt.value]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-muted-foreground uppercase mb-3">
            {t.petForm.ageLabel}
            <AiFieldBadge show={aiFilledFields.approximateAge} label={t.petForm.aiFieldBadge} />
          </label>
          {variant === 'page' ? (
            <div className="flex gap-3">
              {agePresetValues.map((value) => (
                <button
                  key={value || 'empty'}
                  type="button"
                  onClick={() => setFormData({ ...formData, approximateAge: value })}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    (formData.approximateAge === value || (value === '' && !formData.approximateAge))
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-muted-foreground hover:bg-muted dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80'
                  }`}
                >
                  {getAgeLabel(value, isMobile)}
                </button>
              ))}
            </div>
          ) : (
            <input
              type="text"
              value={formData.approximateAge}
              onChange={(e) => setFormData({ ...formData, approximateAge: e.target.value })}
              placeholder={t.petForm.ageExamplePlaceholder}
              className="block mt-1.5 w-full px-4 py-3 border border-border dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          )}
        </div>
      </div>
    </div>
  );
}
