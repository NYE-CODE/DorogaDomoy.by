import { X, Search, MapPin } from "lucide-react";
import { useState } from "react";
import { useI18n } from "../../../context/I18nContext";
import { useScrollLock } from "../../../components/ui/use-scroll-lock";

interface RegionSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRegion: string;
  onSelectRegion: (region: string) => void;
}

const regions = [
  { name: "Минск", type: "city" },
  { name: "Брестская область", type: "region" },
  { name: "Витебская область", type: "region" },
  { name: "Гомельская область", type: "region" },
  { name: "Гродненская область", type: "region" },
  { name: "Минская область", type: "region" },
  { name: "Могилевская область", type: "region" },
];

const cities = {
  "Брестская область": [
    "Барановичи", "Берёза", "Брест", "Ганцевичи", "Дрогичин", 
    "Жабинка", "Иваново", "Кобрин", "Лунинец", "Пинск", "Столин"
  ],
  "Витебская область": [
    "Витебск", "Глубокое", "Лепель", "Новополоцк", 
    "Орша", "Полоцк", "Поставы"
  ],
  "Гомельская область": [
    "Гомель", "Добруш", "Жлобин", "Калинковичи", "Мозырь", 
    "Речица", "Светлогорск"
  ],
  "Гродненская область": [
    "Волковыск", "Гродно", "Лида", "Новогрудок", 
    "Слоним", "Сморгонь", "Щучин"
  ],
  "Минская область": [
    "Борисов", "Вилейка", "Дзержинск", "Жодино", "Клецк", 
    "Логойск", "Любань", "Марьина Горка", "Молодечно", 
    "Несвиж", "Слуцк", "Смолевичи", "Солигорск", "Старые Дороги"
  ],
  "Могилевская область": [
    "Бобруйск", "Горки", "Кличев", "Костюковичи", "Кричев", 
    "Могилев", "Осиповичи", "Славгород", "Чериков", "Шклов"
  ],
};

export function RegionSelector({ isOpen, onClose, selectedRegion, onSelectRegion }: RegionSelectorProps) {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  useScrollLock(isOpen);

  if (!isOpen) return null;

  const q = searchQuery.trim().toLowerCase().replace(/ё/g, 'е');
  const filteredRegions = regions.filter((region) =>
    region.name.toLowerCase().replace(/ё/g, 'е').includes(q)
  );

  const getFilteredCities = () => {
    const q = searchQuery.trim().toLowerCase().replace(/ё/g, 'е');
    if (activeFilter && cities[activeFilter as keyof typeof cities]) {
      return cities[activeFilter as keyof typeof cities].filter((city) =>
        city.trim().toLowerCase().replace(/ё/g, 'е').includes(q)
      );
    }

    // If no filter, show all cities that match search
    const allCities: { city: string; region: string }[] = [];
    Object.entries(cities).forEach(([region, cityList]) => {
        cityList.forEach((city) => {
          if (city.trim().toLowerCase().replace(/ё/g, 'е').includes(q)) {
          allCities.push({ city, region });
        }
      });
    });
    return allCities;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-background rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-bold text-foreground">{t.citySelect.title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X size={24} className="text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
          <div className="p-6 space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <input
                type="text"
                placeholder={t.citySelect.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-background text-foreground placeholder:text-muted-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors hover:border-muted-foreground/30"
              />
            </div>

            {/* Region Filters */}
            <div className="flex flex-wrap gap-2">
              {regions.map((region) => (
                <button
                  key={region.name}
                  onClick={() => setActiveFilter(activeFilter === region.name ? null : region.name)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    activeFilter === region.name
                      ? "bg-[#FF9800] text-white border-[#FF9800]"
                      : "bg-background text-foreground border-border hover:border-primary"
                  }`}
                >
                  {region.name}
                </button>
              ))}
            </div>

            {/* All Belarus Button */}
            <button
              onClick={() => onSelectRegion(t.citySelect.allBelarus)}
              className="w-full flex items-center gap-3 px-6 py-4 bg-orange-50 border-2 border-[#FF9800] rounded-lg hover:bg-orange-100 transition-colors"
            >
              <MapPin size={20} className="text-[#FF9800]" />
              <span className="text-[#FF9800] font-bold text-lg">{t.citySelect.allBelarus}</span>
            </button>

            {/* Cities List */}
            {!activeFilter && searchQuery === "" && (
              <div className="space-y-6">
                {/* Minsk */}
                <div>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">
                    МИНСК
                  </h3>
                  <button
                    onClick={() => onSelectRegion("Минск")}
                    className="text-gray-700 hover:text-[#FF9800] transition-colors"
                  >
                    Минск
                  </button>
                </div>

                {/* Regions with cities */}
                {Object.entries(cities).map(([region, cityList]) => (
                  <div key={region}>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">
                      {region}
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {cityList.map((city) => (
                        <button
                          key={city}
                          onClick={() => onSelectRegion(city)}
                          className="text-gray-700 hover:text-[#FF9800] transition-colors text-left"
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Filtered Cities */}
            {(activeFilter || searchQuery !== "") && (
              <div>
                {activeFilter && cities[activeFilter as keyof typeof cities] && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">
                      {activeFilter}
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {getFilteredCities().map((city) => (
                        <button
                          key={typeof city === "string" ? city : city.city}
                          onClick={() => onSelectRegion(typeof city === "string" ? city : city.city)}
                          className="text-gray-700 hover:text-[#FF9800] transition-colors text-left"
                        >
                          {typeof city === "string" ? city : city.city}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!activeFilter && searchQuery !== "" && (
                  <div className="space-y-6">
                    {/* Show matching regions */}
                    {filteredRegions.map((region) => (
                      <button
                        key={region.name}
                        onClick={() => onSelectRegion(region.name)}
                        className="block text-gray-700 hover:text-[#FF9800] transition-colors"
                      >
                        {region.name}
                      </button>
                    ))}

                    {/* Show matching cities */}
                    {getFilteredCities().map((item, index) => {
                      if (typeof item !== "string") {
                        return (
                          <button
                            key={index}
                            onClick={() => onSelectRegion(item.city)}
                            className="block text-gray-700 hover:text-[#FF9800] transition-colors"
                          >
                            {item.city} <span className="text-gray-400 text-sm">({item.region})</span>
                          </button>
                        );
                      }
                      return null;
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
