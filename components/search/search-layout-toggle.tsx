import { LayoutGrid, Map as MapIcon } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import type { SearchLayoutMode } from '@/shared/lib/home-route';
import { cn } from '@/shared/ui/utils';

interface SearchLayoutToggleProps {
  mode: SearchLayoutMode;
  onChange: (mode: SearchLayoutMode) => void;
}

const MODES: {
  id: SearchLayoutMode;
  icon: typeof LayoutGrid;
  labelKey: 'listOnly' | 'mapOnly';
}[] = [
  { id: 'list', icon: LayoutGrid, labelKey: 'listOnly' },
  { id: 'map', icon: MapIcon, labelKey: 'mapOnly' },
];

/** Toggle в стиле лендинга: активный — landing-dark. */
export function SearchLayoutToggle({ mode, onChange }: SearchLayoutToggleProps) {
  const { t } = useI18n();
  const layout = t.app.searchLayout;

  return (
    <div
      role="radiogroup"
      aria-label={layout.modeGroup}
      className="inline-flex shrink-0 rounded-full border border-border bg-card p-1 shadow-sm"
    >
      {MODES.map(({ id, icon: Icon, labelKey }) => {
        const selected = mode === id;
        const label = layout[labelKey];
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={selected}
            title={label}
            onClick={() => onChange(id)}
            className={cn(
              'inline-flex min-h-10 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
              selected
                ? 'bg-landing-dark text-on-landing-dark shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            <span className="hidden sm:inline">{label}</span>
            <span className="sr-only sm:hidden">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
