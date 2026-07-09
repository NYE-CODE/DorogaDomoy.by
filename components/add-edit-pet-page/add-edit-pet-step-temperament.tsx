import type { ProfilePetFormData } from './add-edit-pet-form-types';

const toggleBtnClass = (active: boolean) =>
  `px-6 py-3 rounded-lg font-medium transition-colors ${
    active
      ? 'bg-foreground text-background'
      : 'bg-muted text-muted-foreground hover:bg-muted dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80'
  }`;

const inputClass =
  'w-full px-4 py-3 border border-border rounded-lg bg-white dark:bg-input-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent';

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
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-muted-foreground uppercase mb-3">
          {f.labelTemperament}
        </label>
        <div className="flex flex-wrap gap-3">
          {f.temperamentOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onTemperamentChange(option.value)}
              className={toggleBtnClass(formData.temperament === option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-muted-foreground uppercase mb-3">
          {f.labelRespondsToName}
        </label>
        <div className="flex gap-3">
          <button type="button" onClick={() => onRespondsToNameChange('yes')} className={toggleBtnClass(formData.respondsToName === 'yes')}>
            {f.yes}
          </button>
          <button type="button" onClick={() => onRespondsToNameChange('no')} className={toggleBtnClass(formData.respondsToName === 'no')}>
            {f.no}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="favoriteTreats" className="block text-sm font-semibold text-muted-foreground uppercase mb-3">
          {f.labelTreats}
        </label>
        <input
          type="text"
          id="favoriteTreats"
          name="favoriteTreats"
          value={formData.favoriteTreats}
          onChange={onInputChange}
          className={inputClass}
          placeholder={f.placeholderTreats}
        />
      </div>

      <div>
        <label htmlFor="favoriteWalks" className="block text-sm font-semibold text-muted-foreground uppercase mb-3">
          {f.labelWalks}
        </label>
        <input
          type="text"
          id="favoriteWalks"
          name="favoriteWalks"
          value={formData.favoriteWalks}
          onChange={onInputChange}
          className={inputClass}
          placeholder={f.placeholderWalks}
        />
      </div>
    </div>
  );
}
