import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  ExternalLink,
  Eye,
  X,
  Search,
} from 'lucide-react';
import type { ProfilePetResponse } from '../api/client';
import { API_BASE } from '../api/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface ProfilePetsAdminPanelProps {
  profilePets: ProfilePetResponse[];
  onDeleteProfilePet: (id: string) => void;
}

const speciesLabels: Record<string, string> = {
  dog: 'Собака',
  cat: 'Кот/Кошка',
  other: 'Другое',
};

const genderLabels: Record<string, string> = {
  male: 'Мальчик',
  female: 'Девочка',
};

const PLACEHOLDER_PHOTO =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">' +
      '<rect width="96" height="96" fill="#f3f4f6"/>' +
      '<path d="M24 63l12-14 15 17 10-9 11 13H24z" fill="#d1d5db"/>' +
      '<circle cx="39" cy="33" r="8" fill="#d1d5db"/>' +
    '</svg>'
  );

function resolvePhoto(url: string): string {
  if (!url || url.startsWith('http') || url.startsWith('data:')) return url;
  return `${API_BASE}${url}`;
}

export function ProfilePetsAdminPanel({ profilePets, onDeleteProfilePet }: ProfilePetsAdminPanelProps) {
  const [speciesFilter, setSpeciesFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [viewingPet, setViewingPet] = useState<ProfilePetResponse | null>(null);
  const perPage = 15;

  const filtered = profilePets
    .filter(p => {
      if (speciesFilter !== 'all') return p.species === speciesFilter;
      return true;
    })
    .filter(p => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.breed ?? '').toLowerCase().includes(q) ||
        (p.owner_name ?? '').toLowerCase().includes(q) ||
        (p.chip_number ?? '').toLowerCase().includes(q)
      );
    });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Профили питомцев</h2>

      {/* Filters */}
      <div className="bg-card border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[250px]">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Поиск</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Имя, порода, владелец, чип..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div className="min-w-[180px]">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Вид животного</label>
            <Select value={speciesFilter} onValueChange={(v) => { setSpeciesFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Все виды" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все виды</SelectItem>
                <SelectItem value="dog">Собаки</SelectItem>
                <SelectItem value="cat">Коты</SelectItem>
                <SelectItem value="other">Другие</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400 ml-auto">
            Найдено: {filtered.length} профилей
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-gray-200 dark:border-gray-700 rounded-lg overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-muted dark:bg-accent border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Фото</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Питомец</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Вид / Порода</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Владелец</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Чип</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Создан</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  Профили питомцев не найдены
                </td>
              </tr>
            ) : (
              paginated.map(pet => (
                <tr key={pet.id} className="hover:bg-accent dark:hover:bg-accent">
                  <td className="px-4 py-3">
                    <img
                      src={pet.photos[0] ? resolvePhoto(pet.photos[0]) : PLACEHOLDER_PHOTO}
                      alt=""
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{pet.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {genderLabels[pet.gender] || pet.gender}{pet.age ? ` · ${pet.age}` : ''}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-900 dark:text-white">{speciesLabels[pet.species] || pet.species}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{pet.breed || '—'}</p>
                  </td>
                  <td className="px-4 py-3">
                    {pet.owner_name ? (
                      <a
                        href={`/user/${pet.owner_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:text-primary/90 hover:underline"
                      >
                        {pet.owner_name}
                      </a>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                    {pet.owner_email && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[140px]">{pet.owner_email}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {pet.is_chipped ? (
                      <span className="inline-flex px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                        {pet.chip_number || 'Да'}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500">Нет</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(pet.created_at).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setViewingPet(pet)}
                        className="p-1.5 text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded transition-colors"
                        title="Подробнее"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <a
                        href={`/pet-profile/${pet.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-accent dark:hover:bg-accent rounded transition-colors"
                        title="Открыть публичный профиль"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => {
                          if (window.confirm(`Удалить профиль питомца "${pet.name}"? Это действие необратимо.`)) {
                            onDeleteProfilePet(pet.id);
                          }
                        }}
                        className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="flex items-center gap-2 px-4 py-3 text-sm bg-card border border-gray-200 dark:border-gray-700 dark:text-gray-300 rounded-lg hover:bg-accent dark:hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Назад
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Страница {page} из {totalPages}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({filtered.length} всего)
            </span>
          </div>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="flex items-center gap-2 px-4 py-3 text-sm bg-card border border-gray-200 dark:border-gray-700 dark:text-gray-300 rounded-lg hover:bg-accent dark:hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Вперед
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {viewingPet && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4" onClick={() => setViewingPet(null)}>
          <div className="bg-card rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700 sticky top-0 bg-card z-10">
              <h3 className="font-semibold text-gray-900 dark:text-white">Профиль питомца</h3>
              <button onClick={() => setViewingPet(null)} className="p-1 hover:bg-accent dark:hover:bg-accent rounded">
                <X className="w-5 h-5 dark:text-gray-400" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              {/* Photos */}
              {viewingPet.photos.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {viewingPet.photos.map((photo, i) => (
                    <img
                      key={i}
                      src={resolvePhoto(photo)}
                      alt=""
                      className="w-24 h-24 object-cover rounded-lg shrink-0"
                    />
                  ))}
                </div>
              )}

              {/* Main info */}
              <div className="grid grid-cols-2 gap-3">
                <InfoField label="Имя" value={viewingPet.name} />
                <InfoField label="Вид" value={speciesLabels[viewingPet.species] || viewingPet.species} />
                <InfoField label="Порода" value={viewingPet.breed} />
                <InfoField label="Пол" value={genderLabels[viewingPet.gender] || viewingPet.gender} />
                <InfoField label="Возраст" value={viewingPet.age} />
                <InfoField label="Окрас" value={viewingPet.colors.length > 0 ? viewingPet.colors.join(', ') : null} />
                <InfoField label="Характер" value={viewingPet.temperament} />
                <InfoField label="Откликается на имя" value={viewingPet.responds_to_name ? 'Да' : 'Нет'} />
              </div>

              {/* Chip */}
              {viewingPet.is_chipped && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm font-medium text-green-800 dark:text-green-300">Чипирован</p>
                  {viewingPet.chip_number && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">Номер: {viewingPet.chip_number}</p>
                  )}
                </div>
              )}

              {/* Extra info */}
              {viewingPet.special_marks && (
                <InfoBlock label="Особые приметы" value={viewingPet.special_marks} />
              )}
              {viewingPet.medical_info && (
                <InfoBlock label="Медицинская информация" value={viewingPet.medical_info} />
              )}
              {viewingPet.favorite_treats && (
                <InfoBlock label="Любимые лакомства" value={viewingPet.favorite_treats} />
              )}
              {viewingPet.favorite_walks && (
                <InfoBlock label="Любимые места прогулок" value={viewingPet.favorite_walks} />
              )}

              {/* Owner */}
              <div className="border-t dark:border-gray-700 pt-4">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">Владелец</p>
                <div className="grid grid-cols-2 gap-3">
                  <InfoField label="Имя" value={viewingPet.owner_name} />
                  <InfoField label="Email" value={viewingPet.owner_email} />
                  <InfoField label="Телефон" value={viewingPet.owner_phone} />
                  <InfoField label="Viber" value={viewingPet.owner_viber} />
                </div>
              </div>

              {/* Dates */}
              <div className="border-t dark:border-gray-700 pt-4">
                <div className="grid grid-cols-2 gap-3">
                  <InfoField label="Создан" value={new Date(viewingPet.created_at).toLocaleString('ru-RU')} />
                  <InfoField label="Обновлён" value={new Date(viewingPet.updated_at).toLocaleString('ru-RU')} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm text-gray-900 dark:text-white">{value || '—'}</p>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-sm text-gray-700 dark:text-gray-300 bg-accent dark:bg-accent p-3 rounded-lg">{value}</p>
    </div>
  );
}
