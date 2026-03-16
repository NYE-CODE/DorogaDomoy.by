import { useState } from 'react';
import { Search, SlidersHorizontal, ChevronDown, ChevronUp, RotateCcw, Plus, X } from 'lucide-react';
import { AnimalType, PetStatus, PetColor } from '../types/pet';
import { activeStatuses, colorLabels } from '../utils/pet-helpers';
import { useIsMobile } from './ui/use-mobile';
import { useI18n } from '../context/I18nContext';
import { BreedCombobox } from './breed-combobox';
import { CAT_BREEDS, DOG_BREEDS } from '../utils/breeds';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

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
      <div className="flex flex-col sm:flex-row sm:items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide shrink-0">Статус</span>
          <div className="flex gap-1.5">
            {activeStatuses.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => toggleStatus(status)}
                className={`px-3 py-1 text-sm rounded-lg border transition-all ${
                  filters.statuses.includes(status)
                    ? status === 'searching'
                      ? 'bg-primary/10 text-primary border-primary/30 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                      : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
                  : 'bg-card text-foreground border-border hover:bg-muted hover:border-border'
                }`}
              >
                {(t.pet.status as any)[status]}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide shrink-0">Период</span>
          <Select
            value={filters.days === 'all' ? 'all' : String(filters.days)}
            onValueChange={(v) => onFiltersChange({ ...filters, days: v === 'all' ? 'all' : Number(v) })}
          >
            <SelectTrigger className="flex-1 min-w-0">
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
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex bg-muted rounded-lg p-0.5 shrink-0">
          {animalTypeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onFiltersChange({ ...filters, animalType: opt.value })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filters.animalType === opt.value
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <span className="text-base leading-none">{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-0">
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
              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-card"
            />
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide shrink-0">Окрас</span>
        {(Object.keys(colorLabels) as PetColor[]).map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => toggleColor(color)}
            className={`px-2.5 py-1 text-sm rounded-lg border transition-all ${
              filters.colors.includes(color)
                ? 'bg-muted text-muted-foreground border-border'
                : 'bg-card text-foreground border-border hover:bg-muted hover:border-border'
            }`}
          >
            {(t.pet.color as any)[color]}
          </button>
        ))}
      </div>
    </>
  );

  if (embedded) {
    return (
      <div className="space-y-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
              placeholder={t.filters.searchPlaceholder}
              className="w-full pl-9 pr-4 py-2.5 bg-card border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          {onClose && (
            <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-accent dark:hover:bg-accent text-gray-500 dark:text-gray-400" aria-label={t.common.close}>
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleReset} className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-primary">
              <RotateCcw className="w-3 h-3" />
              {t.filters.reset}
            </button>
          </div>
        )}
        <div className="space-y-4">{filterPanelBody}</div>
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
