import { cn } from '@/shared/lib/classNames';
import type { ProfilePetFormData } from './add-edit-pet-form-types';
import {
  profilePetField,
  profilePetFieldLabel,
  profilePetInput,
  profilePetSegmentClass,
  profilePetSegmentTrack,
  profilePetTagClass,
} from './add-edit-pet-form-styles';

export interface AddEditPetStepTemperamentProps {
  formData: ProfilePetFormData;
  f: {
    labelTemperament: string;
    temperamentOptions: readonly { value: string; label: string }[];
    labelRespondsToName: string;
    yes: string;
    no: string;
    labelTreats: string;
    placeholderTreats: string;
    labelWalks: string;
    placeholderWalks: string;
  };
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onTemperamentChange: (value: string) => void;
  onRespondsToNameChange: (value: 'yes' | 'no') => void;
}

export function AddEditPetStepTemperament({
  formData,
  f,
  onInputChange,
  onTemperamentChange,
  onRespondsToNameChange,
}: AddEditPetStepTemperamentProps) {
  return (
    <div className="space-y-5">
      <div className={profilePetField}>
        <label className={profilePetFieldLabel}>{f.labelTemperament}</label>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {f.temperamentOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onTemperamentChange(option.value)}
              className={profilePetTagClass(formData.temperament === option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className={profilePetField}>
        <label className={profilePetFieldLabel}>{f.labelRespondsToName}</label>
        <div className={cn(profilePetSegmentTrack, 'grid-cols-2')}>
          <button
            type="button"
            onClick={() => onRespondsToNameChange('yes')}
            className={profilePetSegmentClass(formData.respondsToName === 'yes')}
          >
            {f.yes}
          </button>
          <button
            type="button"
            onClick={() => onRespondsToNameChange('no')}
            className={profilePetSegmentClass(formData.respondsToName === 'no')}
          >
            {f.no}
          </button>
        </div>
      </div>

      <div className={profilePetField}>
        <label htmlFor="favoriteTreats" className={profilePetFieldLabel}>
          {f.labelTreats}
        </label>
        <input
          type="text"
          id="favoriteTreats"
          name="favoriteTreats"
          value={formData.favoriteTreats}
          onChange={onInputChange}
          className={profilePetInput}
          placeholder={f.placeholderTreats}
        />
      </div>

      <div className={profilePetField}>
        <label htmlFor="favoriteWalks" className={profilePetFieldLabel}>
          {f.labelWalks}
        </label>
        <input
          type="text"
          id="favoriteWalks"
          name="favoriteWalks"
          value={formData.favoriteWalks}
          onChange={onInputChange}
          className={profilePetInput}
          placeholder={f.placeholderWalks}
        />
      </div>
    </div>
  );
}
