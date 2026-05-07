import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { useI18n } from '../context/I18nContext';
import { sheltersApi, type ShelterResponse } from '../api/client';
import type { Pet } from '../types/pet';
import { MapPin, Building2, ChevronRight, Search } from 'lucide-react';
import {
  shelterAnimalFocusLabel,
  shelterKindLabel,
  shelterLogoSrc,
} from '../utils/shelter-public';
import {
  applySeo,
  canonicalUrlFromPath,
  SEO_KEYWORDS,
  SEO_ROBOTS_PUBLIC,
  truncateMetaDescription,
} from '../utils/seo';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { ShelterPetCard } from '../components/shelter-pet-card';

export default function SheltersPage() {
  const navigate = useNavigate();
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
  const [petCityFilter, setPetCityFilter] = useState('');
  const [petAnimalFilter, setPetAnimalFilter] = useState<'all' | 'cat' | 'dog' | 'other'>('all');

  useEffect(() => {
    const desc = truncateMetaDescription(`${s.pageSubtitle} DorogaDomoy.by.`);
    applySeo({
      title: `${s.pageTitle} — DorogaDomoy.by`,
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

  const setTab = (tab: 'orgs' | 'pets') => {
    const next = new URLSearchParams(searchParams);
    if (tab === 'orgs') next.delete('tab');
    else next.set('tab', 'pets');
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    if (activeTab !== 'pets' || shelterPets.length > 0 || petsLoading) return;
    setPetsLoading(true);
    setPetsError(false);
    sheltersApi
      .list()
      .then(async (shelters) => {
        const buckets = await Promise.all(
          shelters.map(async (shelter) => {
            try {
              return await sheltersApi.listPets(shelter.id, {
                is_archived: false,
                limit: 200,
              });
            } catch {
              return [];
            }
          }),
        );
        const merged = buckets
          .flat()
          .filter((p) => (p.petScope ?? 'lost_found') === 'shelter_pet' && p.moderationStatus === 'approved');
        setShelterPets(merged);
      })
      .catch(() => {
        setShelterPets([]);
        setPetsError(true);
      })
      .finally(() => setPetsLoading(false));
  }, [activeTab, petsLoading, shelterPets.length]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header showCitySelector={false} />
      <main className="flex-1 py-6 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">{s.pageTitle}</h1>
          <p className="mt-2 text-muted-foreground text-lg">{s.pageSubtitle}</p>
        </header>

        <div className="mb-5 inline-flex rounded-lg border border-border bg-card p-1">
          <button
            type="button"
            onClick={() => setTab('orgs')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'orgs' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {s.tabOrganizations}
          </button>
          <button
            type="button"
            onClick={() => setTab('pets')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'pets' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {s.tabPets}
          </button>
        </div>

        {activeTab === 'orgs' ? (
        <>
        <div className="mb-8 rounded-2xl border border-border bg-muted/20 p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="w-full">
            <label htmlFor="shelter-city" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
              <SelectTrigger id="shelter-city" size="sm" className="w-full">
                <SelectValue placeholder={s.cityPlaceholder} />
              </SelectTrigger>
              <SelectContent className="w-[var(--radix-select-trigger-width)]">
                <div className="sticky top-0 z-10 border-b border-border bg-popover p-2">
                  <div className="flex items-center gap-2 rounded-md border border-border bg-input-background px-2.5">
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
                  <p className="px-2 py-2 text-sm text-muted-foreground">Ничего не найдено</p>
                ) : null}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full">
            <label htmlFor="shelter-kind-filter" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {s.kindFilterLabel}
            </label>
            <Select
              value={kindFilter || ALL_KINDS_VALUE}
              onValueChange={(value) => setKindFilter(value === ALL_KINDS_VALUE ? '' : value)}
            >
              <SelectTrigger id="shelter-kind-filter" size="sm" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="w-[var(--radix-select-trigger-width)]">
                <SelectItem value={ALL_KINDS_VALUE}>{t.common.all}</SelectItem>
                <SelectItem value="shelter">{s.kindShelter}</SelectItem>
                <SelectItem value="foster">{s.kindFoster}</SelectItem>
                <SelectItem value="vet">{s.kindVet}</SelectItem>
                <SelectItem value="other">{s.kindOther}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full">
            <label htmlFor="shelter-focus-filter" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {s.detailAnimalFocus}
            </label>
            <Select
              value={focusFilter || ALL_FOCUS_VALUE}
              onValueChange={(value) => setFocusFilter(value === ALL_FOCUS_VALUE ? '' : value)}
            >
              <SelectTrigger id="shelter-focus-filter" size="sm" className="w-full">
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
          </div>
        </div>
        </>
        ) : (
          <div className="mb-8 rounded-2xl border border-border bg-muted/20 p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="w-full">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {s.cityLabel}
                </label>
                <Select value={petCityFilter || ALL_CITIES_VALUE} onValueChange={(v) => setPetCityFilter(v === ALL_CITIES_VALUE ? '' : v)}>
                  <SelectTrigger size="sm" className="w-full">
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
              <div className="w-full">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t.filters.type}
                </label>
                <Select value={petAnimalFilter} onValueChange={(v) => setPetAnimalFilter(v as typeof petAnimalFilter)}>
                  <SelectTrigger size="sm" className="w-full">
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
            </div>
          </div>
        )}

        {activeTab === 'orgs' ? (
          loading ? (
            <p className="text-muted-foreground">{t.common.loading}</p>
          ) : error ? (
            <p className="text-destructive">{s.loadError}</p>
          ) : list.length === 0 ? (
            <div className="rounded-xl border border-border bg-muted/30 p-6 space-y-2">
              <p className="text-foreground font-medium">{s.empty}</p>
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
                        className="group flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        <div className="relative flex aspect-[4/3] w-full shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
                          {logo ? (
                            <img src={logo} alt="" className="size-full object-cover object-center" />
                          ) : (
                            <Building2 className="size-16 text-muted-foreground opacity-35" aria-hidden />
                          )}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                          <span className="inline-flex max-w-full self-start truncate rounded-md bg-primary/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground shadow-sm">
                            {shelterKindLabel(row.kind, s)}
                          </span>
                          <h2 className="text-base font-semibold leading-snug text-foreground line-clamp-2 transition-colors group-hover:text-primary">
                            {row.name}
                          </h2>
                          <p className="text-xs text-muted-foreground">{shelterAnimalFocusLabel(row.animal_focus, s)}</p>
                          <p className="flex min-h-[2rem] items-start gap-1.5 text-sm text-muted-foreground">
                            <MapPin size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden />
                            <span className="line-clamp-2">{locationLine || '—'}</span>
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <div className="hidden overflow-x-auto rounded-xl border border-border bg-card shadow-sm sm:block">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-3 font-semibold">Организация</th>
                      <th className="px-4 py-3 font-semibold">Тип</th>
                      <th className="px-4 py-3 font-semibold">Город</th>
                      <th className="px-4 py-3 font-semibold">Фокус</th>
                      <th className="px-4 py-3 font-semibold text-right">Действие</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((row) => {
                      const logo = shelterLogoSrc(row.logo_url);
                      return (
                        <tr key={row.id} className="border-t border-border/70 text-foreground">
                          <td className="px-4 py-3">
                            <Link to={`/shelters/${row.id}`} className="group flex items-center gap-3">
                              <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
                                {logo ? (
                                  <img src={logo} alt="" className="size-full object-cover object-center" />
                                ) : (
                                  <Building2 className="size-6 text-muted-foreground opacity-50" aria-hidden />
                                )}
                              </div>
                              <span className="font-medium transition-colors group-hover:text-primary">{row.name}</span>
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{shelterKindLabel(row.kind, s)}</td>
                          <td className="px-4 py-3 text-muted-foreground">{row.city || '—'}</td>
                          <td className="px-4 py-3 text-muted-foreground">{shelterAnimalFocusLabel(row.animal_focus, s)}</td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              to={`/shelters/${row.id}`}
                              className="inline-flex items-center gap-1 font-medium text-primary transition-colors hover:text-primary/80"
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
            </>
          )
        ) : petsLoading ? (
          <p className="text-muted-foreground">{t.common.loading}</p>
        ) : petsError ? (
          <p className="text-destructive">{s.loadError}</p>
        ) : filteredPets.length === 0 ? (
          <div className="rounded-xl border border-border bg-muted/30 p-6">
            <p className="text-sm text-muted-foreground">{s.emptyPets}</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filteredPets.map((pet) => (
              <li key={pet.id} className="h-full">
                <ShelterPetCard pet={pet} onClick={() => navigate(`/shelter-pet/${pet.id}`)} />
              </li>
            ))}
          </ul>
        )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
