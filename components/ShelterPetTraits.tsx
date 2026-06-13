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
              n <= value ? 'bg-primary' : 'bg-muted',
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
    <div className={cn('rounded-lg border border-border bg-muted/20 px-3 py-3 dark:bg-muted/10', className)}>
      <p className="mb-3 text-sm font-semibold text-foreground">{copy.sectionTitle}</p>
      {scales.length > 0 && (
        <div className="space-y-3">
          {scales.map(({ def, value, label }) => (
            <TraitBar key={def.key} label={def.label} value={value} levelLabel={label} />
          ))}
        </div>
      )}
      {compat.length > 0 && (
        <div className={cn('flex flex-wrap gap-1.5', scales.length > 0 && 'mt-3 pt-3 border-t border-border')}>
          {compat.map((b) => (
            <span
              key={b.key}
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                b.value === 'yes'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
              )}
            >
              {compatBadgeText(b, copy)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
