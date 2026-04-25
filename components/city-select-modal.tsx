import { useState, useMemo, useEffect } from "react";
import { Search, MapPin, SearchX } from "lucide-react";
import { oblasts, City, searchCities, REGIONAL_CENTERS } from "../utils/cities";
import { useI18n } from "../context/I18nContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { cn } from "./ui/utils";

interface CitySelectModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (city: City | null) => void;
  currentCity?: string;
}

type OblastTab = string | "all";

export function CitySelectModal({ open, onClose, onSelect, currentCity }: CitySelectModalProps) {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<OblastTab>("all");

  useEffect(() => {
    if (!open) return;
    setSearchQuery("");
    setActiveTab("all");
  }, [open]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return null;
    return searchCities(q, 50);
  }, [searchQuery]);

  const displayCities = useMemo(() => {
    if (searchResults) return searchResults;
    if (activeTab === "all") return null;
    const oblast = oblasts.find((o) => o.name === activeTab);
    return oblast?.cities ?? [];
  }, [searchResults, activeTab]);

  const handleSelect = (city: City) => {
    onSelect(city);
    setSearchQuery("");
    setActiveTab("all");
  };

  const handleSelectAll = () => {
    onSelect(null);
    setSearchQuery("");
    setActiveTab("all");
  };

  const handleClose = () => {
    setSearchQuery("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent
        showCloseButton
        className="flex max-h-[min(85vh,800px)] w-full max-w-2xl flex-col gap-0 overflow-hidden rounded-2xl border border-border p-0 shadow-xl sm:max-w-2xl"
      >
        <DialogHeader className="space-y-1 border-b border-border px-5 py-4 pr-14 text-left">
          <DialogTitle className="text-xl font-semibold tracking-tight">{t.citySelect.title}</DialogTitle>
          <DialogDescription className="text-sm leading-snug text-muted-foreground">
            {(t.citySelect as { subtitle: string }).subtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="shrink-0 px-5 pt-4">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.citySelect.searchPlaceholder}
              className="h-11 rounded-xl border-border bg-muted/30 pl-10 pr-3 text-base shadow-none transition-colors focus-visible:bg-background"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              autoFocus
            />
          </div>
        </div>

        {!searchQuery && (
          <div className="shrink-0 border-b border-border/60 bg-muted/20 px-5 py-3">
            <div className="flex flex-wrap gap-2">
              {oblasts.map((oblast) => {
                const isOn = activeTab === oblast.name;
                return (
                  <button
                    key={oblast.name}
                    type="button"
                    onClick={() => setActiveTab(isOn ? "all" : oblast.name)}
                    className={cn(
                      "rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                      isOn
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border bg-card text-foreground hover:bg-accent",
                    )}
                  >
                    {oblast.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 pt-3">
          {!searchQuery && activeTab === "all" && (
            <button
              type="button"
              onClick={handleSelectAll}
              className={cn(
                "mb-5 flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                !currentCity?.trim()
                  ? "border-primary bg-primary/10 text-primary shadow-sm"
                  : "border-border bg-card hover:bg-accent",
              )}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background/80 text-primary ring-1 ring-primary/15">
                <MapPin className="h-5 w-5" aria-hidden />
              </span>
              <span className="font-semibold">{t.citySelect.allBelarus}</span>
            </button>
          )}

          {!searchQuery && activeTab === "all" && (
            <div className="space-y-6">
              {oblasts.map((oblast) => (
                <div key={oblast.name}>
                  {oblast.cities.length === 1 ? (
                    <button
                      type="button"
                      onClick={() => handleSelect(oblast.cities[0])}
                      className={cn(
                        "flex w-full flex-col gap-0.5 rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:flex-row sm:items-baseline sm:gap-2",
                        (currentCity?.trim() || "") === oblast.cities[0].name.trim()
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-transparent bg-muted/25 hover:bg-muted/50",
                      )}
                    >
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {oblast.name}
                      </span>
                      <span className="text-sm font-semibold text-foreground">{oblast.cities[0].name}</span>
                    </button>
                  ) : (
                    <>
                      <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {oblast.name}
                      </p>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {sortCitiesWithCentersFirst(oblast.cities).map((city) => (
                          <CityButton
                            key={city.name}
                            city={city}
                            isActive={(currentCity?.trim() || "") === city.name.trim()}
                            onClick={() => handleSelect(city)}
                            isBold={REGIONAL_CENTERS.has(city.name.trim())}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {!searchQuery && activeTab !== "all" && displayCities && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {sortCitiesWithCentersFirst(displayCities).map((city) => (
                <CityButton
                  key={city.name}
                  city={city}
                  isActive={(currentCity?.trim() || "") === city.name.trim()}
                  onClick={() => handleSelect(city)}
                  isBold={REGIONAL_CENTERS.has(city.name.trim())}
                />
              ))}
            </div>
          )}

          {searchQuery && searchResults &&
            (searchResults.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {sortCitiesWithCentersFirst(searchResults).map((city) => (
                  <CityButton
                    key={city.name}
                    city={city}
                    isActive={(currentCity?.trim() || "") === city.name.trim()}
                    onClick={() => handleSelect(city)}
                    isBold={REGIONAL_CENTERS.has(city.name.trim())}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
                <SearchX className="mb-3 h-10 w-10 text-muted-foreground/80" aria-hidden />
                <p className="font-medium text-foreground">{t.citySelect.notFound}</p>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">{t.citySelect.tryAnother}</p>
              </div>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CityButton({
  city,
  isActive,
  onClick,
  isBold = false,
}: {
  city: City;
  isActive: boolean;
  onClick: () => void;
  isBold?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isActive
          ? "border-primary/40 bg-primary/10 font-semibold text-primary shadow-sm"
          : "border-border bg-card font-normal text-foreground hover:border-primary/25 hover:bg-accent",
        isBold && !isActive && "font-semibold text-foreground",
      )}
    >
      {city.name}
    </button>
  );
}

function sortCitiesWithCentersFirst(cities: City[]): City[] {
  const centers = cities.filter((c) => REGIONAL_CENTERS.has(c.name.trim()));
  const rest = cities.filter((c) => !REGIONAL_CENTERS.has(c.name.trim()));
  return [...centers, ...rest];
}
