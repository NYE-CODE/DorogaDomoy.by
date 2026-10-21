import type { Pet } from '../types/pet';
import { useI18n } from '../context/I18nContext';
import {
  buildTraitScales,
  compatBadgeText,
  getCompatBadges,
  hasAnyTrait,
  traitLevelLabel,
} from '../utils/pet-traits';
import { cn } from './ui/utils';

function TraitBar({ label, value, levelLabel }: { label: string; value: number; levelLabel: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{levelLabel}</span>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <div
            key={n}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors',
              n <= value ? 'bg-primary' : 'bg-landing-muted',
            )}
          />
        ))}
      </div>
    </div>
  );
}

export function ShelterPetTraits({ pet, className }: { pet: Pet; className?: string }) {
  const { t } = useI18n();
  const copy = t.petTraits;

  if (!hasAnyTrait(pet)) return null;

  const scales = buildTraitScales(copy).flatMap((def) => {
    const value = pet[def.key];
    const label = traitLevelLabel(def, value);
    if (!value || !label) return [];
    return [{ def, value, label }];
  });

  const compat = getCompatBadges(pet);

  return (
    <section
      className={cn(
        'overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6',
        className,
      )}
    >
      <h2 className="font-display mb-4 text-lg font-semibold text-foreground sm:text-xl">
        {copy.sectionTitle}
      </h2>
      {scales.length > 0 ? (
        <div className="space-y-3">
          {scales.map(({ def, value, label }) => (
            <TraitBar key={def.key} label={def.label} value={value} levelLabel={label} />
          ))}
        </div>
      ) : null}
      {compat.length > 0 ? (
        <div className={cn('flex flex-wrap gap-1.5', scales.length > 0 && 'mt-4 border-t border-border pt-4')}>
          {compat.map((b) => (
            <span
              key={b.key}
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                b.value === 'yes'
                  ? 'border border-shelter-border bg-shelter-soft text-shelter-foreground'
                  : 'bg-landing-muted text-muted-foreground',
              )}
            >
              {compatBadgeText(b, copy)}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
