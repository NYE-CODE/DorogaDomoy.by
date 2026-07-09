import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import type { ShelterFormState } from '@/shared/lib/shelter-org-form';

export interface MyShelterFormStepContactsProps {
  ms: Record<string, string>;
  form: ShelterFormState;
  setForm: React.Dispatch<React.SetStateAction<ShelterFormState>>;
}

export function MyShelterFormStepContacts({
  ms,
  form,
  setForm,
}: MyShelterFormStepContactsProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="shelter-phone">{ms.fieldPhone}</Label>
        <Input
          id="shelter-phone"
          type="tel"
          value={form.phone}
          onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
          autoComplete="tel"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="shelter-telegram">{ms.fieldTelegram}</Label>
        <Input
          id="shelter-telegram"
          value={form.telegram}
          onChange={(e) => setForm((p) => ({ ...p, telegram: e.target.value }))}
          autoComplete="username"
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="shelter-website">{ms.fieldWebsite}</Label>
        <Input
          id="shelter-website"
          type="url"
          value={form.website}
          onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
          autoComplete="url"
          placeholder="https://"
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="shelter-email">{ms.fieldEmail}</Label>
        <Input
          id="shelter-email"
          type="email"
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          autoComplete="email"
        />
      </div>
    </div>
  );
}
