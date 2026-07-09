import type { ProfilePetFormData } from './add-edit-pet-form-types';

const toggleBtnClass = (active: boolean) =>
  `px-6 py-3 rounded-lg font-medium transition-colors ${
    active
      ? 'bg-foreground text-background'
      : 'bg-muted text-muted-foreground hover:bg-muted dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80'
  }`;

const inputClass =
  'w-full px-4 py-3 border border-border rounded-lg bg-white dark:bg-input-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent';

export interface AddEditPetStepDetailsProps {
  formData: ProfilePetFormData;
  f: Record<string, string>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onChippedChange: (isChipped: 'yes' | 'no') => void;
}

export function AddEditPetStepDetails({
  formData,
  f,
  onInputChange,
  onChippedChange,
}: AddEditPetStepDetailsProps) {
  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="specialMarks" className="block text-sm font-semibold text-muted-foreground uppercase mb-3">
          {f.labelSpecialMarks}
        </label>
        <textarea
          id="specialMarks"
          name="specialMarks"
          value={formData.specialMarks}
          onChange={onInputChange}
          className={`${inputClass} resize-none`}
          rows={3}
          placeholder={f.placeholderSpecialMarks}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-muted-foreground uppercase mb-3">
          {f.labelChipped}
        </label>
        <div className="flex gap-3 mb-4">
          <button type="button" onClick={() => onChippedChange('yes')} className={toggleBtnClass(formData.isChipped === 'yes')}>
            {f.yes}
          </button>
          <button type="button" onClick={() => onChippedChange('no')} className={toggleBtnClass(formData.isChipped === 'no')}>
            {f.no}
          </button>
        </div>

        {formData.isChipped === 'yes' ? (
          <div>
            <label htmlFor="chipNumber" className="block text-sm font-semibold text-muted-foreground uppercase mb-3">
              {f.labelChipNumber}
            </label>
            <input
              type="text"
              id="chipNumber"
              name="chipNumber"
              value={formData.chipNumber}
              onChange={onInputChange}
              className={inputClass}
              placeholder={f.placeholderChip}
            />
          </div>
        ) : null}
      </div>

      <div className="border-t border-border pt-6 space-y-4">
        <p className="text-sm font-semibold text-muted-foreground uppercase">
          {f.registrationSectionTitle}
        </p>
        <p className="text-xs text-muted-foreground">{f.registrationHint}</p>
        <div>
          <label htmlFor="registrationAuthority" className="block text-sm font-semibold text-muted-foreground uppercase mb-3">
            {f.labelRegistrationAuthority}
          </label>
          <input
            type="text"
            id="registrationAuthority"
            name="registrationAuthority"
            value={formData.registrationAuthority}
            onChange={onInputChange}
            maxLength={300}
            className={inputClass}
            placeholder={f.placeholderRegistrationAuthority}
          />
        </div>
        <div>
          <label htmlFor="registrationTokenNumber" className="block text-sm font-semibold text-muted-foreground uppercase mb-3">
            {f.labelRegistrationToken}
          </label>
          <input
            type="text"
            id="registrationTokenNumber"
            name="registrationTokenNumber"
            value={formData.registrationTokenNumber}
            onChange={onInputChange}
            maxLength={80}
            className={inputClass}
            placeholder={f.placeholderRegistrationToken}
          />
        </div>
      </div>

      <div>
        <label htmlFor="medicalInfo" className="block text-sm font-semibold text-muted-foreground uppercase mb-3">
          {f.labelMedical}
        </label>
        <textarea
          id="medicalInfo"
          name="medicalInfo"
          value={formData.medicalInfo}
          onChange={onInputChange}
          className={`${inputClass} resize-none`}
          rows={3}
          placeholder={f.placeholderMedical}
        />
      </div>
    </div>
  );
}
