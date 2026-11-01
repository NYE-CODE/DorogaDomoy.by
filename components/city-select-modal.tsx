import { useState, useMemo, useEffect } from 'react';
import { Search, MapPin, SearchX, X } from 'lucide-react';
import { oblasts, City, searchCities, REGIONAL_CENTERS } from '../utils/cities';
import { useI18n } from '../context/I18nContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from './ui/dialog';
import { cn } from '@/shared/lib/classNames';
import {
  surfaceEmpty,
  surfaceIconButton,
  surfaceInput,
} from '@/shared/styles/surface-classes';
import '../landing/styles/theme-scoped.css';

interface CitySelectModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (city: City | null) => void;
  currentCity?: string;
}

type OblastTab = string | 'all';

const cityChip = (active: boolean, bold = false) =>
  cn(
    'min-h-11 rounded-lg border px-3 py-2.5 text-left text-sm transition-all',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    active
      ? 'border-primary/45 bg-primary/12 font-semibold text-primary shadow-sm'
      : 'border-border bg-card text-foreground hover:bg-muted/80',
    bold && !active && 'font-semibold',
  );

export function CitySelectModal({ open, onClose, onSelect, currentCity }: CitySelectModalProps) {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<OblastTab>('all');

  useEffect(() => {
    if (!open) return;
    setSearchQuery('');
    setActiveTab('all');
  }, [open]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return null;
    return searchCities(q, 50);
  }, [searchQuery]);

  const displayCities = useMemo(() => {
    if (searchResults) return searchResults;
    if (activeTab === 'all') return null;
    const oblast = oblasts.find((o) => o.name === activeTab);
    return oblast?.cities ?? [];
  }, [searchResults, activeTab]);

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
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          'landing-theme flex max-h-[min(85vh,800px)] w-full max-w-2xl flex-col gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-card sm:max-w-2xl',
        )}
      >
        <div className="shrink-0 border-b border-border/80 bg-card px-5 py-4 sm:px-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <DialogTitle className="typo-h2 font-display text-foreground">
                {t.citySelect.title}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm leading-snug text-muted-foreground">
                {(t.citySelect as { subtitle: string }).subtitle}
              </DialogDescription>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className={surfaceIconButton}
              aria-label={t.common.close}
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>

          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.citySelect.searchPlaceholder}
              className={cn(surfaceInput, 'h-11 rounded-lg py-0 pl-10 pr-3 text-sm')}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              autoFocus
            />
          </div>
        </div>

        {!searchQuery ? (
          <div className="shrink-0 border-b border-border/60 bg-landing-muted/40 px-5 py-3 sm:px-6">
            <div className="flex flex-wrap gap-1.5">
              {oblasts.map((oblast) => {
                const isOn = activeTab === oblast.name;
                return (
                  <button
                    key={oblast.name}
                    type="button"
                    onClick={() => setActiveTab(isOn ? 'all' : oblast.name)}
                    className={cn(
                      'min-h-9 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all',
                      isOn
                        ? 'border-primary/45 bg-primary/12 text-primary shadow-sm'
                        : 'border-border bg-card text-foreground hover:bg-muted/80',
                    )}
                  >
                    {oblast.name}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-landing px-5 pb-5 pt-4 sm:px-6">
          {!searchQuery && activeTab === 'all' ? (
            <button
              type="button"
              onClick={handleSelectAll}
              className={cn(
                'mb-5 flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                !currentCity?.trim()
                  ? 'border-primary/45 bg-primary/12 text-primary shadow-sm'
                  : 'border-border bg-card hover:bg-landing-muted/50',
              )}
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MapPin className="size-5" aria-hidden />
              </span>
              <span className="font-semibold">{t.citySelect.allBelarus}</span>
            </button>
          ) : null}

          {!searchQuery && activeTab === 'all' ? (
            <div className="space-y-6">
              {oblasts.map((oblast) => (
                <div key={oblast.name}>
                  {oblast.cities.length === 1 ? (
                    <button
                      type="button"
                      onClick={() => handleSelect(oblast.cities[0])}
                      className={cn(
                        'flex w-full flex-col gap-0.5 rounded-lg border px-4 py-3 text-left transition-all sm:flex-row sm:items-baseline sm:gap-2',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        (currentCity?.trim() || '') === oblast.cities[0].name.trim()
                          ? 'border-primary/45 bg-primary/12 text-primary'
                          : 'border-border bg-card hover:bg-muted/80',
                      )}
                    >
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {oblast.name}
                      </span>
                      <span className="text-sm font-semibold text-foreground">{oblast.cities[0].name}</span>
                    </button>
                  ) : (
                    <>
                      <p className="mb-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {oblast.name}
                      </p>
                      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                        {sortCitiesWithCentersFirst(oblast.cities).map((city) => (
                          <CityButton
                            key={city.name}
                            city={city}
                            isActive={(currentCity?.trim() || '') === city.name.trim()}
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
          ) : null}

          {!searchQuery && activeTab !== 'all' && displayCities ? (
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {sortCitiesWithCentersFirst(displayCities).map((city) => (
                <CityButton
                  key={city.name}
                  city={city}
                  isActive={(currentCity?.trim() || '') === city.name.trim()}
                  onClick={() => handleSelect(city)}
                  isBold={REGIONAL_CENTERS.has(city.name.trim())}
                />
              ))}
            </div>
          ) : null}

          {searchQuery && searchResults
            ? searchResults.length > 0
              ? (
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    {sortCitiesWithCentersFirst(searchResults).map((city) => (
                      <CityButton
                        key={city.name}
                        city={city}
                        isActive={(currentCity?.trim() || '') === city.name.trim()}
                        onClick={() => handleSelect(city)}
                        isBold={REGIONAL_CENTERS.has(city.name.trim())}
                      />
                    ))}
                  </div>
                )
              : (
                  <div className={cn(surfaceEmpty, 'px-4 py-10')}>
                    <SearchX className="mx-auto mb-3 size-10 text-muted-foreground/80" aria-hidden />
                    <p className="font-display font-semibold text-foreground">{t.citySelect.notFound}</p>
                    <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
                      {t.citySelect.tryAnother}
                    </p>
                  </div>
                )
            : null}
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
    <button type="button" onClick={onClick} className={cityChip(isActive, isBold)}>
      {city.name}
    </button>
  );
}

function sortCitiesWithCentersFirst(cities: City[]): City[] {
  const centers = cities.filter((c) => REGIONAL_CENTERS.has(c.name.trim()));
  const rest = cities.filter((c) => !REGIONAL_CENTERS.has(c.name.trim()));
  return [...centers, ...rest];
}
