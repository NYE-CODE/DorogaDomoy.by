import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Pet } from '../types/pet';
import { formatDate, statusLabels } from '../utils/pet-helpers';

interface PetsAdminPanelProps {
  pets: Pet[];
  onDeletePet: (petId: string) => void;
}

export function PetsAdminPanel({ pets, onDeletePet }: PetsAdminPanelProps) {
  type PetsFilterType = 'all' | 'active' | 'archived';
  const [petsFilter, setPetsFilter] = useState<PetsFilterType>('all');
  const [petsAnimalType, setPetsAnimalType] = useState<string>('all');
  const [petsStatus, setPetsStatus] = useState<string>('all');
  const [petsDateFilter, setPetsDateFilter] = useState<string>('all');
  const [petsPage, setPetsPage] = useState(1);
  const petsPerPage = 15;

  // Filter pets
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
      <h2 className="text-2xl font-semibold text-gray-900">Управление объявлениями</h2>
      
      {/* Filters Panel */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Статус архивации</label>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setPetsFilter('all');
                  setPetsPage(1);
                }}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  petsFilter === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Все ({pets.length})
              </button>
              <button
                onClick={() => {
                  setPetsFilter('active');
                  setPetsPage(1);
                }}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  petsFilter === 'active' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Активные ({pets.filter(p => !p.isArchived).length})
              </button>
              <button
                onClick={() => {
                  setPetsFilter('archived');
                  setPetsPage(1);
                }}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  petsFilter === 'archived' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Архив ({pets.filter(p => p.isArchived).length})
              </button>
            </div>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-700 mb-1">Тип животного</label>
            <select
              value={petsAnimalType}
              onChange={(e) => {
                setPetsAnimalType(e.target.value);
                setPetsPage(1);
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Все животные</option>
              <option value="cat">Коты</option>
              <option value="dog">Собаки</option>
              <option value="other">Другие</option>
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-700 mb-1">Статус объявления</label>
            <select
              value={petsStatus}
              onChange={(e) => {
                setPetsStatus(e.target.value);
                setPetsPage(1);
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Все статусы</option>
              <option value="searching">Ищут</option>
              <option value="found">Найден</option>
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-700 mb-1">Дата публикации</label>
            <select
              value={petsDateFilter}
              onChange={(e) => {
                setPetsDateFilter(e.target.value);
                setPetsPage(1);
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Все даты</option>
              <option value="last7">За последние 7 дней</option>
              <option value="last30">За последние 30 дней</option>
            </select>
          </div>

          <div className="text-sm text-gray-600 ml-auto">
            Найдено: {filteredPets.length} объявлений
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Фото</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Информация</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Автор</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedPets.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  Объявления не найдены
                </td>
              </tr>
            ) : (
              paginatedPets.map(pet => (
                <tr key={pet.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <img src={pet.photos[0]} alt="" className="w-16 h-16 object-cover rounded-lg" />
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{pet.breed || 'Без породы'}</p>
                    <p className="text-sm text-gray-600">{pet.city}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">{pet.authorName}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                      {statusLabels[pet.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDate(pet.publishedAt)}
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => onDeletePet(pet.id)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPetsPage(Math.max(1, petsPage - 1))}
            disabled={petsPage === 1}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Назад
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Страница {petsPage} из {totalPages}
            </span>
            <span className="text-xs text-gray-500">
              ({filteredPets.length} всего)
            </span>
          </div>
          <button
            onClick={() => setPetsPage(Math.min(totalPages, petsPage + 1))}
            disabled={petsPage >= totalPages}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Вперед
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
