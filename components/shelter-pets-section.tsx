import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { sheltersApi } from '../api/client';
import type { AnimalType, Pet, PetColor } from '../types/pet';
import type { Gender } from '../types/pet';
import { ShelterPetCard } from './shelter-pet-card';
import { Button } from './ui/button';
import { useI18n } from '../context/I18nContext';
import { appOutlineCtaClass, appPrimaryCtaClass } from '../styles/cta-classes';
import {
  countActiveShelterFilterFields,
  defaultShelterPetFilters,
  petMatchesShelterFilters,
  type ShelterPetAgeBand,
  type ShelterPetCoat,
  type ShelterPetFilterState,
  type ShelterPetHealth,
  type ShelterPetSponsor,
} from '../utils/shelter-pet-filters';
import { cn } from './ui/utils';

export const SHELTER_PETS_ANCHOR = 'shelter-pets';
const SHELTER_PETS_PAGE_SIZE = 60;

const PET_COLORS: PetColor[] = ['black', 'white', 'gray', 'brown', 'red', 'mixed', 'spotted', 'striped'];

export function ShelterPetsSection({ shelterId, initialPets }: { shelterId: string; initialPets?: Pet[] }) {
  const { t } = useI18n();
  const s = t.landing.shelters;
  const navigate = useNavigate();
  const listRef = useRef<HTMLUListElement>(null);

  const [pets, setPets] = useState<Pet[]>(() => initialPets ?? []);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [draft, setDraft] = useState<ShelterPetFilterState>(() => defaultShelterPetFilters());
  const [applied, setApplied] = useState<ShelterPetFilterState>(() => defaultShelterPetFilters());

  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(() => {
    if (!shelterId.trim()) return;
    if (initialPets) return;
    setLoading(true);
    setLoadError(false);
    sheltersApi
      .listPets(shelterId.trim(), {
        is_archived: false,
        limit: 300,
      })
      .then((rows) => setPets(rows))
      .catch(() => {
        setLoadError(true);
        setPets([]);
      })
      .finally(() => setLoading(false));
  }, [shelterId, initialPets]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!initialPets) return;
    setPets(initialPets);
    setLoadError(false);
    setLoading(false);
  }, [initialPets]);

  const filtered = useMemo(() => pets.filter((p) => petMatchesShelterFilters(p, applied)), [pets, applied]);

  const displayed = useMemo(() => {
    const start = (currentPage - 1) * SHELTER_PETS_PAGE_SIZE;
    return filtered.slice(start, start + SHELTER_PETS_PAGE_SIZE);
  }, [filtered, currentPage]);

  const pageCount = useMemo(() => {
    return Math.max(1, Math.ceil(filtered.length / SHELTER_PETS_PAGE_SIZE));
  }, [filtered.length]);

  const paginationItems = useMemo(() => {
    const maxVisible = 5;
    if (pageCount <= maxVisible) {
      return Array.from({ length: pageCount }, (_, i) => i + 1);
    }
    let start = Math.max(1, currentPage - 2);
    const end = Math.min(pageCount, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, pageCount]);

  const applyFilters = () => {
    setApplied({ ...draft });
    setCurrentPage(1);
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const clearFilters = () => {
    const d = defaultShelterPetFilters();
    setDraft(d);
    setApplied(d);
    setCurrentPage(1);
  };

  const draftActiveCount = useMemo(() => countActiveShelterFilterFields(draft), [draft]);

  const animalOptions: { value: AnimalType | 'all'; label: string }[] = [
    { value: 'all', label: t.common.all },
    { value: 'cat', label: t.pet.animalType.cat },
    { value: 'dog', label: t.pet.animalType.dog },
    { value: 'other', label: t.pet.animalType.other },
  ];

  const genderOpts: { value: ShelterPetFilterState['gender']; label: string }[] = [
    { value: 'all', label: t.common.all },
    { value: 'male', label: t.pet.gender.male },
    { value: 'female', label: t.pet.gender.female },
  ];

  const ageOpts: { value: ShelterPetAgeBand; label: string }[] = [
    { value: 'all', label: s.detailPetsAgeAll },
    { value: 'under5mo', label: s.detailPetsAgeUnder5mo },
    { value: 'm6to12', label: s.detailPetsAge6to12mo },
    { value: 'y1to5', label: s.detailPetsAge1to5y },
    { value: 'y6to10', label: s.detailPetsAge6to10y },
    { value: 'y10plus', label: s.detailPetsAge10plus },
  ];

  const healthOpts: { value: ShelterPetHealth; label: string }[] = [
    { value: 'all', label: s.detailPetsHealthAll },
    { value: 'disabled', label: s.detailPetsHealthDisabled },
    { value: 'treatment', label: s.detailPetsHealthTreatment },
    { value: 'good', label: s.detailPetsHealthGood },
    { value: 'excellent', label: s.detailPetsHealthExcellent },
  ];

  const colorOpts: { value: 'all' | PetColor; label: string }[] = [
    { value: 'all', label: t.common.all },
    ...PET_COLORS.map((c) => ({ value: c, label: t.pet.color[c] })),
  ];

  const coatOpts: { value: ShelterPetCoat; label: string }[] = [
    { value: 'all', label: s.detailPetsCoatAll },
    { value: 'smooth', label: s.detailPetsCoatSmooth },
    { value: 'semi', label: s.detailPetsCoatSemi },
    { value: 'fluffy', label: s.detailPetsCoatFluffy },
  ];

  const sponsorOpts: { value: ShelterPetSponsor; label: string }[] = [
    { value: 'all', label: s.detailPetsSponsorAll },
    { value: 'available', label: s.detailPetsSponsorAvailable },
    { value: 'taken', label: s.detailPetsSponsorTaken },
  ];

  useEffect(() => {
    setCurrentPage(1);
  }, [filtered.length]);

  return (
    <section
      id={SHELTER_PETS_ANCHOR}
      className="mt-6 scroll-mt-28 pt-0 sm:mt-7 sm:pt-0"
    >
      <div className="mx-auto w-full max-w-none sm:mx-0">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              {s.detailPetsTitle}{' '}
              <span className="text-muted-foreground">
                ({loading || loadError ? 0 : filtered.length})
              </span>
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/70 md:text-base"
          >
            <Filter className="size-4" aria-hidden />
            {showFilters ? 'Скрыть фильтры' : 'Показать фильтры'}
          </button>
        </div>

        {loadError ? (
          <p className="mt-6 text-sm text-destructive">{s.detailPetsLoadError}</p>
        ) : (
          <div className="mt-7 flex flex-col gap-6">
            {showFilters ? (
              <div
                className={cn(
                  'rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6',
                  loading && 'pointer-events-none opacity-60',
                )}
                aria-busy={loading}
              >
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">{t.filters.type}</label>
                  <select
                    value={draft.animalType}
                    onChange={(e) => setDraft((prev) => ({ ...prev, animalType: e.target.value as AnimalType | 'all' }))}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    {animalOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">{s.detailPetsGenderTitle}</label>
                  <select
                    value={draft.gender}
                    onChange={(e) => setDraft((prev) => ({ ...prev, gender: e.target.value as ShelterPetFilterState['gender'] }))}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    {genderOpts.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">{s.detailPetsAgeTitle}</label>
                  <select
                    value={draft.ageBand}
                    onChange={(e) => setDraft((prev) => ({ ...prev, ageBand: e.target.value as ShelterPetAgeBand }))}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    {ageOpts.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">{s.detailPetsHealthTitle}</label>
                  <select
                    value={draft.health}
                    onChange={(e) => setDraft((prev) => ({ ...prev, health: e.target.value as ShelterPetHealth }))}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    {healthOpts.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">{s.detailPetsColorTitle}</label>
                  <select
                    value={draft.color}
                    onChange={(e) => setDraft((prev) => ({ ...prev, color: e.target.value as 'all' | PetColor }))}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    {colorOpts.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">{s.detailPetsCoatTitle}</label>
                  <select
                    value={draft.coat}
                    onChange={(e) => setDraft((prev) => ({ ...prev, coat: e.target.value as ShelterPetCoat }))}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    {coatOpts.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">{s.detailPetsSponsorTitle}</label>
                  <select
                    value={draft.sponsor}
                    onChange={(e) => setDraft((prev) => ({ ...prev, sponsor: e.target.value as ShelterPetSponsor }))}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    {sponsorOpts.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">{s.detailPetsUrgentLabel}</label>
                  <select
                    value={draft.urgentOnly ? 'yes' : 'all'}
                    onChange={(e) => setDraft((prev) => ({ ...prev, urgentOnly: e.target.value === 'yes' }))}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="all">{t.common.all}</option>
                    <option value="yes">{s.detailPetsUrgentSos}</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-end">
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" className={appOutlineCtaClass} onClick={clearFilters}>
                    {s.detailPetsClear}
                  </Button>
                  <Button
                    type="button"
                    className={cn(appPrimaryCtaClass, 'uppercase tracking-wide')}
                    onClick={applyFilters}
                  >
                    {s.detailPetsShow}
                    {draftActiveCount > 0 ? (
                      <span className="ml-1.5 rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs font-semibold normal-case">
                        {draftActiveCount}
                      </span>
                    ) : null}
                  </Button>
                </div>
              </div>
              </div>
            ) : null}

            <div className="min-h-[24rem] lg:min-h-[30rem]">
              {loading ? (
                <div className="flex min-h-[24rem] items-center justify-center text-center text-sm text-muted-foreground lg:min-h-[30rem]">
                  {t.common.loading}
                </div>
              ) : pets.length === 0 ? (
                <p className="flex min-h-[24rem] items-center justify-center text-center text-sm text-muted-foreground lg:min-h-[30rem]">
                  {s.detailPetsEmptyAll}
                </p>
              ) : filtered.length === 0 ? (
                <p className="flex min-h-[24rem] items-center justify-center text-center text-sm text-muted-foreground lg:min-h-[30rem]">
                  {s.detailPetsEmptyFiltered}
                </p>
              ) : (
                <>
                  {displayed.length < filtered.length ? (
                    <p className="text-center text-xs text-muted-foreground">
                      {s.detailPetsCountFiltered
                        .replace('{n}', String(displayed.length))
                        .replace('{total}', String(filtered.length))}
                    </p>
                  ) : null}
                  <ul ref={listRef} className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
                    {displayed.map((pet) => (
                      <li key={pet.id} className="min-w-0">
                        <ShelterPetCard pet={pet} onClick={() => navigate(`/shelter-pet/${pet.id}`)} />
                      </li>
                    ))}
                  </ul>
                  {pageCount > 1 ? (
                    <div className="mt-8 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="inline-flex size-10 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <ChevronLeft className="size-5" aria-hidden />
                      </button>
                      {paginationItems.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setCurrentPage(p)}
                          className={cn(
                            'inline-flex size-10 items-center justify-center rounded-lg border transition-colors',
                            currentPage === p
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border text-muted-foreground hover:bg-muted',
                          )}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.min(pageCount, p + 1))}
                        disabled={currentPage === pageCount}
                        className="inline-flex size-10 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <ChevronRight className="size-5" aria-hidden />
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
