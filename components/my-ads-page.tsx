import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  MoreVertical,
} from 'lucide-react';
import { Pet } from '../types/pet';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { sightingsApi } from '../api/client';
import { Header } from './layout/Header';
import { Footer } from './layout/Footer';
import type { ModerationStatus } from '../types/pet';

const STATUS_TABS: {
  value: ModerationStatus;
  icon: typeof CheckCircle;
  labelKey: keyof { approved: string; onReview: string; rejected: string };
}[] = [
  { value: 'approved', icon: CheckCircle, labelKey: 'approved' },
  { value: 'pending', icon: Clock, labelKey: 'onReview' },
  { value: 'rejected', icon: XCircle, labelKey: 'rejected' },
];

interface MyAdsPageProps {
  pets: Pet[];
  onBack: () => void;
  onCreateClick: () => void;
  onEditPet: (pet: Pet) => void;
  onDeletePet: (pet: Pet) => void;
}

export function MyAdsPage({
  pets,
  onBack,
  onCreateClick,
  onEditPet,
  onDeletePet,
}: MyAdsPageProps) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [hoveredTooltipId, setHoveredTooltipId] = useState<string | null>(null);

  const myAds = useMemo(
    () =>
      pets.filter(
        (pet) =>
          user &&
          (pet.authorId === user.id ||
            (user.id === 'user-demo' && pet.authorId === 'current-user')) &&
          !pet.isArchived
      ),
    [pets, user]
  );

  const [statusTab, setStatusTab] = useState<ModerationStatus>('approved');

  const filteredAds = useMemo(
    () => myAds.filter((p) => p.moderationStatus === statusTab),
    [myAds, statusTab]
  );

  const searchPetIds = useMemo(
    () =>
      pets
        .filter(
          (p) =>
            user &&
            (p.authorId === user.id ||
              (user.id === 'user-demo' && p.authorId === 'current-user')) &&
            !p.isArchived &&
            p.status === 'searching'
        )
        .map((p) => p.id),
    [pets, user]
  );

  const [sightingCounts, setSightingCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (searchPetIds.length === 0) return;
    sightingsApi
      .getCounts(searchPetIds)
      .then(setSightingCounts)
      .catch(() => setSightingCounts({}));
  }, [searchPetIds.join(',')]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-my-ads-menu]')) {
        setOpenMenuId(null);
      }
    };
    if (openMenuId) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  const publishedCount = myAds.filter((a) => a.moderationStatus === 'approved').length;
  const pendingCount = myAds.filter((a) => a.moderationStatus === 'pending').length;
  const rejectedCount = myAds.filter((a) => a.moderationStatus === 'rejected').length;

  const getStatusTitle = (pet: Pet) => {
    const key =
      pet.status === 'searching'
        ? (pet.animalType === 'dog'
            ? 'formTitleLostDog'
            : pet.animalType === 'cat'
              ? 'formTitleLostCat'
              : 'formTitleLostOther')
        : (pet.animalType === 'dog'
            ? 'formTitleFoundDog'
            : pet.animalType === 'cat'
              ? 'formTitleFoundCat'
              : 'formTitleFoundOther');
    return t.petForm[key as keyof typeof t.petForm];
  };

  const getPetTypeLabel = (pet: Pet) => {
    return pet.breed || t.pet.animalType[pet.animalType];
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  const handleEdit = (e: React.MouseEvent, pet: Pet) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuId(null);
    onEditPet(pet);
  };

  const handleDelete = (e: React.MouseEvent, pet: Pet) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuId(null);
    onDeletePet(pet);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background flex flex-col">
      <Header />

      <main className="flex-1 py-4 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-white mb-2">
              {t.myAds.title}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              {(t.myAds as { subtitle?: string }).subtitle ??
                'Управляйте своими объявлениями о потерянных и найденных питомцах'}
            </p>
          </div>

          {myAds.length === 0 ? (
            /* Empty state — no ads at all */
            <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-200 dark:border-border overflow-hidden">
              <div className="text-center py-12 sm:py-16">
                <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 dark:bg-muted rounded-full mb-4">
                  <Plus size={28} className="sm:w-8 sm:h-8 text-gray-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {t.myAds.noAds}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto px-4">
                  Если вы потеряли питомца или нашли чужого, создайте объявление, чтобы помочь ему
                  вернуться домой.
                </p>
                <button
                  onClick={onCreateClick}
                  className="inline-flex items-center justify-center h-12 px-6 bg-[#FF9800] text-white rounded-lg hover:bg-[#F57C00] transition-colors font-medium text-base sm:text-lg"
                >
                  <span className="text-xl mr-2">+</span>
                  {t.myAds.createFirst}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-200 dark:border-border overflow-hidden">
                <div className="flex border-b border-gray-200 dark:border-border">
                  {STATUS_TABS.map((tab) => {
                    const Icon = tab.icon;
                    const count =
                      tab.value === 'approved'
                        ? publishedCount
                        : tab.value === 'pending'
                          ? pendingCount
                          : rejectedCount;
                    const isActive = statusTab === tab.value;

                    return (
                      <button
                        key={tab.value}
                        onClick={() => setStatusTab(tab.value)}
                        className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 font-medium text-sm sm:text-base transition-colors relative ${
                          isActive
                            ? 'text-[#FF9800] bg-orange-50 dark:bg-orange-950/30'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-muted'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
                          <div className="flex items-center gap-1">
                            <Icon size={20} className="flex-shrink-0" />
                            {count > 0 && (
                              <span
                                className={`px-1.5 py-0.5 rounded-full text-xs ${
                                  isActive
                                    ? 'bg-[#FF9800] text-white'
                                    : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                {count}
                              </span>
                            )}
                          </div>
                          <span className="text-xs sm:text-base">
                            {t.moderation[tab.labelKey]}
                          </span>
                        </div>
                        {isActive && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#FF9800]" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6">
                  {filteredAds.length === 0 ? (
                    /* Empty tab state */
                    <div className="text-center py-12 sm:py-16">
                      <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 dark:bg-muted rounded-full mb-4">
                        {statusTab === 'approved' && (
                          <CheckCircle size={28} className="sm:w-8 sm:h-8 text-gray-400" />
                        )}
                        {statusTab === 'pending' && (
                          <Clock size={28} className="sm:w-8 sm:h-8 text-gray-400" />
                        )}
                        {statusTab === 'rejected' && (
                          <XCircle size={28} className="sm:w-8 sm:h-8 text-gray-400" />
                        )}
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {statusTab === 'approved' &&
                          ((t.myAds as { noPublished?: string }).noPublished ?? t.myAds.noAdsInTab)}
                        {statusTab === 'pending' &&
                          ((t.myAds as { noPending?: string }).noPending ?? t.myAds.noAdsInTabPending)}
                        {statusTab === 'rejected' &&
                          ((t.myAds as { noRejected?: string }).noRejected ??
                            t.myAds.noAdsInTabRejected)}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto px-4">
                        {statusTab === 'approved' &&
                          ((t.myAds as { emptyPublishedDesc?: string }).emptyPublishedDesc ??
                            'Создайте первое объявление, чтобы помочь найти пропавшего питомца или вернуть найденного хозяину')}
                        {statusTab === 'pending' &&
                          ((t.myAds as { emptyPendingDesc?: string }).emptyPendingDesc ??
                            'Все новые объявления проходят модерацию. Обычно это занимает не более 24 часов')}
                        {statusTab === 'rejected' &&
                          ((t.myAds as { emptyRejectedDesc?: string }).emptyRejectedDesc ??
                            'Здесь будут отображаться объявления, которые не прошли модерацию')}
                      </p>
                      {statusTab === 'approved' && (
                        <button
                          onClick={onCreateClick}
                          className="inline-flex items-center justify-center h-12 px-6 bg-[#FF9800] text-white rounded-lg hover:bg-[#F57C00] transition-colors font-medium text-base sm:text-lg"
                        >
                          <span className="text-xl mr-2">+</span>
                          {t.myAds.createFirst}
                        </button>
                      )}
                    </div>
                  ) : (
                    /* List of ads */
                    <div className="space-y-3 sm:space-y-4">
                      {filteredAds.map((pet) => {
                        const photoUrl =
                          pet.photos[0] ||
                          'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop';
                        const statusLabel =
                          pet.status === 'searching'
                            ? (t.myAds as { statusLost?: string }).statusLost ?? 'Пропала'
                            : (t.myAds as { statusFound?: string }).statusFound ?? 'Найдена';
                        const sightingCount = sightingCounts[pet.id] ?? 0;
                        const showRejectionTooltip =
                          pet.moderationStatus === 'rejected' &&
                          pet.moderationReason &&
                          hoveredTooltipId === pet.id;

                        return (
                          <div
                            key={pet.id}
                            className="relative bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-3 sm:p-4 hover:shadow-md transition-shadow"
                          >
                            {/* Three-dot menu */}
                            <div
                              className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10"
                              data-my-ads-menu
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(openMenuId === pet.id ? null : pet.id);
                                }}
                                className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-muted rounded-lg transition-colors"
                              >
                                <MoreVertical
                                  size={18}
                                  className="sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400"
                                />
                              </button>

                              {openMenuId === pet.id && (
                                <div className="absolute right-0 mt-1 w-48 sm:w-56 bg-white dark:bg-card rounded-lg shadow-lg border border-gray-200 dark:border-border py-1 z-20">
                                  {pet.moderationStatus === 'rejected' && (
                                    <button
                                      onClick={(e) => handleEdit(e, pet)}
                                      className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 hover:bg-gray-50 dark:hover:bg-muted transition-colors text-xs sm:text-sm text-left"
                                    >
                                      <Edit size={14} className="sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400" />
                                      <span className="text-gray-700 dark:text-gray-300">
                                        {(t.myAds as { fixAndResubmit?: string }).fixAndResubmit ??
                                          'Исправить и отправить'}
                                      </span>
                                    </button>
                                  )}
                                  {pet.moderationStatus !== 'pending' && (
                                    <>
                                      <button
                                        onClick={(e) => handleEdit(e, pet)}
                                        className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 hover:bg-gray-50 dark:hover:bg-muted transition-colors text-xs sm:text-sm text-left"
                                      >
                                        <Edit size={14} className="sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400" />
                                        <span className="text-gray-700 dark:text-gray-300">
                                          {t.common.edit}
                                        </span>
                                      </button>
                                      <button
                                        onClick={(e) => handleDelete(e, pet)}
                                        className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-xs sm:text-sm text-left"
                                      >
                                        <Trash2 size={14} className="sm:w-4 sm:h-4 text-red-600" />
                                        <span className="text-red-600 dark:text-red-400">
                                          {t.common.delete}
                                        </span>
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>

                            <Link
                              to={`/pet/${pet.id}`}
                              className="flex gap-3 sm:gap-4 items-start cursor-pointer no-underline text-inherit"
                              onClick={() => setOpenMenuId(null)}
                            >
                              {/* Photo */}
                              <div className="flex-shrink-0">
                                <img
                                  src={photoUrl}
                                  alt={getStatusTitle(pet)}
                                  className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg"
                                />
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0 pr-6 sm:pr-8">
                                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-1.5 sm:mb-2">
                                  <span
                                    className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                                      pet.status === 'searching'
                                        ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                        : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                    }`}
                                  >
                                    {statusLabel}
                                  </span>
                                  <h3 className="font-semibold text-black dark:text-white text-sm sm:text-base">
                                    {getStatusTitle(pet)}
                                  </h3>
                                  <span className="text-gray-400 hidden sm:inline">•</span>
                                  <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm hidden sm:inline">
                                    {getPetTypeLabel(pet)}
                                  </span>
                                  {pet.moderationStatus === 'approved' &&
                                    pet.status === 'searching' &&
                                    sightingCount > 0 && (
                                      <>
                                        <span className="text-gray-400 hidden sm:inline">•</span>
                                        <span className="flex items-center gap-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                          <Eye size={14} className="sm:w-4 sm:h-4" />
                                          {sightingCount}
                                        </span>
                                      </>
                                    )}
                                </div>

                                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1.5 sm:hidden">
                                  {getPetTypeLabel(pet)}
                                </div>

                                {/* Color tags + Rejection badge */}
                                <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 flex-wrap">
                                  {pet.colors.length > 0 &&
                                    pet.colors.map((color, idx) => (
                                      <span
                                        key={idx}
                                        className="px-2 sm:px-2.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md text-xs"
                                      >
                                        {t.pet.color[color as keyof typeof t.pet.color] ?? color}
                                      </span>
                                    ))}

                                  {pet.moderationStatus === 'rejected' && pet.moderationReason && (
                                    <div className="relative inline-flex">
                                      <span
                                        className="px-2 sm:px-2.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md text-xs font-medium flex items-center gap-1 cursor-help"
                                        onMouseEnter={() => setHoveredTooltipId(pet.id)}
                                        onMouseLeave={() => setHoveredTooltipId(null)}
                                      >
                                        <AlertCircle size={12} />
                                        <span className="hidden sm:inline">{t.moderation.rejected}</span>
                                        <span className="sm:hidden">⚠️</span>
                                      </span>

                                      {showRejectionTooltip && (
                                        <div className="absolute bottom-full left-0 sm:left-1/2 sm:-translate-x-1/2 mb-2 w-56 sm:w-64 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg p-3 shadow-lg z-20 pointer-events-none">
                                          <div className="font-medium mb-1">
                                            {(t.myAds as { rejectionReasonTitle?: string })
                                              .rejectionReasonTitle ?? 'Причина отклонения:'}
                                          </div>
                                          <div className="text-gray-200 dark:text-gray-300">
                                            {pet.moderationReason}
                                          </div>
                                          <div className="absolute top-full left-4 sm:left-1/2 sm:-translate-x-1/2 -mt-px">
                                            <div className="border-4 border-transparent border-t-gray-900 dark:border-t-gray-800" />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                                  <span className="truncate">{pet.city}</span>
                                  <span className="flex-shrink-0">•</span>
                                  <span className="flex-shrink-0">
                                    {formatDate(pet.publishedAt)}
                                  </span>
                                </div>
                              </div>
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Create another button */}
              {filteredAds.length > 0 && (
                <div className="mt-6 text-center">
                  <button
                    onClick={onCreateClick}
                    className="inline-flex items-center justify-center h-12 px-6 bg-[#FF9800] text-white rounded-lg hover:bg-[#F57C00] transition-colors font-medium text-lg"
                  >
                    <span className="text-xl mr-2">+</span>
                    {(t.myAds as { createAnother?: string }).createAnother ??
                      'Создать ещё объявление'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
