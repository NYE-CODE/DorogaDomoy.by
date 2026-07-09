import { MapPin } from 'lucide-react';
import { LocationPicker } from '../../../components/location-picker';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import type { ShelterFormState } from '@/shared/lib/shelter-org-form';

export interface MyShelterFormStepLocationProps {
  ms: Record<string, string>;
  loadingLabel: string;
  form: ShelterFormState;
  setForm: React.Dispatch<React.SetStateAction<ShelterFormState>>;
  approvedLocked: boolean;
  mapSyncing: boolean;
  onSyncMap: () => void;
  onPlaceFromMap: (
    loc: { lat: number; lng: number },
    place: { formattedAddress: string; locality: string | null },
  ) => void;
}

export function MyShelterFormStepLocation({
  ms,
  loadingLabel,
  form,
  setForm,
  approvedLocked,
  mapSyncing,
  onSyncMap,
  onPlaceFromMap,
}: MyShelterFormStepLocationProps) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="shelter-city">{ms.fieldCity} *</Label>
          <Input
            id="shelter-city"
            value={form.city}
            onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
            disabled={approvedLocked}
            autoComplete="address-level2"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="shelter-address">{ms.fieldAddress}</Label>
          <Input
            id="shelter-address"
            value={form.address}
            onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
            autoComplete="street-address"
          />
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2 sm:w-auto"
          disabled={mapSyncing}
          onClick={onSyncMap}
        >
          <MapPin className="size-4 shrink-0" aria-hidden />
          {mapSyncing ? loadingLabel : ms.formSyncMapButton}
        </Button>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">{ms.fieldLocation}</p>
        <LocationPicker
          mapHeight="h-64 sm:h-72"
          initialLocation={{ lat: form.lat, lng: form.lng }}
          onLocationSelect={(loc) => setForm((p) => ({ ...p, lat: loc.lat, lng: loc.lng }))}
          onLocationPlaceSync={onPlaceFromMap}
        />
      </div>
    </div>
  );
}
