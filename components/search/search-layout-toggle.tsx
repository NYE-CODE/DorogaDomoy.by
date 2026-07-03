import { Columns2, List, Map as MapIcon } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import type { SearchLayoutMode } from '@/shared/lib/home-route';

interface SearchLayoutToggleProps {
  mode: SearchLayoutMode;
  onChange: (mode: SearchLayoutMode) => void;
}

const MODES: { id: SearchLayoutMode; icon: typeof List; labelKey: 'mapAndList' | 'listOnly' | 'mapOnly' }[] = [
  { id: 'split', icon: Columns2, labelKey: 'mapAndList' },
  { id: 'list', icon: List, labelKey: 'listOnly' },
  { id: 'map', icon: MapIcon, labelKey: 'mapOnly' },
];

export function SearchLayoutToggle({ mode, onChange }: SearchLayoutToggleProps) {
  const { t } = useI18n();
  const layout = t.app.searchLayout;

  return (
    <div
      role="radiogroup"
      aria-label={layout.mapAndList}
      className="inline-flex shrink-0 rounded-md border border-border bg-muted/50 p-0.5"
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
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors sm:px-3 ${
              selected
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
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
