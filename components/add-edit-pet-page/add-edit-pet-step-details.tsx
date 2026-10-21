import { cn } from '@/shared/lib/classNames';
import type { ProfilePetFormData } from './add-edit-pet-form-types';
import {
  profilePetField,
  profilePetFieldLabel,
  profilePetInput,
  profilePetSegmentClass,
  profilePetSegmentTrack,
  profilePetTextarea,
} from './add-edit-pet-form-styles';

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
    <div className="space-y-5">
      <div className={profilePetField}>
        <label htmlFor="specialMarks" className={profilePetFieldLabel}>
          {f.labelSpecialMarks}
        </label>
        <textarea
          id="specialMarks"
          name="specialMarks"
          value={formData.specialMarks}
          onChange={onInputChange}
          className={profilePetTextarea}
          rows={3}
          placeholder={f.placeholderSpecialMarks}
        />
      </div>

      <div className={profilePetField}>
        <label className={profilePetFieldLabel}>{f.labelChipped}</label>
        <div className={cn(profilePetSegmentTrack, 'mb-3 grid-cols-2')}>
          <button
            type="button"
            onClick={() => onChippedChange('yes')}
            className={profilePetSegmentClass(formData.isChipped === 'yes')}
          >
            {f.yes}
          </button>
          <button
            type="button"
            onClick={() => onChippedChange('no')}
            className={profilePetSegmentClass(formData.isChipped === 'no')}
          >
            {f.no}
          </button>
        </div>

        {formData.isChipped === 'yes' ? (
          <div className={profilePetField}>
            <label htmlFor="chipNumber" className={profilePetFieldLabel}>
              {f.labelChipNumber}
            </label>
            <input
              type="text"
              id="chipNumber"
              name="chipNumber"
              value={formData.chipNumber}
              onChange={onInputChange}
              className={profilePetInput}
              placeholder={f.placeholderChip}
            />
          </div>
        ) : null}
      </div>

      <div className="space-y-4 border-t border-border/60 pt-5">
        <div className={profilePetField}>
          <p className={profilePetFieldLabel}>{f.registrationSectionTitle}</p>
          <p className="text-xs text-muted-foreground">{f.registrationHint}</p>
        </div>
        <div className={profilePetField}>
          <label htmlFor="registrationAuthority" className={profilePetFieldLabel}>
            {f.labelRegistrationAuthority}
          </label>
          <input
            type="text"
            id="registrationAuthority"
            name="registrationAuthority"
            value={formData.registrationAuthority}
            onChange={onInputChange}
            maxLength={300}
            className={profilePetInput}
            placeholder={f.placeholderRegistrationAuthority}
          />
        </div>
        <div className={profilePetField}>
          <label htmlFor="registrationTokenNumber" className={profilePetFieldLabel}>
            {f.labelRegistrationToken}
          </label>
          <input
            type="text"
            id="registrationTokenNumber"
            name="registrationTokenNumber"
            value={formData.registrationTokenNumber}
            onChange={onInputChange}
            maxLength={80}
            className={profilePetInput}
            placeholder={f.placeholderRegistrationToken}
          />
        </div>
      </div>

      <div className={profilePetField}>
        <label htmlFor="medicalInfo" className={profilePetFieldLabel}>
          {f.labelMedical}
        </label>
        <textarea
          id="medicalInfo"
          name="medicalInfo"
          value={formData.medicalInfo}
          onChange={onInputChange}
          className={profilePetTextarea}
          rows={3}
          placeholder={f.placeholderMedical}
        />
      </div>
    </div>
  );
}
