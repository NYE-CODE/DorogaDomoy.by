import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { LocationPicker } from '../location-picker';
import { geocode } from '../../utils/geocode';
import type { PetFormStepBaseProps } from './pet-form-validation';

export function PetFormStepLocation({
  variant,
  formData,
  setFormData,
  errors,
  t,
}: PetFormStepBaseProps) {
  return (
    <div className="space-y-5">
      <div>
        <span className="text-sm font-semibold text-muted-foreground dark:text-muted-foreground uppercase mb-3 block">{t.petForm.addressLabel}</span>
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder={t.petForm.addressExamplePlaceholder}
            className={variant === 'page' ? `flex-1 w-full px-4 py-3 border rounded-lg bg-input-background dark:bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.city ? 'border-destructive' : 'border-black/10 dark:border-border'}` : `flex-1 w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.city ? 'border-destructive' : 'border-border dark:border-border'}`}
            required
          />
          <button
            type="button"
            onClick={async () => {
              const addr = formData.city.trim();
              if (!addr) return;
              const result = await geocode(addr);
              if (result) {
                setFormData({
                  ...formData,
                  city: result.displayName,
                  location: { lat: result.lat, lng: result.lng },
                });
              } else {
                toast.error(t.common.toasts.addressNotFound);
              }
            }}
            className="px-6 h-12 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-1.5 shrink-0"
            title={t.petForm.geocodeOnMapTitle}
          >
            <Search className="w-4 h-4" />
            {t.pet.onMap}
          </button>
        </div>
        {errors.city
          ? <p className="text-xs text-red-500 mt-1">{errors.city}</p>
          : <p className="text-xs text-muted-foreground/80 mt-1">{t.petForm.addressMapHint}</p>
        }
      </div>
      <div>
        <span className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wide">{t.petForm.mapPointLabel}</span>
        <div className={`mt-2 rounded-md overflow-hidden border ${variant === 'page' ? 'border-black/10 dark:border-border' : 'border-border'}`}>
          <LocationPicker
            initialLocation={formData.location}
            onLocationSelect={(newLocation) => setFormData((prev) => ({ ...prev, location: newLocation }))}
            onLocationWithAddress={(location, address) => {
              setFormData((prev) => ({ ...prev, location, city: address }));
            }}
            mapHeight={variant === 'page' ? 'h-96' : 'h-48'}
          />
        </div>
      </div>
    </div>
  );
}
