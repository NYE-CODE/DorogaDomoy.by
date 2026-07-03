import { useState } from 'react';
import { Search, SlidersHorizontal, ChevronDown, ChevronUp, RotateCcw, Plus, X, PawPrint, Cat, Dog, Bird } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AnimalType, PetStatus, PetColor } from '../types/pet';
import { activeStatuses, colorLabels, petStatusFilterSelectedClass } from '../utils/pet-helpers';
import { useIsMobile } from './ui/use-mobile';
import { useI18n } from '../context/I18nContext';
import { BreedCombobox } from './breed-combobox';
import { CAT_BREEDS, DOG_BREEDS } from '../utils/breeds';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export interface FilterState {
  animalType: AnimalType | 'all';
  breed: string;
  colors: PetColor[];
  statuses: PetStatus[];
  days: number | 'all';
  searchQuery: string;
}

export const EMPTY_FILTER_STATE: FilterState = {
  animalType: 'all',
  breed: '',
  colors: [],
  statuses: [],
  days: 'all',
  searchQuery: '',
};

export function countAdvancedFilters(filters: FilterState): number {
  return [filters.breed !== '', filters.colors.length > 0, filters.days !== 'all'].filter(Boolean).length;
}

export function countActiveFilters(filters: FilterState): number {
  return [
    filters.animalType !== 'all',
    filters.breed !== '',
    filters.colors.length > 0,
    filters.statuses.length > 0,
    filters.days !== 'all',
    filters.searchQuery.trim() !== '',
  ].filter(Boolean).length;
}

interface FiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onCreateClick?: () => void;
  /** Embedded mode: no outer card chrome, used inside drawers */
  embedded?: boolean;
  onClose?: () => void;
  /** Layout variant: standalone panel, embedded, or full page */
  variant?: 'standalone' | 'embedded' | 'page';
}

