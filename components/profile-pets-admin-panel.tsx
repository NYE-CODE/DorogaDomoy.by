import { useState } from 'react';
import {
  Trash2,
  ExternalLink,
  Eye,
  X,
  Search,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import type { ProfilePetResponse } from '../api/client';
import { API_BASE } from '../api/client';
import { useI18n } from '../context/I18nContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { adm } from './admin-panel-chrome';
import { AdminTablePagination } from './admin-table-pagination';

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
  const { t } = useI18n();
  const ap = t.adminPanel;
  const pg = ap.pagination;
  const [speciesFilter, setSpeciesFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [viewingPet, setViewingPet] = useState<ProfilePetResponse | null>(null);
  const [sortByCreated, setSortByCreated] = useState(false);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const perPage = 15;

  const sortThBtn =
    'w-full px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400 inline-flex items-center gap-1 hover:bg-muted/50 dark:hover:bg-muted/30 transition-colors';

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

  const sorted = [...filtered];
  if (sortByCreated) {
    sorted.sort((a, b) => {
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      return sortDir === 'asc' ? ta - tb : tb - ta;
    });
  }

  const totalPages = Math.ceil(sorted.length / perPage);
  const paginated = sorted.slice((page - 1) * perPage, page * perPage);

  const toggleCreatedSort = () => {
    setPage(1);
    if (sortByCreated) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortByCreated(true);
      setSortDir('desc');
    }
  };

  const createdSortIcon = () => {
    if (!sortByCreated) {
      return <ArrowUpDown className="w-3.5 h-3.5 shrink-0 opacity-45" aria-hidden />;
    }
    return sortDir === 'asc' ? (
      <ChevronUp className="w-3.5 h-3.5 shrink-0" aria-hidden />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 shrink-0" aria-hidden />
    );
  };

  return (
    <div className={adm.page}>
      <div className={adm.headerRow}>
        <div className={adm.headerText}>
          <h2 className={adm.title}>Профили питомцев</h2>
        </div>
      </div>

      {/* Filters */}
      <div className={adm.filtersCard}>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[250px]">
            <label className={adm.labelFilter}>Поиск</label>
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
            <label className={adm.labelFilter}>Вид животного</label>
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
            Найдено: {sorted.length} профилей
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={adm.tableShell}>
        <div className={adm.tableWrap}>
        <table className={`${adm.table} min-w-[800px]`}>
          <thead className={adm.thead}>
            <tr>
              <th className={adm.th}>Фото</th>
              <th className={adm.th}>Питомец</th>
              <th className={adm.th}>Вид / Порода</th>
              <th className={adm.th}>Владелец</th>
              <th className={adm.th}>Чип</th>
              <th className={`${adm.th} p-0`}>
                <button
                  type="button"
                  className={sortThBtn}
                  title="Сортировать по дате создания"
                  onClick={toggleCreatedSort}
                >
                  Создан
                  {createdSortIcon()}
                </button>
              </th>
              <th className={adm.th}>Действия</th>
            </tr>
          </thead>
          <tbody className={adm.tbody}>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={7} className={adm.tdEmpty}>
                  Профили питомцев не найдены
                </td>
              </tr>
            ) : (
              paginated.map(pet => (
                <tr key={pet.id} className={adm.tr}>
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
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <AdminTablePagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          labels={pg}
          summary={
            <>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {ap.users.pageOf(page, totalPages)}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {ap.users.totalShort(sorted.length)}
              </span>
            </>
          }
        />
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
