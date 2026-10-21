import { Bird, Cat, Dog, type LucideIcon } from 'lucide-react';
import { BreedCombobox } from '../breed-combobox';
import { cn } from '@/shared/lib/classNames';
import type { ProfilePetFormData } from './add-edit-pet-form-types';
import { getProfilePetBreedOptions } from './add-edit-pet-form-types';
import {
  profilePetField,
  profilePetFieldLabel,
  profilePetInput,
  profilePetSegmentClass,
  profilePetSegmentTrack,
  profilePetTagClass,
} from './add-edit-pet-form-styles';

const SPECIES_OPTIONS: {
  value: 'cat' | 'dog' | 'other';
  labelKey: 'speciesCat' | 'speciesDog' | 'speciesOther';
  icon: LucideIcon;
}[] = [
  { value: 'cat', labelKey: 'speciesCat', icon: Cat },
  { value: 'dog', labelKey: 'speciesDog', icon: Dog },
  { value: 'other', labelKey: 'speciesOther', icon: Bird },
];

export interface AddEditPetStepBasicProps {
  formData: ProfilePetFormData;
  f: Record<string, string | readonly string[]>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onSpeciesChange: (species: 'dog' | 'cat' | 'other') => void;
  onBreedChange: (breed: string) => void;
  onGenderChange: (gender: 'male' | 'female') => void;
  onToggleColor: (color: string) => void;
}

export function AddEditPetStepBasic({
  formData,
  f,
  onInputChange,
  onSpeciesChange,
  onBreedChange,
  onGenderChange,
  onToggleColor,
}: AddEditPetStepBasicProps) {
  const breedOptions = getProfilePetBreedOptions(formData.species, f);

  return (
    <div className="space-y-5">
      <div className={profilePetField}>
        <label htmlFor="name" className={profilePetFieldLabel}>
          {f.labelName as string} <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={onInputChange}
          className={profilePetInput}
          placeholder={f.placeholderName as string}
        />
      </div>

      <div className={profilePetField}>
        <label className={profilePetFieldLabel}>
          {f.labelSpecies as string} <span className="text-destructive">*</span>
        </label>
        <div className={cn(profilePetSegmentTrack, 'grid-cols-3')}>
          {SPECIES_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSpeciesChange(opt.value)}
              className={profilePetSegmentClass(formData.species === opt.value)}
            >
              <opt.icon size={15} className="shrink-0 opacity-80" aria-hidden />
              <span className="truncate">{f[opt.labelKey] as string}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={profilePetField}>
        <label htmlFor="breed" className={profilePetFieldLabel}>
          {f.labelBreed as string} <span className="text-destructive">*</span>
        </label>
        {formData.species === 'other' ? (
          <input
            type="text"
            id="breed"
            name="breed"
            value={formData.breed}
            onChange={onInputChange}
            className={profilePetInput}
            placeholder={f.breedOtherPlaceholder as string}
          />
        ) : (
          <BreedCombobox
            breeds={breedOptions}
            value={formData.breed}
            onChange={onBreedChange}
            placeholder={f.selectBreed as string}
            className="h-11 min-h-11 rounded-lg border-border bg-card py-0"
          />
        )}
      </div>

      <div className={profilePetField}>
        <label className={profilePetFieldLabel}>
          {f.labelGender as string} <span className="text-destructive">*</span>
        </label>
        <div className={cn(profilePetSegmentTrack, 'grid-cols-2')}>
          <button
            type="button"
            onClick={() => onGenderChange('male')}
            className={profilePetSegmentClass(formData.gender === 'male')}
          >
            {f.genderMale as string}
          </button>
          <button
            type="button"
            onClick={() => onGenderChange('female')}
            className={profilePetSegmentClass(formData.gender === 'female')}
          >
            {f.genderFemale as string}
          </button>
        </div>
      </div>

      <div className={profilePetField}>
        <label htmlFor="age" className={profilePetFieldLabel}>
          {f.labelAge as string} <span className="text-destructive">*</span>
        </label>
        <input
          type="number"
          id="age"
          name="age"
          value={formData.age}
          onChange={onInputChange}
          className={profilePetInput}
          placeholder={f.placeholderAge as string}
          min={0}
          max={30}
        />
      </div>

      <div className={profilePetField}>
        <label className={profilePetFieldLabel}>{f.labelColors as string}</label>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {(f.colorOptions as readonly string[]).map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onToggleColor(color)}
              className={profilePetTagClass(formData.colors.includes(color))}
            >
              {color}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