export function Filters({
  filters,
  onFiltersChange,
  onCreateClick,
  embedded,
  onClose,
  variant = 'standalone',
}: FiltersProps) {
  const isMobile = useIsMobile();
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(!isMobile);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const animalTypeOptions: { value: AnimalType | 'all'; label: string; icon: LucideIcon }[] = [
    { value: 'all', label: t.common.all, icon: PawPrint },
    { value: 'cat', label: t.pet.animalType.cat, icon: Cat },
    { value: 'dog', label: t.pet.animalType.dog, icon: Dog },
    { value: 'other', label: t.pet.animalType.other, icon: Bird },
  ];

  const animalTypeTooltips: Record<AnimalType | 'all', string> = {
    all: t.filters.typeTooltipAll,
    cat: t.filters.typeTooltipCat,
    dog: t.filters.typeTooltipDog,
    other: t.filters.typeTooltipOther,
  };

  const periodOptions: { value: number | 'all'; label: string }[] = [
    { value: 'all', label: t.common.all },
    { value: 7, label: t.filters.days7 },
    { value: 30, label: t.filters.days30 },
    { value: 90, label: t.filters.days90 },
  ];

  const handleReset = () => {
    onFiltersChange(EMPTY_FILTER_STATE);
  };

  const activeFilterCount = countActiveFilters(filters);
  const advancedFilterCount = countAdvancedFilters(filters);

  const toggleStatus = (status: PetStatus) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    onFiltersChange({ ...filters, statuses: newStatuses });
  };

  const toggleColor = (color: PetColor) => {
    const newColors = filters.colors.includes(color)
      ? filters.colors.filter((c) => c !== color)
      : [...filters.colors, color];
    onFiltersChange({ ...filters, colors: newColors });
  };

  const statusRow = (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {t.filters.status}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {activeStatuses.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => toggleStatus(status)}
            className={`rounded-lg border px-3 py-1.5 text-sm transition-all ${
              filters.statuses.includes(status)
                ? petStatusFilterSelectedClass[status]
                : 'border-border bg-card text-foreground hover:bg-muted/80'
            }`}
          >
            {(t.pet.status as Record<PetStatus, string>)[status]}
          </button>
        ))}
      </div>
    </div>
  );

  const animalTypeRow = (
    <div className="space-y-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t.filters.type}</span>
      <div className="grid grid-cols-4 gap-0.5 rounded-md border border-border bg-muted/60 p-0.5">
        {animalTypeOptions.map((opt) => (
          <Tooltip key={opt.value} delayDuration={280}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onFiltersChange({ ...filters, animalType: opt.value })}
                className={`flex min-h-[36px] w-full items-center justify-center gap-1 rounded-lg px-1.5 py-1.5 text-xs font-medium transition-all sm:min-h-0 sm:gap-1.5 sm:px-2 sm:text-sm ${
                  filters.animalType === opt.value
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-background/80 hover:text-foreground'
                }`}
              >
                <opt.icon size={15} className="shrink-0 opacity-80" aria-hidden />
                <span className="truncate">{opt.label}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={6} className="max-w-[min(280px,calc(100vw-2rem))]">
              {animalTypeTooltips[opt.value]}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );

  const advancedFiltersBody = (
    <div className="space-y-4 border-t border-border/60 pt-3">
      <div className="grid gap-3 sm:grid-cols-2 sm:items-end">
        <div className="min-w-0 space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t.filters.breedLabel}
          </span>
          {filters.animalType === 'cat' || filters.animalType === 'dog' ? (
            <BreedCombobox
              breeds={filters.animalType === 'cat' ? CAT_BREEDS : DOG_BREEDS}
              value={filters.breed}
              onChange={(breed) => onFiltersChange({ ...filters, breed })}
              placeholder={t.filters.breedPlaceholder}
            />
          ) : (
            <input
              type="text"
              value={filters.breed}
              onChange={(e) => onFiltersChange({ ...filters, breed: e.target.value })}
              placeholder={t.filters.breedPlaceholder}
              className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-offset-background transition-shadow focus-visible:ring-2 focus-visible:ring-ring"
            />
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t.filters.period}
          </span>
          <Select
            value={filters.days === 'all' ? 'all' : String(filters.days)}
            onValueChange={(v) => onFiltersChange({ ...filters, days: v === 'all' ? 'all' : Number(v) })}
          >
            <SelectTrigger className="h-10 w-full min-w-0 border-border bg-card">
              <SelectValue placeholder={t.common.all} />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((opt) => (
                <SelectItem key={String(opt.value)} value={opt.value === 'all' ? 'all' : String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t.filters.color}</span>
        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
          {(Object.keys(colorLabels) as PetColor[]).map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => toggleColor(color)}
              className={`min-w-0 rounded-lg border px-1.5 py-1.5 text-center text-xs leading-tight transition-all sm:px-2 sm:text-sm sm:leading-snug ${
                filters.colors.includes(color)
                  ? 'border-primary/45 bg-primary/12 text-primary shadow-sm'
                  : 'border-border bg-card text-foreground hover:bg-muted/80'
              }`}
            >
              {(t.pet.color as Record<PetColor, string>)[color]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const filterPanelBody = (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-x-6 sm:gap-y-3">
        {statusRow}
        <div className="flex flex-col gap-1.5 sm:flex-1 sm:min-w-[140px]">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t.filters.period}
          </span>
          <Select
            value={filters.days === 'all' ? 'all' : String(filters.days)}
            onValueChange={(v) => onFiltersChange({ ...filters, days: v === 'all' ? 'all' : Number(v) })}
          >
            <SelectTrigger className="h-10 w-full min-w-0 border-border bg-card">
              <SelectValue placeholder={t.common.all} />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((opt) => (
                <SelectItem key={String(opt.value)} value={opt.value === 'all' ? 'all' : String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] sm:items-end">
        {animalTypeRow}
        <div className="min-w-0 space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t.filters.breedLabel}
          </span>
          {filters.animalType === 'cat' || filters.animalType === 'dog' ? (
            <BreedCombobox
              breeds={filters.animalType === 'cat' ? CAT_BREEDS : DOG_BREEDS}
              value={filters.breed}
              onChange={(breed) => onFiltersChange({ ...filters, breed })}
              placeholder={t.filters.breedPlaceholder}
            />
          ) : (
            <input
              type="text"
              value={filters.breed}
              onChange={(e) => onFiltersChange({ ...filters, breed: e.target.value })}
              placeholder={t.filters.breedPlaceholder}
              className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-offset-background transition-shadow focus-visible:ring-2 focus-visible:ring-ring"
            />
          )}
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t.filters.color}</span>
        <div className="grid grid-cols-4 gap-1.5">
          {(Object.keys(colorLabels) as PetColor[]).map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => toggleColor(color)}
              className={`min-w-0 rounded-lg border px-1.5 py-1.5 text-center text-xs leading-tight transition-all sm:px-2 sm:text-sm sm:leading-snug ${
                filters.colors.includes(color)
                  ? 'border-primary/45 bg-primary/12 text-primary shadow-sm'
                  : 'border-border bg-card text-foreground hover:bg-muted/80'
              }`}
            >
              {(t.pet.color as Record<PetColor, string>)[color]}
            </button>
          ))}
        </div>
      </div>
    </>
  );

  const searchInput = (
    <div className="relative min-w-0 flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        value={filters.searchQuery}
        onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
        placeholder={t.filters.searchPlaceholder}
        className="h-10 w-full rounded-md border border-border bg-card py-2 pl-10 pr-4 text-sm shadow-sm outline-none ring-offset-background transition-shadow focus-visible:ring-2 focus-visible:ring-ring sm:h-11 sm:py-2.5"
      />
    </div>
  );

  if (variant === 'page') {
    const moreFiltersControl = (
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => setAdvancedOpen((open) => !open)}
          aria-expanded={advancedOpen}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent"
        >
          <SlidersHorizontal className="size-4 shrink-0" aria-hidden />
          <span className="hidden sm:inline">{t.filters.moreFilters}</span>
          {advancedFilterCount > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
              {advancedFilterCount}
            </span>
          )}
          {advancedOpen ? (
            <ChevronUp className="size-4 shrink-0" aria-hidden />
          ) : (
            <ChevronDown className="size-4 shrink-0" aria-hidden />
          )}
        </button>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
            title={t.filters.reset}
            aria-label={t.filters.reset}
          >
            <RotateCcw className="size-4" />
          </button>
        )}
      </div>
    );

    return (
      <div id="search-filters-panel" className="space-y-3" role="region" aria-label={t.filters.filters}>
        {searchInput}
        <div className="flex flex-wrap items-end gap-3 gap-y-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-end gap-3 sm:gap-4">
            <div className="flex min-w-[min(100%,200px)] flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t.filters.status}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeStatuses.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => toggleStatus(status)}
                    className={`whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-sm transition-all sm:px-3 ${
                      filters.statuses.includes(status)
                        ? petStatusFilterSelectedClass[status]
                        : 'border-border bg-card text-foreground hover:bg-muted/80'
                    }`}
                  >
                    {(t.pet.status as Record<PetStatus, string>)[status]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t.filters.type}
              </span>
              <div className="flex gap-0.5 rounded-md border border-border bg-muted/60 p-0.5">
                {animalTypeOptions.map((opt) => (
                  <Tooltip key={opt.value} delayDuration={280}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => onFiltersChange({ ...filters, animalType: opt.value })}
                        className={`flex min-h-[34px] items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-all sm:min-h-[36px] sm:gap-1.5 sm:px-2.5 sm:text-sm ${
                          filters.animalType === opt.value
                            ? 'bg-card text-foreground shadow-sm'
                            : 'text-muted-foreground hover:bg-background/80 hover:text-foreground'
                        }`}
                      >
                        <opt.icon size={15} className="shrink-0 opacity-80" aria-hidden />
                        <span className="hidden truncate sm:inline">{opt.label}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={6} className="max-w-[min(280px,calc(100vw-2rem))]">
                      {animalTypeTooltips[opt.value]}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
          </div>

          <div className="ml-auto">{moreFiltersControl}</div>
        </div>
        {advancedOpen ? advancedFiltersBody : null}
      </div>
    );
  }

  if (embedded) {
    return (
      <div className="space-y-4 rounded-md border border-border bg-muted/20 p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          {searchInput}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label={t.common.close}
            >
              <X className="size-5" />
            </button>
          )}
        </div>
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
            >
              <RotateCcw className="size-3.5" />
              {t.filters.reset}
            </button>
          </div>
        )}
        <div className="space-y-5">{filterPanelBody}</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground/80" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
            placeholder={t.filters.searchPlaceholder}
            className="w-full rounded-lg border border-border bg-card py-2.5 pl-11 pr-4 text-sm shadow-sm transition-shadow focus:border-transparent focus:ring-2 focus:ring-primary"
          />
        </div>
        {onCreateClick && (
          <button
            type="button"
            onClick={onCreateClick}
            className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            title={t.header.createAd}
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">{t.header.createAd}</span>
          </button>
        )}
      </div>

      <div className="rounded-md border border-border bg-card shadow-sm">
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-2.5"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-2 text-sm font-medium text-foreground/90">
            <SlidersHorizontal className="size-4" />
            <span>{t.filters.filters}</span>
            {activeFilterCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReset();
                }}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-primary dark:hover:bg-accent"
              >
                <RotateCcw className="size-3" />
                {t.filters.reset}
              </button>
            )}
            {isOpen ? (
              <ChevronUp className="size-4 text-muted-foreground/80" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground/80" />
            )}
          </div>
        </button>

        {isOpen && (
          <div className="space-y-4 border-t border-border/60 px-4 pb-4 pt-3 dark:border-border">
            {filterPanelBody}
          </div>
        )}
      </div>
    </div>
  );
}
