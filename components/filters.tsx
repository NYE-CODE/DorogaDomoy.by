import { useState, useRef, useEffect } from 'react';
import { X, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { AnimalType, PetStatus, PetColor } from '../types/pet';
import { animalTypeLabels, statusLabels, colorLabels, activeStatuses } from '../utils/pet-helpers';
import { searchCities, City } from '../utils/cities';

export interface FilterState {
  animalType: AnimalType | 'all';
  breed: string;
  colors: PetColor[];
  statuses: PetStatus[];
  city: string;
  days: number | 'all';
  distance: number | 'all'; // in kilometers
  searchQuery: string;
}

interface FiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onCitySelect?: (city: City) => void;
  userLocation?: { lat: number; lng: number } | null;
  onRequestLocation?: () => void;
}

export function Filters({ filters, onFiltersChange, onCitySelect, userLocation, onRequestLocation }: FiltersProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [citySuggestions, setCitySuggestions] = useState<City[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const cityInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFiltersChange({
      animalType: 'all',
      breed: '',
      colors: [],
      statuses: [],
      city: '',
      days: 'all',
      distance: 'all',
      searchQuery: '',
    });
  };

  const hasActiveFilters = 
    filters.animalType !== 'all' ||
    filters.breed !== '' ||
    filters.colors.length > 0 ||
    filters.statuses.length > 0 ||
    filters.city !== '' ||
    filters.days !== 'all' ||
    filters.distance !== 'all' ||
    filters.searchQuery !== '';

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

  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onFiltersChange({ ...filters, city: value });
    if (value.length > 2) {
      setCitySuggestions(searchCities(value));
      setShowSuggestions(true);
    } else {
      setCitySuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleCitySelect = (city: City) => {
    onFiltersChange({ ...filters, city: city.name });
    if (onCitySelect) {
      onCitySelect(city);
    }
    setCitySuggestions([]);
    setShowSuggestions(false);
  };

  useEffect(() => {
    const currentRef = cityInputRef.current;
    const suggestionsRefCurrent = suggestionsRef.current;
    const handleClickOutside = (event: MouseEvent) => {
      if (currentRef && !currentRef.contains(event.target as Node) && suggestionsRefCurrent && !suggestionsRefCurrent.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div 
        className="p-4 flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Фильтры</h3>
          {hasActiveFilters && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
              Активны
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Сбросить
            </button>
          )}
          <button className="text-gray-500 hover:text-gray-700">
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Поиск по тексту */}
            <div className="md:col-span-2 lg:col-span-3 xl:col-span-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Поиск по описанию
              </label>
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
                placeholder="Поиск по кличке, описанию, особым приметам..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Тип животного */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Тип животного
              </label>
              <select
                value={filters.animalType}
                onChange={(e) => onFiltersChange({ ...filters, animalType: e.target.value as AnimalType | 'all' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Все</option>
                <option value="cat">{animalTypeLabels.cat}</option>
                <option value="dog">{animalTypeLabels.dog}</option>
                <option value="other">{animalTypeLabels.other}</option>
              </select>
            </div>

            {/* Порода */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Порода
              </label>
              <input
                type="text"
                value={filters.breed}
                onChange={(e) => onFiltersChange({ ...filters, breed: e.target.value })}
                placeholder="Введите породу..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Город */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Город
              </label>
              <input
                type="text"
                value={filters.city}
                onChange={handleCityChange}
                placeholder="Введите город..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                ref={cityInputRef}
              />
              {showSuggestions && citySuggestions.length > 0 && (
                <div
                  className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                  ref={suggestionsRef}
                >
                  {citySuggestions.map((city) => (
                    <div
                      key={city.name}
                      className="cursor-pointer select-none px-4 py-2 hover:bg-gray-100"
                      onClick={() => handleCitySelect(city)}
                    >
                      {city.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Период */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Период публикации
              </label>
              <select
                value={filters.days}
                onChange={(e) => onFiltersChange({ ...filters, days: e.target.value === 'all' ? 'all' : Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Весь период</option>
                <option value="7">За 7 дней</option>
                <option value="30">За 30 дней</option>
                <option value="90">За 90 дней</option>
              </select>
            </div>

            {/* Расстояние */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Расстояние от меня
              </label>
              <div className="space-y-2">
                <select
                  value={filters.distance}
                  onChange={(e) => onFiltersChange({ ...filters, distance: e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!userLocation}
                >
                  <option value="all">Любое</option>
                  <option value="5">До 5 км</option>
                  <option value="10">До 10 км</option>
                  <option value="25">До 25 км</option>
                  <option value="50">До 50 км</option>
                </select>
                {!userLocation && onRequestLocation && (
                  <button
                    type="button"
                    onClick={onRequestLocation}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Включить геолокацию
                  </button>
                )}
              </div>
            </div>

            {/* Статус */}
            <div className="md:col-span-2 lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Статус
              </label>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {activeStatuses.map((status) => (
                  <label key={status} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.statuses.includes(status)}
                      onChange={() => toggleStatus(status)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{statusLabels[status]}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Окрас */}
            <div className="md:col-span-2 lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Окрас
              </label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(colorLabels) as PetColor[]).map((color) => (
                  <button
                    key={color}
                    onClick={() => toggleColor(color)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      filters.colors.includes(color)
                        ? 'bg-blue-100 text-blue-700 border-blue-300'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {colorLabels[color]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}