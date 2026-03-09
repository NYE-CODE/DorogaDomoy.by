import { useState, useMemo } from 'react';
import { X, Search, MapPin } from 'lucide-react';
import { oblasts, City, searchCities } from '../utils/cities';
import { useScrollLock } from './ui/use-scroll-lock';

interface CitySelectModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (city: City | null) => void;
  currentCity?: string;
}

type OblastTab = string | 'all';

export function CitySelectModal({ open, onClose, onSelect, currentCity }: CitySelectModalProps) {
  useScrollLock(open);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<OblastTab>('all');

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return searchCities(searchQuery, 20);
  }, [searchQuery]);

  const displayCities = useMemo(() => {
    if (searchResults) return searchResults;
    if (activeTab === 'all') return null;
    const oblast = oblasts.find(o => o.name === activeTab);
    return oblast?.cities ?? [];
  }, [searchResults, activeTab]);

  if (!open) return null;

  const handleSelect = (city: City) => {
    onSelect(city);
    setSearchQuery('');
    setActiveTab('all');
  };

  const handleSelectAll = () => {
    onSelect(null);
    setSearchQuery('');
    setActiveTab('all');
  };

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Выбор города</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pt-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Введите город..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-sm"
              autoFocus
            />
          </div>
        </div>

        {/* Oblast tabs */}
        {!searchQuery && (
          <div className="px-5 pb-3">
            <div className="flex flex-wrap gap-2">
              {oblasts.map((oblast) => (
                <button
                  key={oblast.name}
                  onClick={() => setActiveTab(activeTab === oblast.name ? 'all' : oblast.name)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors whitespace-nowrap ${
                    activeTab === oblast.name
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {oblast.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Cities grid */}
        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {/* "Вся Беларусь" option */}
          {!searchQuery && activeTab === 'all' && (
            <button
              onClick={handleSelectAll}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-4 transition-colors border ${
                !currentCity
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <MapPin className="w-5 h-5" />
              <span className="font-medium">Вся Беларусь</span>
            </button>
          )}

          {/* When no tab selected and no search — show all oblasts */}
          {!searchQuery && activeTab === 'all' && (
            <div className="space-y-5">
              {oblasts.map((oblast) => (
                <div key={oblast.name}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    {oblast.name}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                    {oblast.cities.map((city) => (
                      <CityButton
                        key={city.name}
                        city={city}
                        isActive={currentCity === city.name}
                        onClick={() => handleSelect(city)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* When a tab is selected */}
          {!searchQuery && activeTab !== 'all' && displayCities && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
              {displayCities.map((city) => (
                <CityButton
                  key={city.name}
                  city={city}
                  isActive={currentCity === city.name}
                  onClick={() => handleSelect(city)}
                />
              ))}
            </div>
          )}

          {/* Search results */}
          {searchQuery && searchResults && (
            searchResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                {searchResults.map((city) => (
                  <CityButton
                    key={city.name}
                    city={city}
                    isActive={currentCity === city.name}
                    onClick={() => handleSelect(city)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Город не найден</p>
                <p className="text-sm mt-1">Попробуйте изменить запрос</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function CityButton({ city, isActive, onClick }: { city: City; isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
        isActive
          ? 'bg-blue-50 text-blue-700 font-medium'
          : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      {city.name}
    </button>
  );
}
