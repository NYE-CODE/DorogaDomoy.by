import { useState } from 'react';
import { CheckCircle2, XCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Pet } from '../types/pet';
import { formatDate, statusLabels, animalTypeLabels } from '../utils/pet-helpers';
import { useI18n } from '../context/I18nContext';
import { useScrollLock } from './ui/use-scroll-lock';

interface ModerationPanelProps {
  pets: Pet[];
  onApprovePet: (pet: Pet) => void;
  onRejectPet: (pet: Pet, reason: string) => void;
}

export function ModerationPanel({ pets, onApprovePet, onRejectPet }: ModerationPanelProps) {
  const { t } = useI18n();
  const m = t.adminPanel.moderation;
  const [rejectingPet, setRejectingPet] = useState<Pet | null>(null);
  useScrollLock(!!rejectingPet);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
          {m.title}
        </h2>
        <div className="px-4 py-2 bg-primary/10 dark:bg-primary/20 text-primary rounded-lg border border-primary/20 dark:border-primary/30 font-medium text-sm self-start">
          {m.pendingBadge(pendingPets.length)}
        </div>
      </div>

      {pendingPets.length === 0 ? (
        <div className="bg-card border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {m.emptyTitle}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {m.emptyHint}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedPets.map(pet => (
              <div
                key={pet.id}
                className="bg-card border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
              >
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                  {/* Pet Image */}
                  <div className="flex-shrink-0">
                    <img
                      src={pet.photos[0]}
                      alt={animalTypeLabels[pet.animalType]}
                      className="w-full sm:w-32 h-48 sm:h-32 object-cover rounded-lg"
                    />
                  </div>

                  {/* Pet Info */}
                  <div className="flex-1 min-w-0">
                    <div className="mb-3">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {animalTypeLabels[pet.animalType]}
                        {pet.breed && ` · ${pet.breed}`}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm text-gray-600 dark:text-gray-400">
                        <span>{pet.city}</span>
                        <span>·</span>
                        <span>{formatDate(pet.publishedAt)}</span>
                        <span className="inline-flex px-2 py-0.5 bg-muted text-muted-foreground rounded text-xs">
                          {statusLabels[pet.status]}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">
                      {pet.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-4">
                      <div className="text-sm">
                        <span className="text-gray-600 dark:text-gray-400">{m.author} </span>
                        <span className="font-medium text-gray-900 dark:text-white">{pet.authorName}</span>
                      </div>
                      {pet.contacts.phone && (
                        <div className="text-sm">
                          <span className="text-gray-600 dark:text-gray-400">{m.phoneShort} </span>
                          <span className="font-medium text-gray-900 dark:text-white">{pet.contacts.phone}</span>
                        </div>
                      )}
                      {pet.contacts.telegram && (
                        <div className="text-sm">
                          <span className="text-gray-600 dark:text-gray-400">{m.telegramShort} </span>
                          <span className="font-medium text-gray-900 dark:text-white">{pet.contacts.telegram}</span>
                        </div>
                      )}
                    </div>

                    {/* Additional Photos */}
                    {pet.photos.length > 1 && (
                      <div className="flex gap-2 mb-4 overflow-x-auto">
                        {pet.photos.slice(1, 5).map((photo, index) => (
                          <img
                            key={index}
                            src={photo}
                            alt={m.extraPhotoAlt(index + 2)}
                            className="w-16 h-16 object-cover rounded shrink-0"
                          />
                        ))}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApprove(pet)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 border border-primary text-primary bg-card rounded-lg hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors text-sm font-medium"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {m.approve}
                      </button>
                      <button
                        onClick={() => handleRejectClick(pet)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 bg-card rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium"
                      >
                        <XCircle className="w-4 h-4" />
                        {m.reject}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-card border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-accent dark:hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                {m.prevPage}
              </button>
              
              <span className="text-sm text-gray-700 dark:text-gray-300">{page} / {totalPages}</span>
              
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-card border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-accent dark:hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {m.nextPage}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Reject Modal */}
      {rejectingPet && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {m.rejectModalTitle}
              </h3>
              <button
                onClick={() => setRejectingPet(null)}
                className="p-1 hover:bg-accent dark:hover:bg-accent rounded"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {m.rejectHint}
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={m.rejectPlaceholder}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-transparent bg-card dark:bg-gray-700"
              rows={4}
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setRejectingPet(null)}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-accent dark:hover:bg-accent transition-colors"
              >
                {m.rejectCancel}
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={!rejectReason.trim()}
                className="flex-1 px-4 py-3 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {m.rejectConfirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}