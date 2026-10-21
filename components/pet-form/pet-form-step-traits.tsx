import type { Dispatch, SetStateAction } from 'react';
import type { PetColor } from '../../types/pet';
import { BreedCombobox } from '../breed-combobox';
import { CAT_BREEDS, DOG_BREEDS } from '../../utils/breeds';
import type { AiFilledAdFields } from '@/shared/lib/ai-photo-analyze';
import { cn } from '@/shared/lib/classNames';
import {
  surfaceChip,
  surfaceChipActive,
  surfaceChipIdle,
  surfaceFieldLabel,
  surfaceInput,
} from '@/shared/styles/surface-classes';
import { AiFieldBadge } from './pet-form-ai-field-badge';
import { agePresetValues, animalTypeOptions, genderOptions } from './pet-form-constants';
import type { PetFormStepBaseProps } from './pet-form-validation';

function pageChipClass(active: boolean) {
  return cn(surfaceChip, active ? surfaceChipActive : surfaceChipIdle);
}

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
          className="rounded-2xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-foreground"
        >
          <p className="font-medium">{t.petForm.aiDescriptionBannerTitle}</p>
          <p className="mt-1 line-clamp-2 text-muted-foreground">{formData.description}</p>
          <button
            type="button"
            onClick={onGoToDescription}
            className="mt-2 text-sm font-medium text-primary hover:underline"
          >
            {t.petForm.aiDescriptionBannerAction}
          </button>
        </div>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="shrink-0">
          <label className={surfaceFieldLabel}>
            {t.petForm.whoIsThis}
            <AiFieldBadge show={aiFilledFields.animalType} label={t.petForm.aiFieldBadge} />
          </label>
          <div className={`flex gap-2 ${variant === 'page' ? '' : 'rounded-lg bg-muted p-0.5'}`}>
            {animalTypeOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFormData({ ...formData, animalType: opt.value, breed: '' })}
                className={
                  variant === 'page'
                    ? cn(pageChipClass(formData.animalType === opt.value), 'gap-2')
                    : cn(
                        'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                        formData.animalType === opt.value
                          ? 'bg-card text-foreground shadow-sm'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )
                }
              >
                <span className="text-base leading-none">{opt.icon}</span>
                {(opt.value === 'cat' || opt.value === 'dog') && isMobile ? null : (
                  <span>{t.pet.animalType[opt.value]}</span>
                )}
              </button>
            ))}
          </div>
          {errors.animalType && <p className="mt-1 text-xs text-destructive">{errors.animalType}</p>}
        </div>
        <div className="min-w-0 flex-1">
          <span className={surfaceFieldLabel}>
            {t.petForm.breedLabel} <span className="text-destructive">*</span>
            <AiFieldBadge show={aiFilledFields.breed} label={t.petForm.aiFieldBadge} />
          </span>
          <div className="mt-0">
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
                className={
                  variant === 'page'
                    ? surfaceInput
                    : 'w-full rounded-lg border border-border px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary'
                }
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
                className={variant === 'page' ? 'rounded-xl border-border bg-card' : undefined}
              />
            )}
          </div>
          {errors.breed && <p className="mt-1 text-xs text-destructive">{errors.breed}</p>}
        </div>
      </div>

      <div>
        <label className={surfaceFieldLabel}>
          {t.petForm.colorLabel}
          <AiFieldBadge show={aiFilledFields.colors} label={t.petForm.aiFieldBadge} />
        </label>
        <div
          className={cn(
            'mt-0 flex flex-wrap gap-2',
            errors.colors && 'rounded-xl bg-destructive/5 p-2 ring-2 ring-destructive/30',
          )}
        >
          {(Object.keys(t.pet.color) as PetColor[]).map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onToggleColor(color)}
              className={
                variant === 'page'
                  ? pageChipClass(formData.colors.includes(color))
                  : cn(
                      'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                      formData.colors.includes(color)
                        ? 'border-border bg-muted text-muted-foreground'
                        : 'border-border bg-card text-foreground hover:bg-muted',
                    )
              }
            >
              {t.pet.color[color]}
            </button>
          ))}
        </div>
        {errors.colors && <p className="mt-1 text-xs text-destructive">{errors.colors}</p>}
      </div>

      <div className="flex flex-col gap-6">
        <div>
          <label className={surfaceFieldLabel}>
            {t.petForm.genderLabel}
            <AiFieldBadge show={aiFilledFields.gender} label={t.petForm.aiFieldBadge} />
          </label>
          <div className={`flex flex-wrap gap-2 ${variant === 'page' ? '' : 'w-fit rounded-lg bg-muted p-0.5'}`}>
            {genderOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFormData({ ...formData, gender: opt.value })}
                className={
                  variant === 'page'
                    ? pageChipClass(formData.gender === opt.value)
                    : cn(
                        'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                        formData.gender === opt.value
                          ? 'bg-card text-foreground shadow-sm'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )
                }
              >
                {isMobile && opt.value === 'unknown'
                  ? t.pet.gender.unknownShort
                  : t.pet.gender[opt.value]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={surfaceFieldLabel}>
            {t.petForm.ageLabel}
            <AiFieldBadge show={aiFilledFields.approximateAge} label={t.petForm.aiFieldBadge} />
          </label>
          {variant === 'page' ? (
            <div className="flex flex-wrap gap-2">
              {agePresetValues.map((value) => (
                <button
                  key={value || 'empty'}
                  type="button"
                  onClick={() => setFormData({ ...formData, approximateAge: value })}
                  className={pageChipClass(
                    formData.approximateAge === value || (value === '' && !formData.approximateAge),
                  )}
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
              className="mt-1.5 block w-full rounded-lg border border-border px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
            />
          )}
        </div>
      </div>
    </div>
  );
}
