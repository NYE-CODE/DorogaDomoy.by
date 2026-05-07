import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Building2, CircleDollarSign, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Footer } from '../components/layout/Footer';
import { Header } from '../components/layout/Header';
import { Button } from '../components/ui/button';
import { PageLoader } from '../components/ui/page-loader';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { useI18n } from '../context/I18nContext';
import { campaignsApi, shelterPetsApi, sheltersApi, type ShelterResponse } from '../api/client';
import type { Pet } from '../types/pet';
import { BackQuickMenu } from '../components/navigation/BackQuickMenu';
import { formatCalendarDate } from '../utils/pet-helpers';

type ActiveCampaignMeta = {
  hasActive: boolean;
  collectedAmount: number;
  goalAmount: number;
  updatedAt: string | null;
};

export default function MyShelterPetsListPage() {
  const { t } = useI18n();
  const tp = t.myShelterPetsList;
  const { shelterId } = useParams<{ shelterId: string }>();
  const navigate = useNavigate();
  const [myShelters, setMyShelters] = useState<ShelterResponse[]>([]);
  const [selectedShelterId, setSelectedShelterId] = useState<string>(shelterId ?? '');
  const [pets, setPets] = useState<Pet[]>([]);
  const [loadingShelters, setLoadingShelters] = useState(true);
  const [loadingPets, setLoadingPets] = useState(false);
  const [campaignsByPet, setCampaignsByPet] = useState<Record<string, ActiveCampaignMeta>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | NonNullable<Pet['adoptionStatus']>>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 12;

  const selectedShelter = useMemo(
    () => myShelters.find((s) => s.id === selectedShelterId) ?? null,
    [myShelters, selectedShelterId],
  );

  useEffect(() => {
    setLoadingShelters(true);
    sheltersApi
      .mine()
      .then((rows) => {
        setMyShelters(rows);
        if (!selectedShelterId && rows.length > 0) setSelectedShelterId(rows[0].id);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : t.common.error))
      .finally(() => setLoadingShelters(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedShelterId) return;
    setLoadingPets(true);
    sheltersApi
      .listPets(selectedShelterId, { is_archived: false, limit: 300 })
      .then(setPets)
      .catch((e) => toast.error(e instanceof Error ? e.message : t.common.error))
      .finally(() => setLoadingPets(false));
  }, [selectedShelterId, t.common.error]);

  useEffect(() => {
    if (!selectedShelterId || pets.length === 0) {
      setCampaignsByPet({});
      return;
    }
    let alive = true;
    Promise.all(
      pets.map(async (pet) => {
        try {
          const rows = await campaignsApi.listByPet(pet.id);
          const active = rows.find((row) => row.status === 'active') ?? null;
          return [pet.id, {
            hasActive: Boolean(active),
            collectedAmount: active?.collected_amount ?? 0,
            goalAmount: active?.goal_amount ?? 0,
            updatedAt: active?.updated_at ?? null,
          }] as const;
        } catch {
          return [pet.id, {
            hasActive: false,
            collectedAmount: 0,
            goalAmount: 0,
            updatedAt: null,
          }] as const;
        }
      }),
    ).then((pairs) => {
      if (!alive) return;
      setCampaignsByPet(Object.fromEntries(pairs));
    });
    return () => {
      alive = false;
    };
  }, [pets, selectedShelterId]);

  const onArchive = async (pet: Pet) => {
    if (!confirm(tp.archiveConfirm.replace('{name}', (pet.name || pet.breed || pet.animalType).slice(0, 40)))) return;
    try {
      await shelterPetsApi.archive(pet.id, 'archived from shelter cabinet');
      setPets((prev) => prev.filter((x) => x.id !== pet.id));
      toast.success(tp.archiveSuccess);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t.common.error);
    }
  };

  const filteredPets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return pets.filter((pet) => {
      if (statusFilter !== 'all' && (pet.adoptionStatus ?? 'available') !== statusFilter) return false;
      if (!q) return true;
      const hay = `${pet.name ?? ''} ${pet.breed ?? ''} ${pet.description ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [pets, searchQuery, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredPets.length / PAGE_SIZE));
  const pagedPets = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredPets.slice(start, start + PAGE_SIZE);
  }, [filteredPets, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, selectedShelterId]);

  useEffect(() => {
    if (currentPage > pageCount) setCurrentPage(pageCount);
  }, [currentPage, pageCount]);

  const adoptionStatusLabel = (status?: Pet['adoptionStatus']) => {
    switch (status ?? 'available') {
      case 'reserved':
        return tp.statusReserved;
      case 'adopted':
        return tp.statusAdopted;
      case 'on_treatment':
        return tp.statusTreatment;
      case 'not_for_adoption':
        return tp.statusNotForAdoption;
      case 'available':
      default:
        return tp.statusAvailable;
    }
  };

  const renderActionsMenu = (pet: Pet) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex size-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={tp.colActions}
        >
          <MoreHorizontal className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => navigate(`/my-shelters/${selectedShelterId}/pets/${pet.id}/campaign`)}>
          <CircleDollarSign className="mr-2 size-4" />
          Сбор
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate(`/my-shelters/${selectedShelterId}/pets/${pet.id}/edit`)}>
          <Pencil className="mr-2 size-4" />
          {tp.editShort}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void onArchive(pet)}>
          <Trash2 className="mr-2 size-4" />
          {tp.archiveShort}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (loadingShelters) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header showCitySelector />
        <main className="flex-1 py-10">
          <PageLoader />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header showCitySelector />
      <main className="flex-1 py-6 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center gap-3">
            <BackQuickMenu />
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
            <Building2 className="size-5 text-primary" />
            <h1 className="text-xl font-bold text-foreground">{tp.title}</h1>
            <select
              className="ml-auto rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={selectedShelterId}
              onChange={(e) => setSelectedShelterId(e.target.value)}
            >
              {myShelters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              onClick={() => selectedShelter && navigate(`/my-shelters/${selectedShelter.id}/pets/new`)}
              disabled={!selectedShelter}
            >
              <Plus className="mr-1 size-4" />
              {tp.newPet}
            </Button>
          </div>

          <div className="mb-4 grid gap-3 rounded-2xl border border-border bg-card p-4 lg:grid-cols-[1fr_200px]">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={tp.searchPlaceholder}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="all">{tp.allStatuses}</option>
              <option value="available">{tp.statusAvailable}</option>
              <option value="reserved">{tp.statusReserved}</option>
              <option value="adopted">{tp.statusAdopted}</option>
              <option value="on_treatment">{tp.statusTreatment}</option>
              <option value="not_for_adoption">{tp.statusNotForAdoption}</option>
            </select>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-lg font-semibold">{tp.listTitle}</h2>
              <span className="text-sm text-muted-foreground">
                {tp.totalLabel.replace('{n}', String(filteredPets.length))}
              </span>
            </div>
            {loadingPets ? (
              <div className="p-6">
                <PageLoader />
              </div>
            ) : filteredPets.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">{tp.emptyFiltered}</p>
            ) : (
              <>
                <div className="hidden grid-cols-[64px_minmax(180px,2fr)_minmax(130px,1fr)_120px_150px_170px_120px_56px] gap-4 border-b border-border bg-muted/40 px-4 py-3 text-xs font-semibold text-muted-foreground lg:grid">
                  <span>{tp.colImage}</span>
                  <span>Питомец</span>
                  <span className="text-center">{tp.colStatus}</span>
                  <span className="text-center">Активный сбор</span>
                  <span className="text-center">Собрано / Цель</span>
                  <span className="text-center">Последнее обновление</span>
                  <span className="text-center">{tp.colPublication}</span>
                  <span className="text-center">{tp.colActions}</span>
                </div>
                <ul className="divide-y divide-border">
                  {pagedPets.map((pet) => (
                    <li key={pet.id} className="px-4 py-4">
                      <div className="hidden items-center gap-4 lg:grid lg:grid-cols-[64px_minmax(180px,2fr)_minmax(130px,1fr)_120px_150px_170px_120px_56px]">
                        <div className="flex items-center justify-center">
                          {pet.photos?.[0] ? (
                            <img
                              src={pet.photos[0]}
                              alt=""
                              className="size-12 rounded-lg border border-border object-cover"
                            />
                          ) : (
                            <div className="size-12 rounded-lg border border-border bg-muted" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{pet.name?.trim() || pet.breed || pet.animalType}</p>
                          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{pet.description}</p>
                        </div>
                        <span className="text-center text-sm text-muted-foreground">{adoptionStatusLabel(pet.adoptionStatus)}</span>
                        <span className="text-center text-sm text-muted-foreground">
                          {campaignsByPet[pet.id]?.hasActive ? 'Есть' : 'Нет'}
                        </span>
                        <span className="text-center text-sm text-muted-foreground">
                          {campaignsByPet[pet.id]?.hasActive
                            ? `${campaignsByPet[pet.id].collectedAmount} / ${campaignsByPet[pet.id].goalAmount}`
                            : '—'}
                        </span>
                        <span className="text-center text-sm text-muted-foreground">
                          {campaignsByPet[pet.id]?.hasActive && campaignsByPet[pet.id].updatedAt
                            ? formatCalendarDate(new Date(campaignsByPet[pet.id].updatedAt as string))
                            : '—'}
                        </span>
                        <span className="text-center text-sm text-muted-foreground">{pet.isPublished ? tp.published : tp.hidden}</span>
                        <div className="flex justify-center">{renderActionsMenu(pet)}</div>
                      </div>

                      <div className="space-y-3 lg:hidden">
                        <div className="flex items-start gap-3">
                          {pet.photos?.[0] ? (
                            <img
                              src={pet.photos[0]}
                              alt=""
                              className="size-14 shrink-0 rounded-lg border border-border object-cover"
                            />
                          ) : (
                            <div className="size-14 shrink-0 rounded-lg border border-border bg-muted" />
                          )}
                          <div className="min-w-0">
                          <p className="font-medium text-foreground">{pet.name?.trim() || pet.breed || pet.animalType}</p>
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{pet.description}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {adoptionStatusLabel(pet.adoptionStatus)} · {pet.isPublished ? tp.published : tp.hidden}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Активный сбор: {campaignsByPet[pet.id]?.hasActive ? 'Есть' : 'Нет'}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Собрано / Цель: {campaignsByPet[pet.id]?.hasActive ? `${campaignsByPet[pet.id].collectedAmount} / ${campaignsByPet[pet.id].goalAmount}` : '—'}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Последнее обновление: {(campaignsByPet[pet.id]?.hasActive && campaignsByPet[pet.id].updatedAt)
                              ? formatCalendarDate(new Date(campaignsByPet[pet.id].updatedAt as string))
                              : '—'}
                          </p>
                          </div>
                        </div>
                        <div className="flex justify-end">{renderActionsMenu(pet)}</div>
                      </div>
                    </li>
                  ))}
                </ul>
                {filteredPets.length > PAGE_SIZE ? (
                  <div className="flex items-center justify-between border-t border-border px-4 py-3">
                    <p className="text-xs text-muted-foreground">
                      {currentPage} / {pageCount}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        {t.common.back}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(pageCount, p + 1))}
                        disabled={currentPage === pageCount}
                      >
                        {t.common.next}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
