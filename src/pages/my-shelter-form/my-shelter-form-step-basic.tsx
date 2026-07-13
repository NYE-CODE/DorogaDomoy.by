import type { ShelterAnimalFocus, ShelterKind } from '@/shared/api/client';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import type { ShelterFormState } from '@/shared/lib/shelter-org-form';

export interface MyShelterFormStepBasicProps {
  ms: Record<string, string>;
  form: ShelterFormState;
  setForm: React.Dispatch<React.SetStateAction<ShelterFormState>>;
  approvedLocked: boolean;
  fieldErrors?: { name?: string };
}

export function MyShelterFormStepBasic({
  ms,
  form,
  setForm,
  approvedLocked,
  fieldErrors = {},
}: MyShelterFormStepBasicProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="shelter-name">{ms.fieldName} *</Label>
        <Input
          id="shelter-name"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          disabled={approvedLocked}
          autoComplete="organization"
          aria-invalid={Boolean(fieldErrors.name)}
          className={fieldErrors.name ? 'border-destructive' : undefined}
        />
        {fieldErrors.name ? (
          <p className="text-xs text-destructive" role="alert">
            {fieldErrors.name}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="shelter-kind">{ms.fieldKind}</Label>
        <Select
          value={form.kind}
          disabled={approvedLocked}
          onValueChange={(v) => setForm((p) => ({ ...p, kind: v as ShelterKind }))}
        >
          <SelectTrigger id="shelter-kind" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="shelter">{ms.kindShelter}</SelectItem>
            <SelectItem value="foster">{ms.kindFoster}</SelectItem>
            <SelectItem value="other">{ms.kindOther}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="shelter-animal-focus">{ms.fieldAnimalFocus} *</Label>
        <Select
          value={form.animalFocus}
          onValueChange={(v) =>
            setForm((p) => ({ ...p, animalFocus: v as ShelterAnimalFocus }))
          }
        >
          <SelectTrigger id="shelter-animal-focus" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dogs">{ms.focusDogs}</SelectItem>
            <SelectItem value="cats">{ms.focusCats}</SelectItem>
            <SelectItem value="mixed">{ms.focusMixed}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="shelter-description">{ms.fieldDescription}</Label>
        <Textarea
          id="shelter-description"
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          rows={5}
          className="min-h-[120px] resize-y"
        />
      </div>
    </>
  );
}
