import { Image, Upload, X } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { logoPreview, type ShelterFormState } from '@/shared/lib/shelter-org-form';

export interface MyShelterFormStepMediaProps {
  ms: Record<string, string>;
  form: ShelterFormState;
  setForm: React.Dispatch<React.SetStateAction<ShelterFormState>>;
  logoInputRef: React.RefObject<HTMLInputElement | null>;
  coverInputRef: React.RefObject<HTMLInputElement | null>;
  onLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCoverChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function MyShelterFormStepMedia({
  ms,
  form,
  setForm,
  logoInputRef,
  coverInputRef,
  onLogoChange,
  onCoverChange,
}: MyShelterFormStepMediaProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Label>{ms.fieldLogo}</Label>
        <p className="text-sm text-muted-foreground">{ms.logoHint}</p>
        <div className="flex flex-wrap items-center gap-3">
          {(form.logoDataUrl || form.existingLogo) && (
            <img
              src={form.logoDataUrl || logoPreview(form.existingLogo) || ''}
              alt=""
              className="size-20 rounded-md border border-border object-cover shadow-sm"
            />
          )}
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onLogoChange}
          />
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => logoInputRef.current?.click()}
          >
            <Upload className="size-4 shrink-0" aria-hidden />
            {ms.logoChoose}
          </Button>
          {(form.logoDataUrl || form.existingLogo) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setForm((p) => ({ ...p, logoDataUrl: null, existingLogo: null }))}
            >
              <X className="size-4 shrink-0" aria-hidden />
              {ms.logoClear}
            </Button>
          )}
        </div>
      </div>
      <div className="space-y-3 border-t border-border pt-6">
        <Label>{ms.fieldCover}</Label>
        <p className="text-sm text-muted-foreground">{ms.coverHint}</p>
        {(form.coverDataUrl || form.existingCover) && (
          <div className="overflow-hidden rounded-md border border-border bg-muted shadow-sm">
            <img
              src={form.coverDataUrl || logoPreview(form.existingCover) || ''}
              alt=""
              className="max-h-40 w-full object-cover object-center sm:max-h-48"
            />
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onCoverChange}
          />
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => coverInputRef.current?.click()}
          >
            <Image className="size-4 shrink-0" aria-hidden />
            {ms.coverChoose}
          </Button>
          {(form.coverDataUrl || form.existingCover) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setForm((p) => ({ ...p, coverDataUrl: null, existingCover: null }))}
            >
              <X className="size-4 shrink-0" aria-hidden />
              {ms.coverClear}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
