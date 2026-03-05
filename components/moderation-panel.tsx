import { useState } from 'react';
import { CheckCircle2, XCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Pet } from '../types/pet';
import { formatDate, statusLabels, animalTypeLabels } from '../utils/pet-helpers';
import { useAuth } from '../context/AuthContext';

interface ModerationPanelProps {
  pets: Pet[];
  onApprovePet: (pet: Pet) => void;
  onRejectPet: (pet: Pet, reason: string) => void;
}

export function ModerationPanel({ pets, onApprovePet, onRejectPet }: ModerationPanelProps) {
  const { user } = useAuth();
  const [rejectingPet, setRejectingPet] = useState<Pet | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Filter only pending pets
  const pendingPets = pets.filter(p => p.moderationStatus === 'pending');
  
  // Pagination
  const totalPages = Math.ceil(pendingPets.length / perPage);
  const paginatedPets = pendingPets.slice((page - 1) * perPage, page * perPage);

  const handleApprove = (pet: Pet) => {
    onApprovePet(pet);
  };

  const handleRejectClick = (pet: Pet) => {
    setRejectingPet(pet);
    setRejectReason('');
  };

  const handleRejectConfirm = () => {
    if (rejectingPet && rejectReason.trim()) {
      onRejectPet(rejectingPet, rejectReason);
      setRejectingPet(null);
      setRejectReason('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">
          Модерация объявлений
        </h2>
        <div className="px-4 py-2 bg-amber-50 text-amber-700 rounded-lg border border-amber-200 font-medium">
          На проверке: {pendingPets.length}
        </div>
      </div>

      {pendingPets.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Нет объявлений на модерации
          </h3>
          <p className="text-gray-500">
            Все объявления проверены!
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedPets.map(pet => (
              <div
                key={pet.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors"
              >
                <div className="flex gap-6">
                  {/* Pet Image */}
                  <div className="flex-shrink-0">
                    <img
                      src={pet.photos[0]}
                      alt={animalTypeLabels[pet.animalType]}
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  </div>

                  {/* Pet Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {animalTypeLabels[pet.animalType]}
                          {pet.breed && ` · ${pet.breed}`}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span>{pet.city}</span>
                          <span>·</span>
                          <span>{formatDate(pet.publishedAt)}</span>
                          <span>·</span>
                          <span className="inline-flex px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                            {statusLabels[pet.status]}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                      {pet.description}
                    </p>

                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-sm">
                        <span className="text-gray-600">Автор: </span>
                        <span className="font-medium text-gray-900">{pet.authorName}</span>
                      </div>
                      {pet.contacts.phone && (
                        <div className="text-sm">
                          <span className="text-gray-600">Телефон: </span>
                          <span className="font-medium text-gray-900">{pet.contacts.phone}</span>
                        </div>
                      )}
                      {pet.contacts.telegram && (
                        <div className="text-sm">
                          <span className="text-gray-600">Telegram: </span>
                          <span className="font-medium text-gray-900">{pet.contacts.telegram}</span>
                        </div>
                      )}
                    </div>

                    {/* Additional Photos */}
                    {pet.photos.length > 1 && (
                      <div className="flex gap-2 mb-4">
                        {pet.photos.slice(1, 5).map((photo, index) => (
                          <img
                            key={index}
                            src={photo}
                            alt={`Фото ${index + 2}`}
                            className="w-16 h-16 object-cover rounded"
                          />
                        ))}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApprove(pet)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Одобрить
                      </button>
                      <button
                        onClick={() => handleRejectClick(pet)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Отклонить
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Назад
              </button>
              
              <span className="text-sm text-gray-700">{page} / {totalPages}</span>
              
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Вперед
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Reject Modal */}
      {rejectingPet && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Отклонить объявление
              </h3>
              <button
                onClick={() => setRejectingPet(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Укажите причину отклонения. Автор увидит это сообщение.
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Например: Недостаточно информации о питомце, некачественные фотографии, подозрение на мошенничество..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows={4}
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setRejectingPet(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={!rejectReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Отклонить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}