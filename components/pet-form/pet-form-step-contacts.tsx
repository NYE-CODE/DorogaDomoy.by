import { Link } from 'react-router';
import { BELARUS_MOBILE_PHONE_PLACEHOLDER } from '../../utils/belarus-phone';
import { cn } from '@/shared/lib/classNames';
import {
  surfaceFieldLabel,
  surfaceInput,
  surfaceSelectRow,
} from '@/shared/styles/surface-classes';
import type { PetFormStepBaseProps } from './pet-form-validation';

export interface PetFormStepContactsProps extends PetFormStepBaseProps {
  isEditing: boolean;
}

export function PetFormStepContacts({
  variant,
  formData,
  setFormData,
  errors,
  t,
  isEditing,
}: PetFormStepContactsProps) {
  const inputClass = (hasError: boolean) =>
    variant === 'page'
      ? cn(surfaceInput, hasError && 'border-destructive')
      : cn(
          'w-full rounded-lg border px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary',
          hasError ? 'border-destructive' : 'border-border',
        );

  return (
    <div className="space-y-6">
      <div>
        <label className={surfaceFieldLabel}>{t.petForm.contactsForLink}</label>
        <div className="space-y-3">
          <label className={variant === 'page' ? surfaceSelectRow : 'flex cursor-pointer items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50'}>
            <input
              type="radio"
              name="contactSource"
              checked={formData.useProfileContacts === true}
              onChange={() => setFormData({ ...formData, useProfileContacts: true })}
              className="size-4 text-primary"
            />
            <span className="text-foreground/90">{t.petForm.useMyContacts}</span>
          </label>
          <label className={variant === 'page' ? surfaceSelectRow : 'flex cursor-pointer items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50'}>
            <input
              type="radio"
              name="contactSource"
              checked={formData.useProfileContacts === false}
              onChange={() => setFormData({ ...formData, useProfileContacts: false })}
              className="size-4 text-primary"
            />
            <span className="text-foreground/90">{t.petForm.newContacts}</span>
          </label>
        </div>
        {errors.profileContacts && (
          <p className="mt-2 text-xs text-destructive">{errors.profileContacts}</p>
        )}
      </div>
      {!formData.useProfileContacts && (
        <div className="space-y-4">
          <div>
            <label className={surfaceFieldLabel}>
              {t.petForm.contactNameLabel} *
            </label>
            <input
              type="text"
              value={formData.contactName ?? ''}
              onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              placeholder={t.petForm.contactNamePlaceholder}
              className={inputClass(Boolean(errors.contactName))}
            />
            {errors.contactName && (
              <p className="mt-1 text-xs text-destructive">{errors.contactName}</p>
            )}
          </div>
          <div>
            <label className={surfaceFieldLabel}>
              {t.petForm.contactPhoneLabel} *
            </label>
            <input
              type="tel"
              value={formData.contactPhone ?? ''}
              onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              placeholder={BELARUS_MOBILE_PHONE_PLACEHOLDER}
              className={inputClass(Boolean(errors.contactPhone))}
            />
            {errors.contactPhone && (
              <p className="mt-1 text-xs text-destructive">{errors.contactPhone}</p>
            )}
          </div>
        </div>
      )}
      {!isEditing && (
        <label className="flex cursor-pointer items-start gap-2">
          <input
            type="checkbox"
            checked={!!formData.agreeToPrivacy}
            onChange={(e) => setFormData({ ...formData, agreeToPrivacy: e.target.checked })}
            className="mt-1 size-4 rounded border-border text-primary"
          />
          <span className="text-sm text-muted-foreground">
            {t.petForm.agreePrivacy}{' '}
            <Link to="/privacy" className="text-primary hover:underline">
              {t.petForm.privacyPolicyLink}
            </Link>
          </span>
        </label>
      )}
      {!isEditing && errors.agreeToPrivacy && (
        <p className="mt-1 text-xs text-destructive">{errors.agreeToPrivacy}</p>
      )}
    </div>
  );
}
