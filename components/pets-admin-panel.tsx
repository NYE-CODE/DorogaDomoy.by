import { useState } from 'react';
import { ChevronLeft, ChevronRight, Home, Heart, Building2, Archive, ExternalLink, X } from 'lucide-react';
import { Pet } from '../types/pet';
import { formatDate, petStatusSoftPillClass, statusLabels } from '../utils/pet-helpers';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { User } from '../context/AuthContext';

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

export function PetsAdminPanel({ pets, users = [], onDeletePet, onOpenPet }: PetsAdminPanelProps) {
  type PetsFilterType = 'all' | 'active' | 'archived';
  const [petsFilter, setPetsFilter] = useState<PetsFilterType>('all');
  const [petsAnimalType, setPetsAnimalType] = useState<string>('all');
  const [petsStatus, setPetsStatus] = useState<string>('all');
  const [petsModerationFilter, setPetsModerationFilter] = useState<string>('all');
  const [petsDateFilter, setPetsDateFilter] = useState<string>('all');
  const [petsPage, setPetsPage] = useState(1);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const petsPerPage = 15;

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

  const totalPages = Math.ceil(filteredPets.length / petsPerPage);
  const paginatedPets = filteredPets.slice((petsPage - 1) * petsPerPage, petsPage * petsPerPage);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Управление объявлениями</h2>
      
      {/* Filters Panel */}
      <div className="bg-card border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="w-full sm:w-auto">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Статус архивации</label>
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
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Тип животного</label>
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
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Статус объявления</label>
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
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Модерация</label>
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
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Дата публикации</label>
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
            Найдено: {filteredPets.length} объявлений
          </div>
        </div>
      </div>

      <div className="bg-card border border-gray-200 dark:border-gray-700 rounded-lg overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead className="bg-muted dark:bg-accent border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Фото</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Информация</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Автор</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Статус</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Модерация</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Награда</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Очки начислены</th>
              {petsFilter === 'archived' && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Причина</th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Дата</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedPets.length === 0 ? (
              <tr>
                <td colSpan={petsFilter === 'archived' ? 10 : 9} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  Объявления не найдены
                </td>
              </tr>
            ) : (
              paginatedPets.map(pet => (
                <tr key={pet.id} className="hover:bg-accent dark:hover:bg-accent cursor-pointer" onClick={() => setSelectedPet(pet)}>
                  <td className="px-6 py-4">
                    <img src={pet.photos[0]} alt="" className="w-16 h-16 object-cover rounded-lg" />
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 dark:text-white">{pet.breed || 'Без породы'}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{pet.city}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900 dark:text-white">{pet.authorName}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${petStatusSoftPillClass[pet.status]}`}
                    >
                      {statusLabels[pet.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
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
                      <td className="px-6 py-4">
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
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(pet.publishedAt)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenPet?.(pet.id);
                        }}
                        className="text-primary hover:text-primary/80 text-sm inline-flex items-center gap-1"
                      >
                        Открыть <ExternalLink className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeletePet(pet.id); }}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm"
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
                onClick={() => onOpenPet?.(selectedPet.id)}
                className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm inline-flex items-center gap-2"
              >
                Перейти к объявлению <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPetsPage(Math.max(1, petsPage - 1))}
            disabled={petsPage === 1}
            className="flex items-center gap-2 px-4 py-3 text-sm bg-card border border-gray-200 dark:border-gray-700 dark:text-gray-300 rounded-lg hover:bg-accent dark:hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Назад
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Страница {petsPage} из {totalPages}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({filteredPets.length} всего)
            </span>
          </div>
          <button
            onClick={() => setPetsPage(Math.min(totalPages, petsPage + 1))}
            disabled={petsPage >= totalPages}
            className="flex items-center gap-2 px-4 py-3 text-sm bg-card border border-gray-200 dark:border-gray-700 dark:text-gray-300 rounded-lg hover:bg-accent dark:hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Вперед
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
