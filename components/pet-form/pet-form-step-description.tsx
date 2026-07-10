import { useState, type Dispatch, type SetStateAction } from 'react';
import { Plus, X } from 'lucide-react';
import type { AiFilledAdFields } from '@/shared/lib/ai-photo-analyze';
import { AiFieldBadge } from './pet-form-ai-field-badge';
import {
  MAX_DESCRIPTION,
  MAX_DISTINCTIVE_MARKS,
  MAX_DISTINCTIVE_MARK_LEN,
  MIN_DESCRIPTION,
  MIN_DISTINCTIVE_MARK_LEN,
} from './pet-form-constants';
import type { PetFormStepBaseProps } from './pet-form-validation';

export interface PetFormStepDescriptionProps extends PetFormStepBaseProps {
  aiFilledFields: AiFilledAdFields;
  setAiFilledFields: Dispatch<SetStateAction<AiFilledAdFields>>;
  onDescriptionChange: () => void;
}

export function PetFormStepDescription({
  variant,
  formData,
  setFormData,
  errors,
  t,
  aiFilledFields,
  setAiFilledFields,
  onDescriptionChange,
}: PetFormStepDescriptionProps) {
  const [markDraft, setMarkDraft] = useState('');

  const addDistinctiveMark = () => {
    const text = markDraft.replace(/\s+/g, ' ').trim();
    if (text.length < MIN_DISTINCTIVE_MARK_LEN || text.length > MAX_DISTINCTIVE_MARK_LEN) return;
    if (formData.distinctiveMarks.length >= MAX_DISTINCTIVE_MARKS) return;
    const key = text.toLowerCase();
    if (formData.distinctiveMarks.some((m) => m.toLowerCase() === key)) {
      setMarkDraft('');
      return;
    }
    setFormData({
      ...formData,
      distinctiveMarks: [...formData.distinctiveMarks, text],
    });
    setAiFilledFields((prev) => ({ ...prev, distinctiveMarks: false }));
    setMarkDraft('');
  };

  const removeDistinctiveMark = (mark: string) => {
    setFormData({
      ...formData,
      distinctiveMarks: formData.distinctiveMarks.filter((m) => m !== mark),
    });
    setAiFilledFields((prev) => ({ ...prev, distinctiveMarks: false }));
  };

  const canAddMark =
    markDraft.trim().length >= MIN_DISTINCTIVE_MARK_LEN &&
    markDraft.trim().length <= MAX_DISTINCTIVE_MARK_LEN &&
    formData.distinctiveMarks.length < MAX_DISTINCTIVE_MARKS;

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <label className="text-sm font-semibold text-muted-foreground uppercase">
          {t.petForm.descriptionLabel}
          <AiFieldBadge show={aiFilledFields.description} label={t.petForm.aiFieldBadge} />
        </label>
        <span
          className={`text-sm ${
            formData.description.trim().length > 0 &&
            formData.description.trim().length < MIN_DESCRIPTION
              ? 'text-amber-600 dark:text-amber-400 font-medium'
              : formData.description.length > MAX_DESCRIPTION
                ? 'text-red-500 font-medium'
                : 'text-muted-foreground dark:text-muted-foreground'
          }`}
        >
          {formData.description.length} / {MAX_DESCRIPTION}
          {formData.description.trim().length > 0 &&
            formData.description.trim().length < MIN_DESCRIPTION && (
              <span className="ml-1">
                ({t.petForm.descriptionMinHint.replace('{min}', String(MIN_DESCRIPTION))})
              </span>
            )}
        </span>
      </div>
      <textarea
        value={formData.description}
        onChange={(e) => {
          if (e.target.value.length <= MAX_DESCRIPTION) {
            setFormData({ ...formData, description: e.target.value });
            setAiFilledFields((prev) => ({ ...prev, description: false }));
            onDescriptionChange();
          }
        }}
        placeholder={t.petForm.descriptionPlaceholder}
        rows={8}
        maxLength={MAX_DESCRIPTION}
        className={variant === 'page' ? `w-full px-4 py-3 border rounded-lg bg-input-background dark:bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none ${errors.description ? 'border-destructive' : 'border-border'}` : `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none ${errors.description ? 'border-destructive' : 'border-border dark:border-border'}`}
        required
      />
      {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
      {!errors.description &&
        formData.description.trim().length > 0 &&
        formData.description.trim().length < MIN_DESCRIPTION && (
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
            {t.petForm.descriptionTooShortSearchHint}
          </p>
        )}

      <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
        <p className="text-sm font-semibold text-foreground">
          {t.petForm.distinctiveMarksTitle}
          <AiFieldBadge show={aiFilledFields.distinctiveMarks} label={t.petForm.aiFieldBadge} />
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{t.petForm.distinctiveMarksHint}</p>
        {formData.distinctiveMarks.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {formData.distinctiveMarks.map((mark) => (
              <li key={mark}>
                <span className="inline-flex items-center gap-1 rounded-full bg-background px-3 py-1 text-xs font-medium text-foreground ring-1 ring-inset ring-primary/25">
                  {mark}
                  <button
                    type="button"
                    onClick={() => removeDistinctiveMark(mark)}
                    className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label={`${t.petForm.distinctiveMarksRemove}: ${mark}`}
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
        {formData.distinctiveMarks.length < MAX_DISTINCTIVE_MARKS && (
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={markDraft}
              onChange={(e) => setMarkDraft(e.target.value.slice(0, MAX_DISTINCTIVE_MARK_LEN))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addDistinctiveMark();
                }
              }}
              placeholder={t.petForm.distinctiveMarksAddPlaceholder}
              maxLength={MAX_DISTINCTIVE_MARK_LEN}
              className={
                variant === 'page'
                  ? 'min-w-0 flex-1 rounded-lg border border-border bg-input-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary'
                  : 'min-w-0 flex-1 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:border-border'
              }
            />
            <button
              type="button"
              onClick={addDistinctiveMark}
              disabled={!canAddMark}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="size-4" aria-hidden />
              {t.petForm.distinctiveMarksAdd}
            </button>
          </div>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          {formData.distinctiveMarks.length} / {MAX_DISTINCTIVE_MARKS}
        </p>
      </div>

      {!!formData.pendingChipNumber?.trim() && (
        <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            className="mt-1 size-4 shrink-0 rounded border-border"
            checked={!!formData.includeChipInDescription}
            onChange={(e) => {
              const reveal = e.target.checked;
              const chip = formData.pendingChipNumber!.trim();
              const chipLine = `${t.myPets.form.labelChipNumber}: ${chip}`;
              const chippedLine = `${t.myPets.form.labelChipped}: ${t.myPets.form.yes}`;
              let desc = formData.description;
              desc = desc
                .split(/\n\n+/)
                .filter((block) => {
                  const b = block.trim();
                  if (!b) return false;
                  if (b.startsWith(`${t.myPets.form.labelChipNumber}:`)) return false;
                  if (b.startsWith(`${t.myPets.form.labelChipped}:`)) return false;
                  return true;
                })
                .join('\n\n');
              const addition = reveal ? chipLine : chippedLine;
              desc = desc ? `${desc}\n\n${addition}` : addition;
              setFormData({
                ...formData,
                includeChipInDescription: reveal,
                description: desc.slice(0, MAX_DESCRIPTION),
              });
            }}
          />
          <span>{t.petForm.revealChipInDescription}</span>
        </label>
      )}

      <div className="mt-8 border-t border-border pt-6">
        <p className="text-sm font-semibold text-muted-foreground uppercase mb-1">
          {t.petForm.registrationSectionTitle}
        </p>
        <p className="text-xs text-muted-foreground mb-4">{t.petForm.registrationHint}</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-2">
              {t.petForm.registrationAuthorityLabel}
            </label>
            <input
              type="text"
              value={formData.registrationAuthority ?? ''}
              onChange={(e) =>
                setFormData({ ...formData, registrationAuthority: e.target.value })
              }
              placeholder={t.petForm.registrationAuthorityPlaceholder}
              maxLength={300}
              className={variant === 'page'
                ? `w-full px-4 py-3 border rounded-lg bg-input-background dark:bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.registrationAuthority ? 'border-destructive' : 'border-border'}`
                : `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.registrationAuthority ? 'border-destructive' : 'border-border dark:border-border'}`}
            />
            {errors.registrationAuthority && (
              <p className="text-xs text-red-500 mt-1">{errors.registrationAuthority}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-2">
              {t.petForm.registrationTokenLabel}
            </label>
            <input
              type="text"
              value={formData.registrationTokenNumber ?? ''}
              onChange={(e) =>
                setFormData({ ...formData, registrationTokenNumber: e.target.value })
              }
              placeholder={t.petForm.registrationTokenPlaceholder}
              maxLength={80}
              className={variant === 'page'
                ? `w-full px-4 py-3 border rounded-lg bg-input-background dark:bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.registrationTokenNumber ? 'border-destructive' : 'border-border'}`
                : `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.registrationTokenNumber ? 'border-destructive' : 'border-border dark:border-border'}`}
            />
            {errors.registrationTokenNumber && (
              <p className="text-xs text-red-500 mt-1">{errors.registrationTokenNumber}</p>
            )}
          </div>
        </div>
      </div>

      {formData.status === 'searching' && (
      <div className="mt-8 border-t border-border pt-6">
        <div className="text-sm font-semibold text-muted-foreground uppercase mb-3">
          {t.petForm.rewardTitle}
        </div>
        <div className="space-y-3">
          <label className="flex items-center gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/50 dark:hover:bg-muted/10 transition-colors">
            <input
              type="radio"
              name="rewardMode"
              checked={(formData.rewardMode ?? 'points') === 'points'}
              onChange={() =>
                setFormData({
                  ...formData,
                  rewardMode: 'points',
                  rewardAmountByn: undefined,
                })
              }
              className="w-4 h-4 text-primary"
            />
            <span className="text-foreground/90">
              {t.petForm.rewardPointsMode}
            </span>
          </label>
          <label className="flex items-center gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/50 dark:hover:bg-muted/10 transition-colors">
            <input
              type="radio"
              name="rewardMode"
              checked={formData.rewardMode === 'money'}
              onChange={() =>
                setFormData({
                  ...formData,
                  rewardMode: 'money',
                  rewardAmountByn: formData.rewardAmountByn ?? 50,
                })
              }
              className="w-4 h-4 text-primary"
            />
            <span className="text-foreground/90">
              {t.petForm.rewardMoneyMode}
            </span>
          </label>
        </div>

        {formData.rewardMode === 'money' ? (
          <div className="mt-4">
            <label className="block text-sm font-medium text-foreground/90 mb-2">
              {t.petForm.rewardAmountLabel}
            </label>
            <input
              type="number"
              min={1}
              step={1}
              value={formData.rewardAmountByn ?? ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  rewardAmountByn: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              placeholder="100"
              className={variant === 'page'
                ? `w-full px-4 py-3 border rounded-lg bg-input-background dark:bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.rewardAmountByn ? 'border-destructive' : 'border-border'}`
                : `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.rewardAmountByn ? 'border-destructive' : 'border-border dark:border-border'}`}
            />
            {errors.rewardAmountByn && <p className="text-xs text-red-500 mt-1">{errors.rewardAmountByn}</p>}
            <p className="text-xs text-muted-foreground mt-2">
              {t.petForm.rewardMoneyHint}
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground mt-3">
            {t.petForm.rewardPointsHint}
          </p>
        )}
      </div>
      )}
    </div>
  );
}
