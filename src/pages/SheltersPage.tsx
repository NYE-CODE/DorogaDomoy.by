import '../../landing/styles/theme-scoped.css';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Header } from '@/widgets/layout/Header';
import { Footer } from '@/widgets/layout/Footer';
import { useI18n } from '@/app/providers/I18nContext';
import { sheltersApi, type ShelterResponse } from '@/shared/api/client';
import type { Pet } from '@/entities/pet/model/types';
import {
  MapPin,
  Building2,
  ChevronRight,
  PawPrint,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { buildShelterPetUrl, loadCatalogShelterPets } from '@/shared/lib/shelter-pet-browse';
import {
  shelterAnimalFocusLabel,
  shelterKindLabel,
  shelterLogoSrc,
} from '@/shared/lib/shelter-public';
import { cn } from '@/shared/lib/classNames';
import { getPaginationMeta, paginateArray } from '@/shared/lib/pagination';
import {
  applySeo,
  canonicalUrlFromPath,
  SEO_KEYWORDS,
  SEO_ROBOTS_PUBLIC,
  truncateMetaDescription,
} from '@/shared/lib/seo';
import { pageContainer } from '@/shared/styles/layout-classes';
import { interactiveTransitionClass } from '@/shared/styles/interactive-classes';
import {
  surfaceEmpty,
  surfaceFieldLabel,
  surfaceMutedWell,
  surfacePage,
} from '@/shared/styles/surface-classes';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { LandingShelterPetCard } from '../../components/landing-shelter-pet-card';
import { SearchListPagination } from '../../components/search/search-list-pagination';
import { PartnerAdSlot } from '@/features/partner-ads/PartnerAdSlot';

const SHELTERS_PETS_PAGE_SIZE = 12;

export default function SheltersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useI18n();
  const s = t.landing.shelters;
  const ALL_CITIES_VALUE = '__all__';
  const ALL_KINDS_VALUE = '__all_kinds__';
  const ALL_FOCUS_VALUE = '__all_focus__';
  const [cityFilter, setCityFilter] = useState('');
  const [kindFilter, setKindFilter] = useState('');
  const [focusFilter, setFocusFilter] = useState('');
  const [citySelectOpen, setCitySelectOpen] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [allShelters, setAllShelters] = useState<ShelterResponse[]>([]);
  const [shelterPets, setShelterPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [petsLoading, setPetsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [petsError, setPetsError] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [petsPage, setPetsPage] = useState(1);
  const [petCityFilter, setPetCityFilter] = useState(() => searchParams.get('petCity') ?? '');
  const [petAnimalFilter, setPetAnimalFilter] = useState<'all' | 'cat' | 'dog' | 'other'>(() => {
    const animal = searchParams.get('petAnimal');
    return animal === 'cat' || animal === 'dog' || animal === 'other' ? animal : 'all';
  });

  useEffect(() => {
    const desc = truncateMetaDescription(`${s.pageSubtitle} DorogaDomoy.by.`);
    applySeo({
      title: `${s.pageTitle} ? DorogaDomoy.by`,
      description: desc,
      canonicalUrl: canonicalUrlFromPath('/shelters'),
      robots: SEO_ROBOTS_PUBLIC,
      keywords: SEO_KEYWORDS,
    });
  }, [s.pageTitle, s.pageSubtitle]);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    sheltersApi
      .list()
      .then(setAllShelters)
      .catch(() => {
        setAllShelters([]);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cityOptions = useMemo(() => {
    return Array.from(
      new Set(
        allShelters
          .map((x) => x.city?.trim())
          .filter((x): x is string => Boolean(x)),
      ),
    ).sort((a, b) => a.localeCompare(b, 'ru'));
  }, [allShelters]);

  const filteredCityOptions = useMemo(() => {
    const q = citySearch.trim().toLowerCase();
    if (!q) return cityOptions;
    return cityOptions.filter((city) => city.toLowerCase().includes(q));
  }, [cityOptions, citySearch]);

  const activeTab = searchParams.get('tab') === 'pets' ? 'pets' : 'orgs';

  const activeFilterCount =
    activeTab === 'orgs'
      ? [cityFilter, kindFilter, focusFilter].filter(Boolean).length
      : (petCityFilter.trim() ? 1 : 0) + (petAnimalFilter !== 'all' ? 1 : 0);

  const resetFilters = () => {
    if (activeTab === 'orgs') {
      setCityFilter('');
      setKindFilter('');
      setFocusFilter('');
      return;
    }
    setPetCityFilter('');
    setPetAnimalFilter('all');
  };

  const list = useMemo(() => {
    return allShelters.filter((x) => {
      if (cityFilter && x.city?.trim() !== cityFilter) return false;
      if (kindFilter && x.kind !== kindFilter) return false;
      if (focusFilter && x.animal_focus !== focusFilter) return false;
      return true;
    });
  }, [allShelters, cityFilter, kindFilter, focusFilter]);

  const petCities = useMemo(() => {
    return Array.from(new Set(shelterPets.map((x) => x.city?.trim()).filter((x): x is string => Boolean(x)))).sort((a, b) =>
      a.localeCompare(b, 'ru'),
    );
  }, [shelterPets]);

  const filteredPets = useMemo(() => {
    return shelterPets.filter((p) => {
      if (petCityFilter && p.city?.trim() !== petCityFilter) return false;
      if (petAnimalFilter !== 'all' && p.animalType !== petAnimalFilter) return false;
      return true;
    });
  }, [shelterPets, petCityFilter, petAnimalFilter]);

  const petsPagination = useMemo(
    () =>
      getPaginationMeta({
        page: petsPage,
        pageSize: SHELTERS_PETS_PAGE_SIZE,
        totalItems: filteredPets.length,
      }),
    [petsPage, filteredPets.length],
  );

  const pagedPets = useMemo(
    () =>
      paginateArray(filteredPets, {
        page: petsPagination.page,
        pageSize: SHELTERS_PETS_PAGE_SIZE,
        totalItems: filteredPets.length,
      }),
    [filteredPets, petsPagination.page],
  );

  useEffect(() => {
    setPetsPage(1);
  }, [petCityFilter, petAnimalFilter, activeTab]);

  useEffect(() => {
    if (petsPage !== petsPagination.page) {
      setPetsPage(petsPagination.page);
    }
  }, [petsPage, petsPagination.page]);

  const handlePetsPageChange = useCallback((page: number) => {
    setPetsPage(page);
    document.getElementById('shelters-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const setTab = (tab: 'orgs' | 'pets') => {
    const next = new URLSearchParams(searchParams);
    if (tab === 'orgs') next.delete('tab');
    else next.set('tab', 'pets');
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    if (activeTab !== 'pets') return;
    const next = new URLSearchParams(searchParams);
    next.set('tab', 'pets');
    if (petCityFilter.trim()) next.set('petCity', petCityFilter.trim());
    else next.delete('petCity');
    if (petAnimalFilter !== 'all') next.set('petAnimal', petAnimalFilter);
    else next.delete('petAnimal');
    const nextStr = next.toString();
    const curStr = searchParams.toString();
    if (nextStr !== curStr) setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync pet filter params to URL only
  }, [activeTab, petCityFilter, petAnimalFilter]);

  useEffect(() => {
    if (activeTab !== 'pets') return;

    let cancelled = false;
    setPetsLoading(true);
    setPetsError(false);
    loadCatalogShelterPets()
      .then((rows) => {
        if (!cancelled) setShelterPets(rows);
      })
      .catch(() => {
        if (!cancelled) {
          setShelterPets([]);
          setPetsError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setPetsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  const modes: { id: 'orgs' | 'pets'; icon: typeof Building2; label: string }[] = [
    { id: 'orgs', icon: Building2, label: s.tabOrganizations },
    { id: 'pets', icon: PawPrint, label: s.tabPets },
  ];

  return (
    <div
      className={cn(
        'landing-theme flex min-h-screen flex-col',
        surfacePage,
        'max-md:pb-[calc(4.75rem+max(env(safe-area-inset-bottom,0px),8px))]',
      )}
    >
      <Header showCitySelector={false} />
      <main className="flex-1 py-6 sm:py-8">
        <div className={cn(pageContainer, 'mx-auto px-4')}>
          <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 space-y-2">
              <h1 className="typo-h2 font-display text-foreground">{s.pageTitle}</h1>
              <p className="typo-lead max-w-2xl text-muted-foreground">{s.pageSubtitle}</p>
            </div>
            <div
              role="radiogroup"
              aria-label={s.pageTitle}
              className="inline-flex shrink-0 self-start rounded-full border border-border bg-card p-1 shadow-sm sm:self-auto"
            >
              {modes.map(({ id, icon: Icon, label }) => {
                const selected = activeTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    title={label}
                    onClick={() => setTab(id)}
                    className={cn(
                      'inline-flex min-h-10 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
                      selected
                        ? 'bg-landing-dark text-on-landing-dark shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    <span className="hidden sm:inline">{label}</span>
                    <span className="sr-only sm:hidden">{label}</span>
                  </button>
                );
              })}
            </div>
          </header>

          <PartnerAdSlot placement="shelters-top" className="mb-6" />

          <div className="mb-4 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="inline-flex min-h-12 shrink-0 items-center gap-1.5 rounded-3xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-search transition-colors hover:bg-landing-muted"
            >
              <SlidersHorizontal className="size-4 shrink-0" aria-hidden />
              <span>{t.filters.filters}</span>
              {activeFilterCount > 0 ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>
          </div>

          <div className="flex items-start gap-6 lg:gap-8">
            <aside className="sticky top-24 hidden w-64 shrink-0 self-start lg:block xl:w-72">
              <div className={surfaceMutedWell}>
                <SheltersFiltersPanel
                  activeTab={activeTab}
                  t={t}
                  s={s}
                  ALL_CITIES_VALUE={ALL_CITIES_VALUE}
                  ALL_KINDS_VALUE={ALL_KINDS_VALUE}
                  ALL_FOCUS_VALUE={ALL_FOCUS_VALUE}
                  cityFilter={cityFilter}
                  setCityFilter={setCityFilter}
                  citySelectOpen={citySelectOpen}
                  setCitySelectOpen={setCitySelectOpen}
                  citySearch={citySearch}
                  setCitySearch={setCitySearch}
                  filteredCityOptions={filteredCityOptions}
                  kindFilter={kindFilter}
                  setKindFilter={setKindFilter}
                  focusFilter={focusFilter}
                  setFocusFilter={setFocusFilter}
                  petCityFilter={petCityFilter}
                  setPetCityFilter={setPetCityFilter}
                  petCities={petCities}
                  petAnimalFilter={petAnimalFilter}
                  setPetAnimalFilter={setPetAnimalFilter}
                  activeFilterCount={activeFilterCount}
                  onReset={resetFilters}
                />
              </div>
            </aside>

            <section id="shelters-results" className="min-w-0 flex-1 space-y-4 sm:space-y-5">
              {activeTab === 'orgs' ? (
                loading ? (
                  <p className="text-muted-foreground">{t.common.loading}</p>
                ) : error ? (
                  <p className="text-destructive">{s.loadError}</p>
                ) : list.length === 0 ? (
                  <div className={cn(surfaceEmpty, 'space-y-2')}>
                    <p className="font-medium text-foreground">{s.empty}</p>
                    <p className="text-sm text-muted-foreground">{s.emptyHint}</p>
                  </div>
                ) : (
                  <>
                    <ul className="flex flex-col gap-3 sm:hidden">
                      {list.map((row) => {
                        const logo = shelterLogoSrc(row.logo_url);
                        const locationLine = [row.city, row.address].filter(Boolean).join(', ');
                        return (
                          <li key={row.id} className="h-full">
                            <Link
                              to={`/shelters/${row.id}`}
                              className={cn(
                                interactiveTransitionClass,
                                'group flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-card',
                                'hover:border-shelter-border focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                              )}
                            >
                              <div className="relative flex aspect-[4/3] w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-landing-muted">
                                {logo ? (
                                  <img src={logo} alt="" className="size-full object-cover object-center" />
                                ) : (
                                  <Building2 className="size-16 text-muted-foreground opacity-35" aria-hidden />
                                )}
                              </div>
                              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                                <span className="inline-flex max-w-full self-start truncate rounded-full border border-shelter-border bg-shelter-soft px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-shelter-foreground">
                                  {shelterKindLabel(row.kind, s)}
                                </span>
                                <h2 className="line-clamp-2 text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-shelter">
                                  {row.name}
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                  {shelterAnimalFocusLabel(row.animal_focus, s)}
                                </p>
                                <p className="flex min-h-[2rem] items-start gap-1.5 text-sm text-muted-foreground">
                                  <MapPin size={16} className="mt-0.5 shrink-0 text-shelter" aria-hidden />
                                  <span className="line-clamp-2">{locationLine || '—'}</span>
                                </p>
                              </div>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>

                    <div className="hidden overflow-hidden rounded-2xl border border-border bg-card sm:block">
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-landing-muted/60">
                            <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                              <th className="px-4 py-3 font-semibold">{s.tableColName}</th>
                              <th className="px-4 py-3 font-semibold">{s.tableColKind}</th>
                              <th className="px-4 py-3 font-semibold">{s.tableColCity}</th>
                              <th className="px-4 py-3 font-semibold">{s.tableColFocus}</th>
                              <th className="px-4 py-3 text-right font-semibold">{s.tableColAction}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {list.map((row) => {
                              const logo = shelterLogoSrc(row.logo_url);
                              return (
                                <tr
                                  key={row.id}
                                  className="border-t border-border text-foreground transition-colors hover:bg-landing-muted/40"
                                >
                                  <td className="px-4 py-3">
                                    <Link to={`/shelters/${row.id}`} className="group flex items-center gap-3">
                                      <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-landing-muted">
                                        {logo ? (
                                          <img
                                            src={logo}
                                            alt=""
                                            className="size-full object-cover object-center"
                                          />
                                        ) : (
                                          <Building2
                                            className="size-6 text-muted-foreground opacity-50"
                                            aria-hidden
                                          />
                                        )}
                                      </div>
                                      <span className="font-medium transition-colors group-hover:text-shelter">
                                        {row.name}
                                      </span>
                                    </Link>
                                  </td>
                                  <td className="px-4 py-3 text-muted-foreground">
                                    {shelterKindLabel(row.kind, s)}
                                  </td>
                                  <td className="px-4 py-3 text-muted-foreground">{row.city || '—'}</td>
                                  <td className="px-4 py-3 text-muted-foreground">
                                    {shelterAnimalFocusLabel(row.animal_focus, s)}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <Link
                                      to={`/shelters/${row.id}`}
                                      className="inline-flex items-center gap-1 font-medium text-shelter transition-colors hover:text-shelter-foreground"
                                    >
                                      {s.detailOpen}
                                      <ChevronRight className="size-4 shrink-0" aria-hidden />
                                    </Link>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )
              ) : petsLoading ? (
                <p className="text-muted-foreground">{t.common.loading}</p>
              ) : petsError ? (
                <p className="text-destructive">{s.loadError}</p>
              ) : filteredPets.length === 0 ? (
                <div className={cn(surfaceEmpty, 'space-y-3')}>
                  <p className="text-sm text-muted-foreground">
                    {shelterPets.length > 0 ? s.petsFilterEmpty : s.emptyPets}
                  </p>
                  {shelterPets.length > 0 ? (
                    <button
                      type="button"
                      className="text-sm font-medium text-primary hover:underline"
                      onClick={() => {
                        setPetCityFilter('');
                        setPetAnimalFilter('all');
                      }}
                    >
                      {s.detailPetsResetFilters}
                    </button>
                  ) : null}
                </div>
              ) : (
                <>
                  <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 lg:gap-6">
                    {pagedPets.map((pet) => (
                      <li key={pet.id} className="h-full">
                        <LandingShelterPetCard
                          pet={pet}
                          to={buildShelterPetUrl(pet.id, {
                            source: 'catalog',
                            catalogCity: petCityFilter,
                            catalogAnimal: petAnimalFilter,
                          })}
                        />
                      </li>
                    ))}
                  </ul>
                  <SearchListPagination
                    page={petsPagination.page}
                    totalPages={petsPagination.totalPages}
                    onPageChange={handlePetsPageChange}
                  />
                </>
              )}
            </section>
          </div>
        </div>
      </main>

      <Dialog open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <DialogContent
          showCloseButton={false}
          className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>{t.filters.filters}</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <SheltersFiltersPanel
              activeTab={activeTab}
              t={t}
              s={s}
              ALL_CITIES_VALUE={ALL_CITIES_VALUE}
              ALL_KINDS_VALUE={ALL_KINDS_VALUE}
              ALL_FOCUS_VALUE={ALL_FOCUS_VALUE}
              cityFilter={cityFilter}
              setCityFilter={setCityFilter}
              citySelectOpen={citySelectOpen}
              setCitySelectOpen={setCitySelectOpen}
              citySearch={citySearch}
              setCitySearch={setCitySearch}
              filteredCityOptions={filteredCityOptions}
              kindFilter={kindFilter}
              setKindFilter={setKindFilter}
              focusFilter={focusFilter}
              setFocusFilter={setFocusFilter}
              petCityFilter={petCityFilter}
              setPetCityFilter={setPetCityFilter}
              petCities={petCities}
              petAnimalFilter={petAnimalFilter}
              setPetAnimalFilter={setPetAnimalFilter}
              activeFilterCount={activeFilterCount}
              onReset={resetFilters}
              onClose={() => setMobileFiltersOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <div className="hidden lg:block">
        <Footer />
      </div>
    </div>
  );
}

type SheltersFiltersPanelProps = {
  activeTab: 'orgs' | 'pets';
  t: ReturnType<typeof useI18n>['t'];
  s: ReturnType<typeof useI18n>['t']['landing']['shelters'];
  ALL_CITIES_VALUE: string;
  ALL_KINDS_VALUE: string;
  ALL_FOCUS_VALUE: string;
  cityFilter: string;
  setCityFilter: (v: string) => void;
  citySelectOpen: boolean;
  setCitySelectOpen: (v: boolean) => void;
  citySearch: string;
  setCitySearch: (v: string) => void;
  filteredCityOptions: string[];
  kindFilter: string;
  setKindFilter: (v: string) => void;
  focusFilter: string;
  setFocusFilter: (v: string) => void;
  petCityFilter: string;
  setPetCityFilter: (v: string) => void;
  petCities: string[];
  petAnimalFilter: 'all' | 'cat' | 'dog' | 'other';
  setPetAnimalFilter: (v: 'all' | 'cat' | 'dog' | 'other') => void;
  activeFilterCount: number;
  onReset: () => void;
  onClose?: () => void;
};

function SheltersFiltersPanel({
  activeTab,
  t,
  s,
  ALL_CITIES_VALUE,
  ALL_KINDS_VALUE,
  ALL_FOCUS_VALUE,
  cityFilter,
  setCityFilter,
  citySelectOpen,
  setCitySelectOpen,
  citySearch,
  setCitySearch,
  filteredCityOptions,
  kindFilter,
  setKindFilter,
  focusFilter,
  setFocusFilter,
  petCityFilter,
  setPetCityFilter,
  petCities,
  petAnimalFilter,
  setPetAnimalFilter,
  activeFilterCount,
  onReset,
  onClose,
}: SheltersFiltersPanelProps) {
  return (
    <div className="flex h-full flex-col gap-5 p-5" role="region" aria-label={t.filters.filters}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-base font-semibold text-foreground">{t.filters.filters}</h2>
        <div className="flex items-center gap-1">
          {activeFilterCount > 0 ? (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-card hover:text-primary"
              title={t.filters.reset}
              aria-label={t.filters.reset}
            >
              <RotateCcw className="size-3.5" aria-hidden />
              {t.filters.reset}
            </button>
          ) : null}
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-card hover:text-foreground lg:hidden"
              aria-label={t.common.close}
            >
              <X className="size-5" aria-hidden />
            </button>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pb-2">
        {activeTab === 'orgs' ? (
          <>
            <div className="w-full space-y-1.5">
              <label htmlFor="shelter-city" className={surfaceFieldLabel}>
                {s.cityLabel}
              </label>
              <Select
                value={cityFilter || ALL_CITIES_VALUE}
                open={citySelectOpen}
                onOpenChange={(open) => {
                  setCitySelectOpen(open);
                  if (!open) setCitySearch('');
                }}
                onValueChange={(value) => setCityFilter(value === ALL_CITIES_VALUE ? '' : value)}
              >
                <SelectTrigger id="shelter-city" size="sm" className="w-full rounded-xl bg-card/70">
                  <SelectValue placeholder={s.cityPlaceholder} />
                </SelectTrigger>
                <SelectContent className="w-[var(--radix-select-trigger-width)]">
                  <div className="sticky top-0 z-10 border-b border-border bg-popover p-2">
                    <div className="flex items-center gap-2 rounded-xl border border-border bg-landing-muted/50 px-2.5">
                      <Search className="size-4 text-muted-foreground" aria-hidden />
                      <input
                        value={citySearch}
                        onChange={(e) => setCitySearch(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                        placeholder={s.cityPlaceholder}
                        className="h-8 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>
                  <SelectItem value={ALL_CITIES_VALUE}>{t.common.all}</SelectItem>
                  {filteredCityOptions.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                  {filteredCityOptions.length === 0 ? (
                    <p className="px-2 py-2 text-sm text-muted-foreground">{s.citySearchEmpty}</p>
                  ) : null}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full space-y-1.5">
              <label htmlFor="shelter-kind-filter" className={surfaceFieldLabel}>
                {s.kindFilterLabel}
              </label>
              <Select
                value={kindFilter || ALL_KINDS_VALUE}
                onValueChange={(value) => setKindFilter(value === ALL_KINDS_VALUE ? '' : value)}
              >
                <SelectTrigger id="shelter-kind-filter" size="sm" className="w-full rounded-xl bg-card/70">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="w-[var(--radix-select-trigger-width)]">
                  <SelectItem value={ALL_KINDS_VALUE}>{t.common.all}</SelectItem>
                  <SelectItem value="shelter">{s.kindShelter}</SelectItem>
                  <SelectItem value="foster">{s.kindFoster}</SelectItem>
                  <SelectItem value="other">{s.kindOther}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full space-y-1.5">
              <label htmlFor="shelter-focus-filter" className={surfaceFieldLabel}>
                {s.detailAnimalFocus}
              </label>
              <Select
                value={focusFilter || ALL_FOCUS_VALUE}
                onValueChange={(value) => setFocusFilter(value === ALL_FOCUS_VALUE ? '' : value)}
              >
                <SelectTrigger id="shelter-focus-filter" size="sm" className="w-full rounded-xl bg-card/70">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="w-[var(--radix-select-trigger-width)]">
                  <SelectItem value={ALL_FOCUS_VALUE}>{t.common.all}</SelectItem>
                  <SelectItem value="dogs">{s.animalFocusDogs}</SelectItem>
                  <SelectItem value="cats">{s.animalFocusCats}</SelectItem>
                  <SelectItem value="mixed">{s.animalFocusMixed}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        ) : (
          <>
            <div className="w-full space-y-1.5">
              <label className={surfaceFieldLabel}>{s.cityLabel}</label>
              <Select
                value={petCityFilter || ALL_CITIES_VALUE}
                onValueChange={(v) => setPetCityFilter(v === ALL_CITIES_VALUE ? '' : v)}
              >
                <SelectTrigger size="sm" className="w-full rounded-xl bg-card/70">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="w-[var(--radix-select-trigger-width)]">
                  <SelectItem value={ALL_CITIES_VALUE}>{t.common.all}</SelectItem>
                  {petCities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full space-y-1.5">
              <label className={surfaceFieldLabel}>{t.filters.type}</label>
              <Select
                value={petAnimalFilter}
                onValueChange={(v) => setPetAnimalFilter(v as typeof petAnimalFilter)}
              >
                <SelectTrigger size="sm" className="w-full rounded-xl bg-card/70">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="w-[var(--radix-select-trigger-width)]">
                  <SelectItem value="all">{t.common.all}</SelectItem>
                  <SelectItem value="cat">{t.pet.animalType.cat}</SelectItem>
                  <SelectItem value="dog">{t.pet.animalType.dog}</SelectItem>
                  <SelectItem value="other">{t.pet.animalType.other}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
