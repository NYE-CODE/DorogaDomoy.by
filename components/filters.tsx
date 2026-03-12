import { useState } from 'react';
import { Search, SlidersHorizontal, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { AnimalType, PetStatus, PetColor } from '../types/pet';
import { animalTypeLabels, statusLabels, colorLabels, activeStatuses } from '../utils/pet-helpers';
import { useIsMobile } from './ui/use-mobile';
import { BreedCombobox } from './breed-combobox';
import { CAT_BREEDS, DOG_BREEDS } from '../utils/breeds';

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
}

const animalTypeOptions: { value: AnimalType | 'all'; label: string; icon: string }[] = [
  { value: 'all', label: 'Все', icon: '🐾' },
  { value: 'cat', label: animalTypeLabels.cat, icon: '🐱' },
  { value: 'dog', label: animalTypeLabels.dog, icon: '🐕' },
  { value: 'other', label: animalTypeLabels.other, icon: '🦔' },
];

const periodOptions: { value: number | 'all'; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 7, label: '7 дней' },
  { value: 30, label: '30 дней' },
  { value: 90, label: '90 дней' },
];

export function Filters({ filters, onFiltersChange }: FiltersProps) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(!isMobile);

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

  return (
    <div className="space-y-3">
      {/* Search — always visible */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
        <input
          type="text"
          value={filters.searchQuery}
          onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
          placeholder="Поиск по кличке, описанию, приметам..."
          className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow shadow-sm"
        />
      </div>

      {/* Collapsible filters */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
        <button
          type="button"
          className="w-full px-4 py-2.5 flex items-center justify-between"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <SlidersHorizontal className="w-4 h-4" />
            <span>Фильтры</span>
            {activeFilterCount > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-blue-600 text-white text-xs font-semibold rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleReset(); }}
                className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-2 py-1 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <RotateCcw className="w-3 h-3" />
                Сбросить
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
            {/* Row 1: Animal type segments + Breed input */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5 shrink-0">
                {animalTypeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onFiltersChange({ ...filters, animalType: opt.value })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      filters.animalType === opt.value
                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
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
                    placeholder="Порода..."
                  />
                ) : (
                  <input
                    type="text"
                    value={filters.breed}
                    onChange={(e) => onFiltersChange({ ...filters, breed: e.target.value })}
                    placeholder="Порода..."
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800"
                  />
                )}
              </div>
            </div>

            {/* Row 2: Status chips + Period chips */}
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
                            ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                            : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      {statusLabels[status]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide shrink-0">Период</span>
                <div className="flex gap-1.5">
                  {periodOptions.map((opt) => (
                    <button
                      key={String(opt.value)}
                      type="button"
                      onClick={() => onFiltersChange({ ...filters, days: opt.value })}
                      className={`px-3 py-1 text-sm rounded-lg border transition-all ${
                        filters.days === opt.value
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 3: Colors */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide shrink-0">Окрас</span>
              {(Object.keys(colorLabels) as PetColor[]).map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => toggleColor(color)}
                  className={`px-2.5 py-1 text-sm rounded-lg border transition-all ${
                    filters.colors.includes(color)
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  {colorLabels[color]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
