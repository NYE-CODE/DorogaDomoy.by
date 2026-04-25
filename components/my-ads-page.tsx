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
  Rocket,
} from 'lucide-react';
import { Pet } from '../types/pet';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { sightingsApi } from '../api/client';
import { Header } from './layout/Header';
import { Footer } from './layout/Footer';
import { RewardBadge } from './reward-badge';
import { Button } from './ui/button';
import { EmptyState } from './ui/empty-state';
import { cn } from './ui/utils';
import { appPrimaryCtaClass } from '../styles/cta-classes';
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
  onBoostPet: (pet: Pet) => void;
  /** Выключите через ff_instagram_boost_stories в админке */
  instagramBoostEnabled?: boolean;
}

export function MyAdsPage({
  pets,
  onBack,
  onCreateClick,
  onEditPet,
  onDeletePet,
  onBoostPet,
  instagramBoostEnabled = true,
}: MyAdsPageProps) {
  const { user } = useAuth();
  const { t, locale } = useI18n();

  const dateLocale =
    locale === 'be' ? 'be-BY' : locale === 'en' ? 'en-GB' : 'ru-RU';
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
    date.toLocaleDateString(dateLocale, {
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

  const handleBoost = (e: React.MouseEvent, pet: Pet) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuId(null);
    onBoostPet(pet);
  };

  const totalActive = publishedCount + pendingCount + rejectedCount;

  return (
    <div className="flex min-h-screen flex-col bg-background dark:bg-gray-950">
      <Header />

      <main className="flex-1 py-6 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-border bg-muted/25 p-6 sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:p-8">
            <div className="min-w-0">
              <button
                type="button"
                onClick={onBack}
                className="mb-3 text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                ← {t.header.searchAds}
              </button>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{t.myAds.title}</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">{t.myAds.subtitle}</p>
            </div>
            {totalActive > 0 ? (
              <p className="shrink-0 text-sm tabular-nums text-muted-foreground">
                {t.myAds.totalAds}{' '}
                <span className="font-semibold text-foreground">{totalActive}</span>
              </p>
            ) : null}
          </div>

          {myAds.length === 0 ? (
            <EmptyState
              title={t.myAds.noAds}
              description={t.myAds.emptyNoAdsHint}
              icon={<Plus className="size-7" />}
              action={
                <Button className={appPrimaryCtaClass} onClick={onCreateClick}>
                  <Plus className="size-5" aria-hidden />
                  {t.myAds.createFirst}
                </Button>
              }
              className="border-dashed shadow-sm"
            />
          ) : (
            <>
              <div className="overflow-visible rounded-2xl border border-border bg-card shadow-sm">
                <div className="flex flex-wrap gap-1.5 border-b border-border bg-muted/40 p-2 sm:flex-nowrap sm:gap-1">
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
                        type="button"
                        onClick={() => setStatusTab(tab.value)}
                        className={cn(
                          'flex min-w-[calc(33.333%-0.25rem)] flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all sm:min-w-0',
                          isActive
                            ? 'bg-card text-primary shadow-sm ring-1 ring-primary/20'
                            : 'text-muted-foreground hover:bg-background/80 hover:text-foreground',
                        )}
                      >
                        <Icon className="size-[1.125rem] shrink-0 opacity-90" aria-hidden />
                        <span className="truncate">{t.moderation[tab.labelKey]}</span>
                        {count > 0 && (
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
                              isActive
                                ? 'bg-primary/15 text-primary'
                                : 'bg-muted text-muted-foreground',
                            )}
                          >
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6">
                  {filteredAds.length === 0 ? (
                    <EmptyState
                      title={
                        statusTab === 'approved'
                          ? t.myAds.noPublished
                          : statusTab === 'pending'
                            ? t.myAds.noPending
                            : t.myAds.noRejected
                      }
                      description={
                        statusTab === 'approved'
                          ? t.myAds.emptyPublishedDesc
                          : statusTab === 'pending'
                            ? t.myAds.emptyPendingDesc
                            : t.myAds.emptyRejectedDesc
                      }
                      icon={
                        statusTab === 'approved' ? (
                          <CheckCircle className="size-7 text-muted-foreground" />
                        ) : statusTab === 'pending' ? (
                          <Clock className="size-7 text-muted-foreground" />
                        ) : (
                          <XCircle className="size-7 text-muted-foreground" />
                        )
                      }
                      action={
                        statusTab === 'approved' ? (
                          <Button className={appPrimaryCtaClass} onClick={onCreateClick}>
                            <Plus className="size-5" aria-hidden />
                            {t.myAds.createFirst}
                          </Button>
                        ) : undefined
                      }
                      className="border-0 bg-transparent px-2 py-10 shadow-none md:px-4 md:py-14"
                    />
                  ) : (
                    /* List of ads */
                    <div className="space-y-3 sm:space-y-4">
                      {filteredAds.map((pet) => {
                        const photoUrl =
                          pet.photos[0] ||
                          'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop';
                        const statusLabel =
                          pet.status === 'searching' ? t.myAds.statusLost : t.myAds.statusFound;
                        const sightingCount = sightingCounts[pet.id] ?? 0;
                        const showRejectionTooltip =
                          pet.moderationStatus === 'rejected' &&
                          pet.moderationReason &&
                          hoveredTooltipId === pet.id;

                        return (
                          <div
                            key={pet.id}
                            className="group/card relative rounded-2xl border border-border bg-card p-3 transition-all hover:border-primary/30 hover:shadow-md sm:p-4"
                          >
                            <div
                              className="absolute right-2 top-2 z-30 sm:right-3 sm:top-3"
                              data-my-ads-menu
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(openMenuId === pet.id ? null : pet.id);
                                }}
                                className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                aria-label={t.common.options}
                              >
                                <MoreVertical className="size-[1.125rem] sm:size-5" />
                              </button>

                              {openMenuId === pet.id && (
                                <div className="absolute right-0 z-40 mt-1 w-52 overflow-hidden rounded-xl border border-border bg-popover py-1 text-popover-foreground shadow-lg sm:w-56">
                                  {pet.moderationStatus === 'rejected' && (
                                    <button
                                      type="button"
                                      onClick={(e) => handleEdit(e, pet)}
                                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted"
                                    >
                                      <Edit className="size-4 shrink-0 text-muted-foreground" />
                                      <span>{t.myAds.fixAndResubmit}</span>
                                    </button>
                                  )}
                                  {pet.moderationStatus !== 'pending' && (
                                    <>
                                      {instagramBoostEnabled &&
                                        pet.moderationStatus === 'approved' &&
                                        pet.status === 'searching' && (
                                        <button
                                          type="button"
                                          onClick={(e) => handleBoost(e, pet)}
                                          className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-primary/10"
                                        >
                                          <Rocket className="size-4 shrink-0 text-primary" />
                                          <span className="font-medium text-primary">{t.myAds.boostInstagramStories}</span>
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={(e) => handleEdit(e, pet)}
                                        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted"
                                      >
                                        <Edit className="size-4 shrink-0 text-muted-foreground" />
                                        <span>{t.common.edit}</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => handleDelete(e, pet)}
                                        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
                                      >
                                        <Trash2 className="size-4 shrink-0" />
                                        <span>{t.common.delete}</span>
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>

                            <Link
                              to={`/pet/${pet.id}`}
                              className="flex cursor-pointer items-start gap-3 no-underline text-inherit sm:gap-4"
                              onClick={() => setOpenMenuId(null)}
                            >
                              <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-border sm:size-28">
                                <img
                                  src={photoUrl}
                                  alt={getStatusTitle(pet)}
                                  className="size-full object-cover transition duration-300 group-hover/card:scale-[1.03]"
                                />
                              </div>

                              <div className="min-w-0 flex-1 pr-10 sm:pr-12">
                                <div className="mb-1.5 flex flex-wrap items-center gap-1.5 sm:mb-2 sm:gap-2">
                                  <span
                                    className={cn(
                                      'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium sm:px-3 sm:py-1',
                                      pet.status === 'searching'
                                        ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                                        : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/35 dark:text-emerald-300',
                                    )}
                                  >
                                    {statusLabel}
                                  </span>
                                  <RewardBadge pet={pet} compact />
                                  <h3 className="text-sm font-semibold text-foreground sm:text-base">
                                    {getStatusTitle(pet)}
                                  </h3>
                                  <span className="hidden text-muted-foreground sm:inline">•</span>
                                  <span className="hidden text-xs text-muted-foreground sm:inline sm:text-sm">
                                    {getPetTypeLabel(pet)}
                                  </span>
                                  {pet.moderationStatus === 'approved' &&
                                    pet.status === 'searching' &&
                                    sightingCount > 0 && (
                                      <>
                                        <span className="hidden text-muted-foreground sm:inline">•</span>
                                        <span className="flex items-center gap-1 text-xs text-muted-foreground sm:text-sm">
                                          <Eye className="size-3.5 sm:size-4" aria-hidden />
                                          {sightingCount}
                                        </span>
                                      </>
                                    )}
                                </div>

                                <div className="mb-1.5 text-xs text-muted-foreground sm:hidden">
                                  {getPetTypeLabel(pet)}
                                </div>

                                <div className="mb-1.5 flex flex-wrap items-center gap-1.5 sm:mb-2 sm:gap-2">
                                  {pet.colors.length > 0 &&
                                    pet.colors.map((color, idx) => (
                                      <span
                                        key={idx}
                                        className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground sm:px-2.5"
                                      >
                                        {t.pet.color[color as keyof typeof t.pet.color] ?? color}
                                      </span>
                                    ))}

                                  {pet.moderationStatus === 'rejected' && pet.moderationReason && (
                                    <div className="relative inline-flex">
                                      <span
                                        className="flex cursor-help items-center gap-1 rounded-md bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-950/40 dark:text-red-300 sm:px-2.5"
                                        onMouseEnter={() => setHoveredTooltipId(pet.id)}
                                        onMouseLeave={() => setHoveredTooltipId(null)}
                                      >
                                        <AlertCircle className="size-3 shrink-0" />
                                        <span className="hidden sm:inline">{t.moderation.rejected}</span>
                                        <span className="sm:hidden" aria-hidden>
                                          ⚠️
                                        </span>
                                      </span>

                                      {showRejectionTooltip && (
                                        <div className="pointer-events-none absolute bottom-full left-0 z-20 mb-2 w-56 rounded-xl bg-foreground p-3 text-xs text-background shadow-lg sm:left-1/2 sm:w-64 sm:-translate-x-1/2">
                                          <div className="mb-1 font-medium">{t.myAds.rejectionReasonTitle}</div>
                                          <div className="text-background/90">{pet.moderationReason}</div>
                                          <div className="absolute left-4 top-full -mt-px sm:left-1/2 sm:-translate-x-1/2">
                                            <div className="border-4 border-transparent border-t-foreground" />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground sm:gap-2 sm:text-sm">
                                  <span className="truncate">{pet.city}</span>
                                  <span className="shrink-0">•</span>
                                  <span className="shrink-0">{formatDate(pet.publishedAt)}</span>
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

              {filteredAds.length > 0 && (
                <div className="mt-8 flex justify-center">
                  <Button className={appPrimaryCtaClass} onClick={onCreateClick}>
                    <Plus className="size-5" aria-hidden />
                    {t.myAds.createAnother}
                  </Button>
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
