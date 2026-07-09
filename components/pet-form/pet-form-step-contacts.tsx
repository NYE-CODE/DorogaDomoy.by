import { Link } from 'react-router';
import { BELARUS_MOBILE_PHONE_PLACEHOLDER } from '../../utils/belarus-phone';
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
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-muted-foreground uppercase mb-3">{t.petForm.contactsForLink}</label>
        <div className="space-y-3">
          <label className="flex items-center gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/50 dark:hover:bg-muted/10 transition-colors">
            <input
              type="radio"
              name="contactSource"
              checked={formData.useProfileContacts === true}
              onChange={() => setFormData({ ...formData, useProfileContacts: true })}
              className="w-4 h-4 text-primary"
            />
            <span className="text-foreground/90">{t.petForm.useMyContacts}</span>
          </label>
          <label className="flex items-center gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/50 dark:hover:bg-muted/10 transition-colors">
            <input
              type="radio"
              name="contactSource"
              checked={formData.useProfileContacts === false}
              onChange={() => setFormData({ ...formData, useProfileContacts: false })}
              className="w-4 h-4 text-primary"
            />
            <span className="text-foreground/90">{t.petForm.newContacts}</span>
          </label>
        </div>
        {errors.profileContacts && (
          <p className="text-xs text-red-500 mt-2">{errors.profileContacts}</p>
        )}
      </div>
      {!formData.useProfileContacts && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground/90 mb-2">{t.petForm.contactNameLabel} *</label>
            <input
              type="text"
              value={formData.contactName ?? ''}
              onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              placeholder={t.petForm.contactNamePlaceholder}
              className={variant === 'page' ? `w-full px-4 py-3 border rounded-lg bg-input-background dark:bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.contactName ? 'border-destructive' : 'border-border'}` : `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.contactName ? 'border-destructive' : 'border-border dark:border-border'}`}
            />
            {errors.contactName && <p className="text-xs text-red-500 mt-1">{errors.contactName}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground/90 mb-2">{t.petForm.contactPhoneLabel} *</label>
            <input
              type="tel"
              value={formData.contactPhone ?? ''}
              onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              placeholder={BELARUS_MOBILE_PHONE_PLACEHOLDER}
              className={variant === 'page' ? `w-full px-4 py-3 border rounded-lg bg-input-background dark:bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.contactPhone ? 'border-destructive' : 'border-border'}` : `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.contactPhone ? 'border-destructive' : 'border-border dark:border-border'}`}
            />
            {errors.contactPhone && <p className="text-xs text-red-500 mt-1">{errors.contactPhone}</p>}
          </div>
        </div>
      )}
      {!isEditing && (
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!formData.agreeToPrivacy}
            onChange={(e) => setFormData({ ...formData, agreeToPrivacy: e.target.checked })}
            className="mt-1 w-4 h-4 text-primary rounded border-border"
          />
          <span className="text-sm text-muted-foreground">
            {t.petForm.agreePrivacy}{' '}
            <Link to="/privacy" className="text-primary hover:underline">
              {t.petForm.privacyPolicyLink}
            </Link>
          </span>
        </label>
      )}
      {!isEditing && errors.agreeToPrivacy && <p className="text-xs text-red-500 mt-1">{errors.agreeToPrivacy}</p>}
    </div>
  );
}
