import type { ProfilePetFormData } from './add-edit-pet-form-types';
import { getProfilePetBreedOptions } from './add-edit-pet-form-types';

const speciesBtnClass = (active: boolean) =>
  `flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
    active
      ? 'bg-foreground text-background'
      : 'bg-muted text-muted-foreground hover:bg-muted dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80'
  }`;

const toggleBtnClass = (active: boolean) =>
  `px-6 py-3 rounded-lg font-medium transition-colors ${
    active
      ? 'bg-foreground text-background'
      : 'bg-muted text-muted-foreground hover:bg-muted dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80'
  }`;

const colorBtnClass = (active: boolean) =>
  `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
    active
      ? 'bg-foreground text-background'
      : 'bg-muted text-muted-foreground hover:bg-muted dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80'
  }`;

const inputClass =
  'w-full px-4 py-3 border border-border rounded-lg bg-white dark:bg-input-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent';

export interface AddEditPetStepBasicProps {
  formData: ProfilePetFormData;
  f: Record<string, string | readonly string[]>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onSpeciesChange: (species: 'dog' | 'cat' | 'other') => void;
  onGenderChange: (gender: 'male' | 'female') => void;
  onToggleColor: (color: string) => void;
}

export function AddEditPetStepBasic({
  formData,
  f,
  onInputChange,
  onSpeciesChange,
  onGenderChange,
  onToggleColor,
}: AddEditPetStepBasicProps) {
  const breedOptions = getProfilePetBreedOptions(formData.species, f);

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-muted-foreground uppercase mb-3">
          {f.labelName as string} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={onInputChange}
          className={inputClass}
          placeholder={f.placeholderName as string}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-muted-foreground uppercase mb-3">
          {f.labelSpecies as string} <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => onSpeciesChange('cat')} className={speciesBtnClass(formData.species === 'cat')}>
            {f.speciesCat as string}
          </button>
          <button type="button" onClick={() => onSpeciesChange('dog')} className={speciesBtnClass(formData.species === 'dog')}>
            {f.speciesDog as string}
          </button>
          <button type="button" onClick={() => onSpeciesChange('other')} className={speciesBtnClass(formData.species === 'other')}>
            {f.speciesOther as string}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="breed" className="block text-sm font-semibold text-muted-foreground uppercase mb-3">
          {f.labelBreed as string} <span className="text-red-500">*</span>
        </label>
        {formData.species === 'other' ? (
          <input
            type="text"
            id="breed"
            name="breed"
            value={formData.breed}
            onChange={onInputChange}
            className={inputClass}
            placeholder={f.breedOtherPlaceholder as string}
          />
        ) : (
          <select id="breed" name="breed" value={formData.breed} onChange={onInputChange} className={inputClass}>
            <option value="">{f.selectBreed as string}</option>
            {breedOptions.map((breed) => (
              <option key={breed} value={breed}>
                {breed}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-muted-foreground uppercase mb-3">
          {f.labelGender as string} <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-3">
          <button type="button" onClick={() => onGenderChange('male')} className={toggleBtnClass(formData.gender === 'male')}>
            {f.genderMale as string}
          </button>
          <button type="button" onClick={() => onGenderChange('female')} className={toggleBtnClass(formData.gender === 'female')}>
            {f.genderFemale as string}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="age" className="block text-sm font-semibold text-muted-foreground uppercase mb-3">
          {f.labelAge as string} <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          id="age"
          name="age"
          value={formData.age}
          onChange={onInputChange}
          className={inputClass}
          placeholder={f.placeholderAge as string}
          min={0}
          max={30}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-muted-foreground uppercase mb-3">
          {f.labelColors as string}
        </label>
        <div className="flex flex-wrap gap-2">
          {(f.colorOptions as readonly string[]).map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onToggleColor(color)}
              className={colorBtnClass(formData.colors.includes(color))}
            >
              {color}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
