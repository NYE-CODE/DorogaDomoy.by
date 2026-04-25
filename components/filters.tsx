import { useState } from 'react';
import { Search, SlidersHorizontal, ChevronDown, ChevronUp, RotateCcw, Plus, X } from 'lucide-react';
import { AnimalType, PetStatus, PetColor } from '../types/pet';
import { activeStatuses, colorLabels } from '../utils/pet-helpers';
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

interface FiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onCreateClick?: () => void;
  /** Встроенный режим: только панель фильтров без обёртки, с кнопкой закрытия */
  embedded?: boolean;
  onClose?: () => void;
}

export function Filters({ filters, onFiltersChange, onCreateClick, embedded, onClose }: FiltersProps) {
  const isMobile = useIsMobile();
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(!isMobile);

  const animalTypeOptions: { value: AnimalType | 'all'; label: string; icon: string }[] = [
    { value: 'all', label: t.common.all, icon: '🐾' },
    { value: 'cat', label: t.pet.animalType.cat, icon: '🐱' },
    { value: 'dog', label: t.pet.animalType.dog, icon: '🐕' },
    { value: 'other', label: t.pet.animalType.other, icon: '🦔' },
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
    onFiltersChange({
      animalType: 'all',
      breed: '',
      colors: [],
      statuses: [],
      days: 'all',
      searchQuery: '',
    });
  };

  const activeFilterCount = [
    filters.animalType !== 'all',
    filters.breed !== '',
    filters.colors.length > 0,
    filters.statuses.length > 0,
    filters.days !== 'all',
    filters.searchQuery.trim() !== '',
  ].filter(Boolean).length;

  const toggleStatus = (status: PetStatus) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter(s => s !== status)
      : [...filters.statuses, status];
    onFiltersChange({ ...filters, statuses: newStatuses });
  };

  const toggleColor = (color: PetColor) => {
    const newColors = filters.colors.includes(color)
      ? filters.colors.filter(c => c !== color)
      : [...filters.colors, color];
    onFiltersChange({ ...filters, colors: newColors });
  };

  const filterPanelBody = (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-x-6 sm:gap-y-3">
        <div className="flex flex-col gap-1.5 sm:flex-1 sm:min-w-[min(100%,220px)]">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t.filters.status}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {activeStatuses.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => toggleStatus(status)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
                  filters.statuses.includes(status)
                    ? status === 'searching'
                      ? 'border-primary/40 bg-primary/10 text-primary shadow-sm dark:border-red-800 dark:bg-red-950/35 dark:text-red-300'
                      : 'border-emerald-500/35 bg-emerald-500/10 text-emerald-800 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/35 dark:text-emerald-300'
                  : 'border-border bg-card text-foreground hover:bg-muted/80'
                }`}
              >
                {(t.pet.status as Record<PetStatus, string>)[status]}
              </button>
            ))}
          </div>
        </div>
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
        <div className="space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t.filters.type}</span>
          <div className="grid grid-cols-2 gap-0.5 rounded-xl border border-border bg-muted/60 p-0.5 sm:grid-cols-4">
            {animalTypeOptions.map((opt) => (
              <Tooltip key={opt.value} delayDuration={280}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onFiltersChange({ ...filters, animalType: opt.value })}
                    className={`flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium transition-all sm:min-h-0 sm:py-1.5 ${
                      filters.animalType === opt.value
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-background/80 hover:text-foreground'
                    }`}
                  >
                    <span className="text-base leading-none" aria-hidden>
                      {opt.icon}
                    </span>
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
        <div className="-mx-1 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {(Object.keys(colorLabels) as PetColor[]).map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => toggleColor(color)}
              className={`shrink-0 whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-sm transition-all ${
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

  if (embedded) {
    return (
      <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              enterKeyHint="search"
              autoComplete="off"
              value={filters.searchQuery}
              onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
              placeholder={t.filters.searchPlaceholder}
              className="h-11 w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm shadow-sm outline-none ring-offset-background transition-shadow focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-xl p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
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
      {/* Search + Create — one row */}
      <div className="flex gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
            placeholder={t.filters.searchPlaceholder}
            className="w-full pl-11 pr-4 py-2.5 bg-card border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow shadow-sm"
          />
        </div>
        {onCreateClick && (
          <button
            type="button"
            onClick={onCreateClick}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm shrink-0 font-medium text-sm"
            title={t.header.createAd}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t.header.createAd}</span>
          </button>
        )}
      </div>

      {/* Collapsible filters */}
      <div className="bg-card border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
        <button
          type="button"
          className="w-full px-4 py-2.5 flex items-center justify-between"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <SlidersHorizontal className="w-4 h-4" />
            <span>{t.filters.filters}</span>
            {activeFilterCount > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleReset(); }}
                className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-accent dark:hover:bg-accent"
              >
                <RotateCcw className="w-3 h-3" />
                {t.filters.reset}
              </button>
            )}
            {isOpen
              ? <ChevronUp className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              : <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            }
          </div>
        </button>

        {isOpen && (
          <div className="px-4 pb-4 space-y-4 border-t border-gray-100 dark:border-gray-700 pt-3">
            {filterPanelBody}
          </div>
        )}
      </div>
    </div>
  );
}
