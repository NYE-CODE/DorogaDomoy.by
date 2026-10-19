import { X } from "lucide-react";

import { FilterState } from "../filters";
import { cn } from "@/shared/ui/utils";

function truncateChip(text: string, maxLen: number) {
  const t = text.trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, Math.max(0, maxLen - 1))}…`;
}

interface ActiveFilterChipsProps {
  filters: FilterState;
  labels: {
    animalType: Record<string, string>;
    color: Record<string, string>;
    status: Record<string, string>;
    reset: string;
    searchChip: string;
    regionChip?: string;
  };
  /** Выбранный город (из CityContext) */
  city?: string;
  onClearCity?: () => void;
  onRemove: (next: Partial<FilterState>) => void;
  onReset: () => void;
  className?: string;
}

export function ActiveFilterChips({
  filters,
  labels,
  city = "",
  onClearCity,
  onRemove,
  onReset,
  className,
}: ActiveFilterChipsProps) {
  const chips: Array<{ key: string; label: string; onRemove: () => void }> = [];

  const cityTrimmed = city.trim();
  if (cityTrimmed && onClearCity) {
    chips.push({
      key: "city",
      label: labels.regionChip
        ? `${labels.regionChip}: ${cityTrimmed}`
        : cityTrimmed,
      onRemove: onClearCity,
    });
  }

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
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onRemove}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-landing-muted"
          aria-label={`${labels.reset}: ${chip.label}`}
        >
          <span>{chip.label}</span>
          <X className="size-3.5 text-muted-foreground" aria-hidden />
        </button>
      ))}
      <button
        type="button"
        onClick={onReset}
        className="inline-flex min-h-9 items-center px-2 text-xs font-medium text-primary transition-colors hover:text-primary/80"
      >
        {labels.reset}
      </button>
    </div>
  );
}
