import { useState } from 'react';
import {
  Home,
  Heart,
  Building2,
  Archive,
  ExternalLink,
  X,
  Trash2,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { Pet } from '../types/pet';
import { formatDate, petStatusSoftPillClass, statusLabels } from '../utils/pet-helpers';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { User } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { adm } from './admin-panel-chrome';
import { AdminTablePagination } from './admin-table-pagination';

interface PetsAdminPanelProps {
  pets: Pet[];
  users?: User[];
  onDeletePet: (petId: string) => void;
  onOpenPet?: (petId: string) => void;
}

function getArchiveReasonStyle(reason: string | undefined) {
  if (!reason) return { label: '—', className: 'text-gray-400 dark:text-gray-500' };
  if (reason.includes('вернулся домой') || reason.includes('найден хозяин'))
    return { label: reason, className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400', icon: Home };
  if (reason.includes('пристроен'))
    return { label: reason, className: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400', icon: Heart };
  if (reason.includes('приют'))
    return { label: reason, className: 'bg-muted text-muted-foreground', icon: Building2 };
  return { label: reason, className: 'bg-muted dark:bg-accent text-gray-700 dark:text-gray-300', icon: Archive };
}

function getRewardLabel(pet: Pet): string {
  if (pet.rewardMode === 'money') {
    return pet.rewardAmountByn ? `${pet.rewardAmountByn} BYN` : 'Деньги (не указано)';
  }
  return `${pet.rewardPoints ?? 0} очков`;
}

function comparePetsByReward(a: Pet, b: Pet, dir: 1 | -1): number {
  const ra = a.status === 'searching' ? 1 : 0;
  const rb = b.status === 'searching' ? 1 : 0;
  if (ra !== rb) return dir * (ra - rb);
  if (ra === 0) return 0;
  const modeA = a.rewardMode ?? 'points';
  const modeB = b.rewardMode ?? 'points';
  if (modeA !== modeB) return dir * modeA.localeCompare(modeB);
  const va = modeA === 'money' ? (a.rewardAmountByn ?? 0) : (a.rewardPoints ?? 0);
  const vb = modeB === 'money' ? (b.rewardAmountByn ?? 0) : (b.rewardPoints ?? 0);
  return dir * (va - vb);
}

export function PetsAdminPanel({ pets, users = [], onDeletePet, onOpenPet }: PetsAdminPanelProps) {
  const { t } = useI18n();
  const ap = t.adminPanel;
  const pg = ap.pagination;
  type PetsFilterType = 'all' | 'active' | 'archived';
  const [petsFilter, setPetsFilter] = useState<PetsFilterType>('all');
  const [petsAnimalType, setPetsAnimalType] = useState<string>('all');
  const [petsStatus, setPetsStatus] = useState<string>('all');
  const [petsModerationFilter, setPetsModerationFilter] = useState<string>('all');
  const [petsDateFilter, setPetsDateFilter] = useState<string>('all');
  const [petsPage, setPetsPage] = useState(1);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [petsSortBy, setPetsSortBy] = useState<'date' | 'reward' | null>(null);
  const [petsSortDir, setPetsSortDir] = useState<'asc' | 'desc'>('desc');
  const petsPerPage = 15;

  const petsSortThBtn =
    'w-full px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400 inline-flex items-center gap-1 hover:bg-muted/50 dark:hover:bg-muted/30 transition-colors';

  const filteredPets = pets.filter(pet => {
    if (petsFilter === 'active') return !pet.isArchived;
    if (petsFilter === 'archived') return pet.isArchived;
    return true;
  }).filter(pet => {
    if (petsAnimalType !== 'all') return pet.animalType === petsAnimalType;
    return true;
  }).filter(pet => {
    if (petsStatus !== 'all') return pet.status === petsStatus;
    return true;
  }).filter(pet => {
    if (petsModerationFilter !== 'all') return pet.moderationStatus === petsModerationFilter;
    return true;
  }).filter(pet => {
    if (petsDateFilter === 'last7') {
      const daysDiff = Math.floor((Date.now() - new Date(pet.publishedAt).getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 7;
    }
    if (petsDateFilter === 'last30') {
      const daysDiff = Math.floor((Date.now() - new Date(pet.publishedAt).getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 30;
    }
    return true;
  });

  const sortedPets = [...filteredPets];
  if (petsSortBy === 'date') {
    sortedPets.sort((a, b) => {
      const ta = a.publishedAt.getTime();
      const tb = b.publishedAt.getTime();
      return petsSortDir === 'asc' ? ta - tb : tb - ta;
    });
  } else if (petsSortBy === 'reward') {
    const dir = petsSortDir === 'asc' ? 1 : -1;
    sortedPets.sort((a, b) => comparePetsByReward(a, b, dir));
  }

  const totalPages = Math.ceil(sortedPets.length / petsPerPage);
  const paginatedPets = sortedPets.slice((petsPage - 1) * petsPerPage, petsPage * petsPerPage);

  const togglePetsSort = (column: 'date' | 'reward') => {
    setPetsPage(1);
    if (petsSortBy === column) {
      setPetsSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setPetsSortBy(column);
      setPetsSortDir('desc');
    }
  };

  const petsSortIcon = (column: 'date' | 'reward') => {
    if (petsSortBy !== column) {
      return <ArrowUpDown className="w-3.5 h-3.5 shrink-0 opacity-45" aria-hidden />;
    }
    return petsSortDir === 'asc' ? (
      <ChevronUp className="w-3.5 h-3.5 shrink-0" aria-hidden />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 shrink-0" aria-hidden />
    );
  };

  return (
    <div className={adm.page}>
      <div className={adm.headerRow}>
        <div className={adm.headerText}>
          <h2 className={adm.title}>Управление объявлениями</h2>
        </div>
      </div>

      {/* Filters Panel */}
      <div className={adm.filtersCard}>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="w-full sm:w-auto">
            <label className={adm.labelFilter}>Статус архивации</label>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => {
                  setPetsFilter('all');
                  setPetsPage(1);
                }}
                className={`px-3 py-2 text-sm rounded-lg transition-colors whitespace-nowrap ${
                  petsFilter === 'all' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted dark:bg-accent text-gray-700 dark:text-gray-300 hover:bg-accent dark:hover:bg-accent'
                }`}
              >
                Все ({pets.length})
              </button>
              <button
                onClick={() => {
                  setPetsFilter('active');
                  setPetsPage(1);
                }}
                className={`px-3 py-2 text-sm rounded-lg transition-colors whitespace-nowrap ${
                  petsFilter === 'active' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted dark:bg-accent text-gray-700 dark:text-gray-300 hover:bg-accent dark:hover:bg-accent'
                }`}
              >
                Активные ({pets.filter(p => !p.isArchived).length})
              </button>
              <button
                onClick={() => {
                  setPetsFilter('archived');
                  setPetsPage(1);
                }}
                className={`px-3 py-2 text-sm rounded-lg transition-colors whitespace-nowrap ${
                  petsFilter === 'archived' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted dark:bg-accent text-gray-700 dark:text-gray-300 hover:bg-accent dark:hover:bg-accent'
                }`}
              >
                Архив ({pets.filter(p => p.isArchived).length})
              </button>
            </div>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className={adm.labelFilter}>Тип животного</label>
            <Select value={petsAnimalType} onValueChange={(v) => { setPetsAnimalType(v); setPetsPage(1); }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Все животные" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все животные</SelectItem>
                <SelectItem value="cat">Коты</SelectItem>
                <SelectItem value="dog">Собаки</SelectItem>
                <SelectItem value="other">Другие</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className={adm.labelFilter}>Статус объявления</label>
            <Select value={petsStatus} onValueChange={(v) => { setPetsStatus(v); setPetsPage(1); }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Все статусы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="searching">Ищут</SelectItem>
                <SelectItem value="found">Найден</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className={adm.labelFilter}>Модерация</label>
            <Select value={petsModerationFilter} onValueChange={(v) => { setPetsModerationFilter(v); setPetsPage(1); }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Все" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                <SelectItem value="pending">На модерации</SelectItem>
                <SelectItem value="approved">Опубликовано</SelectItem>
                <SelectItem value="rejected">Отклонено</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className={adm.labelFilter}>Дата публикации</label>
            <Select value={petsDateFilter} onValueChange={(v) => { setPetsDateFilter(v); setPetsPage(1); }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Все даты" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все даты</SelectItem>
                <SelectItem value="last7">За последние 7 дней</SelectItem>
                <SelectItem value="last30">За последние 30 дней</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400 ml-auto">
            Найдено: {sortedPets.length} объявлений
          </div>
        </div>
      </div>

      <div className={adm.tableShell}>
        <div className={adm.tableWrap}>
        <table className={`${adm.table} min-w-[700px]`}>
          <thead className={adm.thead}>
            <tr>
              <th className={adm.th}>Фото</th>
              <th className={adm.th}>Информация</th>
              <th className={adm.th}>Автор</th>
              <th className={adm.th}>Статус</th>
              <th className={adm.th}>Модерация</th>
              <th className={`${adm.th} p-0`}>
                <button
                  type="button"
                  className={petsSortThBtn}
                  title="Сортировать по награде (сначала объявления «ищут дом»; деньги и очки отдельно)"
                  onClick={() => togglePetsSort('reward')}
                >
                  Награда
                  {petsSortIcon('reward')}
                </button>
              </th>
              <th className={adm.th}>Очки начислены</th>
              {petsFilter === 'archived' && (
                <th className={adm.th}>Причина</th>
              )}
              <th className={`${adm.th} p-0`}>
                <button
                  type="button"
                  className={petsSortThBtn}
                  title="Сортировать по дате публикации"
                  onClick={() => togglePetsSort('date')}
                >
                  Дата
                  {petsSortIcon('date')}
                </button>
              </th>
              <th className={adm.th}>Действия</th>
            </tr>
          </thead>
          <tbody className={adm.tbody}>
            {paginatedPets.length === 0 ? (
              <tr>
                <td colSpan={petsFilter === 'archived' ? 10 : 9} className={adm.tdEmpty}>
                  Объявления не найдены
                </td>
              </tr>
            ) : (
              paginatedPets.map(pet => (
                <tr key={pet.id} className={`${adm.tr} cursor-pointer`} onClick={() => setSelectedPet(pet)}>
                  <td className="px-4 py-3">
                    <img src={pet.photos[0]} alt="" className="w-16 h-16 object-cover rounded-lg" />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 dark:text-white">{pet.breed || 'Без породы'}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{pet.city}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-900 dark:text-white">{pet.authorName}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${petStatusSoftPillClass[pet.status]}`}
                    >
                      {statusLabels[pet.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      pet.moderationStatus === 'approved'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : pet.moderationStatus === 'rejected'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                    }`}>
                      {pet.moderationStatus === 'approved' ? 'Опубликовано' 
                        : pet.moderationStatus === 'rejected' ? 'Отклонено' 
                        : 'На модерации'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {pet.status === 'searching' ? (
                      <span className="inline-flex px-2 py-1 text-xs rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                        {getRewardLabel(pet)}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {pet.rewardPointsAwardedAt ? (
                      <span className="inline-flex px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                        {formatDate(pet.rewardPointsAwardedAt)}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500">Нет</span>
                    )}
                  </td>
                  {petsFilter === 'archived' && (() => {
                    const style = getArchiveReasonStyle(pet.archiveReason);
                    const Icon = 'icon' in style ? style.icon : null;
                    return (
                      <td className="px-4 py-3">
                        {pet.archiveReason ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${style.className}`}>
                            {Icon && <Icon className="w-3 h-3" />}
                            {style.label}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
                        )}
                      </td>
                    );
                  })()}
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(pet.publishedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        title="Открыть объявление"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenPet?.(pet.id);
                        }}
                        className="p-2 rounded-lg text-primary hover:bg-primary/10 dark:hover:bg-primary/20"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span className="sr-only">Открыть объявление</span>
                      </button>
                      <button
                        type="button"
                        title="Удалить объявление"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePet(pet.id);
                        }}
                        className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="sr-only">Удалить объявление</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {selectedPet && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4" onClick={() => setSelectedPet(null)}>
          <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700 sticky top-0 bg-card z-10">
              <h3 className="font-semibold text-gray-900 dark:text-white">Карточка объявления</h3>
              <button type="button" onClick={() => setSelectedPet(null)} className="p-1 hover:bg-accent rounded">
                <X className="w-5 h-5 dark:text-gray-400" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Питомец</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedPet.breed || 'Без породы'} ({selectedPet.city})</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Автор</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedPet.authorName}</p>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Информация о награде</h4>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="text-gray-500 dark:text-gray-400">Режим: </span>
                    {selectedPet.rewardMode === 'money' ? 'Деньги' : 'Очки'}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="text-gray-500 dark:text-gray-400">Сумма/очки: </span>
                    {getRewardLabel(selectedPet)}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="text-gray-500 dark:text-gray-400">Начисление: </span>
                    {selectedPet.rewardPointsAwardedAt ? formatDate(selectedPet.rewardPointsAwardedAt) : 'Пока не начислено'}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="text-gray-500 dark:text-gray-400">Получатель: </span>
                    {selectedPet.rewardRecipientUserId ? (
                      (() => {
                        const recipient = users.find((u) => u.id === selectedPet.rewardRecipientUserId);
                        return (
                          <a
                            href={`/user/${selectedPet.rewardRecipientUserId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {recipient?.name || selectedPet.rewardRecipientUserId}
                          </a>
                        );
                      })()
                    ) : 'Не назначен'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t dark:border-gray-700">
              <button
                type="button"
                title="Открыть объявление на сайте"
                onClick={() => onOpenPet?.(selectedPet.id)}
                className="p-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center"
              >
                <ExternalLink className="w-5 h-5" />
                <span className="sr-only">Открыть объявление на сайте</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <AdminTablePagination
          currentPage={petsPage}
          totalPages={totalPages}
          onPageChange={setPetsPage}
          labels={pg}
          summary={
            <>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {ap.users.pageOf(petsPage, totalPages)}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {ap.users.totalShort(sortedPets.length)}
              </span>
            </>
          }
        />
      )}
    </div>
  );
}
