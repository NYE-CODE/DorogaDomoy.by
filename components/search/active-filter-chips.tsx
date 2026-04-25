import { X } from "lucide-react";

import { FilterState } from "../filters";

function truncateChip(text: string, maxLen: number) {
  const t = text.trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, Math.max(0, maxLen - 1))}…`;
}

interface ActiveFilterChipsProps {
  filters: FilterState;
  labels: {
    animalType: Record<string, string>;
    daysAll: string;
    daysLabel: (days: number) => string;
    color: Record<string, string>;
    status: Record<string, string>;
    reset: string;
    /** Префикс для чипа активного текстового поиска */
    searchChip: string;
  };
  onRemove: (next: Partial<FilterState>) => void;
  onReset: () => void;
}

export function ActiveFilterChips({
  filters,
  labels,
  onRemove,
  onReset,
}: ActiveFilterChipsProps) {
  const chips: Array<{ key: string; label: string; onRemove: () => void }> = [];

  const searchTrimmed = filters.searchQuery.trim();
  if (searchTrimmed) {
    chips.push({
      key: "search",
      label: `${labels.searchChip}: «${truncateChip(searchTrimmed, 40)}»`,
      onRemove: () => onRemove({ searchQuery: "" }),
    });
  }

  if (filters.animalType !== "all") {
    chips.push({
      key: "animalType",
      label: labels.animalType[filters.animalType],
      onRemove: () => onRemove({ animalType: "all" }),
    });
  }
  if (filters.breed.trim()) {
    chips.push({
      key: "breed",
      label: filters.breed.trim(),
      onRemove: () => onRemove({ breed: "" }),
    });
  }
  if (filters.days !== "all") {
    chips.push({
      key: "days",
      label: labels.daysLabel(filters.days),
      onRemove: () => onRemove({ days: "all" }),
    });
  }
  filters.colors.forEach((color) => {
    chips.push({
      key: `color-${color}`,
      label: labels.color[color] ?? color,
      onRemove: () => onRemove({ colors: filters.colors.filter((item) => item !== color) }),
    });
  });
  filters.statuses.forEach((status) => {
    chips.push({
      key: `status-${status}`,
      label: labels.status[status] ?? status,
      onRemove: () =>
        onRemove({ statuses: filters.statuses.filter((item) => item !== status) }),
    });
  });

  if (chips.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onRemove}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent"
        >
          <span>{chip.label}</span>
          <X className="size-3.5 text-muted-foreground" />
        </button>
      ))}
      <button
        type="button"
        onClick={onReset}
        className="text-xs font-medium text-primary transition-colors hover:text-primary/80"
      >
        {labels.reset}
      </button>
    </div>
  );
}
