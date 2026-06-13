import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { Heart, RotateCcw, Settings2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '@/widgets/layout/Header';
import { Footer } from '@/widgets/layout/Footer';
import { Button } from '@/shared/ui/button';
import { PageLoader } from '@/shared/ui/page-loader';
import { MatchSwipeCard, type MatchSwipeCardHandle } from '../../components/match/MatchSwipeCard';
import { MatchCompleteView, MatchNoResultsView } from '../../components/match/MatchCompleteView';
import { useFavorites } from '@/app/providers/FavoritesContext';
import { useAuth } from '@/app/providers/AuthContext';
import {
  addPassedPetId,
  addMatchLikedPetId,
  adopterProfileScope,
  clearMatchLikedPetIds,
  clearPassedPetIds,
  readAdopterProfile,
  readMatchLikedPetIds,
  readPassedPetIds,
} from '@/shared/lib/adopter-profile-storage';
import { useI18n } from '@/app/providers/I18nContext';
import { rankPetsForProfile, type RankedPet } from '@/shared/lib/pet-match';
import { adopterHealthSummary, agePrefLabel, genderPrefLabel } from '@/shared/lib/adopter-profile-labels';
import { loadCatalogShelterPets } from '@/shared/lib/shelter-pet-browse';
import { applySeo, canonicalUrlFromPath, SEO_ROBOTS_PRIVATE } from '@/shared/lib/seo';
import { cn } from '@/shared/ui/utils';
import type { AdopterProfile } from '@/entities/adopter-profile/model/types';
import { matchActionsBarClass, matchActionsBarInnerClass, matchLikeButtonClass, matchMobileCardWrapClass, matchMobileMainPadClass, matchPassButtonClass, matchProgressBarClass, matchDesktopStageClass } from '@/shared/styles/match-styles';

function MatchDesktopSidebar({
  profile,
  onEditQuiz,
  onResetPassed,
  labels,
  progressLabel,
  progressPct,
  remainingLabel,
  sticky = false,
}: {
  profile: AdopterProfile;
  onEditQuiz: () => void;
  onResetPassed: () => void;
  labels: ReturnType<typeof useI18n>['t']['match'];
  progressLabel: string | null;
  progressPct: number;
  remainingLabel: string | null;
  sticky?: boolean;
}) {
  const s = labels.swipe;
  const p = labels.profile;
  const animal =
    profile.animalType === 'cat'
      ? s.animalCat
      : profile.animalType === 'dog'
        ? s.animalDog
        : s.animalAny;

  return (
    <aside
      className={cn(
        'hidden lg:flex lg:flex-col lg:gap-4 lg:self-start',
        sticky && 'lg:sticky lg:top-24 lg:max-h-[calc(100dvh-6.5rem)] lg:overflow-y-auto lg:overscroll-contain',
      )}
    >
      {progressLabel ? (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm font-semibold text-foreground">{s.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{progressLabel}</p>
          {remainingLabel ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{remainingLabel}</p>
          ) : null}
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div className={matchProgressBarClass} style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground">{s.yourProfile}</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>
            {s.lookingFor}: {animal}
          </li>
          <li>
            {s.activity}: {profile.energyLevel}/5
          </li>
          <li>
            {s.experience}:{' '}
            {profile.experience === 'beginner' ? s.experienceBeginner : s.experienceExperienced}
          </li>
          <li>
            {s.housing}:{' '}
            {profile.housing === 'apartment'
              ? labels.quiz.housingApartment
              : profile.housing === 'house'
                ? labels.quiz.housingHouse
                : labels.quiz.housingAny}
          </li>
          {profile.city ? (
            <li>
              {s.city}: {profile.city}
            </li>
          ) : null}
          <li>
            {s.age}: {agePrefLabel(profile.agePref, p)}
          </li>
          <li>
            {s.gender}: {genderPrefLabel(profile.genderPref, p)}
          </li>
          <li>
            {s.health}: {adopterHealthSummary(profile, p)}
          </li>
        </ul>
        <Button type="button" variant="outline" size="sm" className="mt-4 w-full" onClick={onEditQuiz}>
          {s.editQuiz}
        </Button>
        <Button type="button" variant="ghost" size="sm" className="mt-2 w-full text-muted-foreground" onClick={onResetPassed}>
          {s.resetPassed}
        </Button>
      </div>
    </aside>
  );
}

export default function MatchSwipePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const profileScope = adopterProfileScope(user?.id);
  const { t, locale } = useI18n();
  const m = t.match;
  const s = m.swipe;
  const location = useLocation();
  const [profile, setProfile] = useState(() => readAdopterProfile(profileScope));
  const { toggleFavorite, isFavorite } = useFavorites();
  const [loading, setLoading] = useState(true);
  const [ranked, setRanked] = useState<RankedPet[]>([]);
  const [passedIds, setPassedIds] = useState<Set<string>>(() => readPassedPetIds());
  const [seenCount, setSeenCount] = useState(0);
  const [likedIds, setLikedIds] = useState<Set<string>>(() =>
    readMatchLikedPetIds(readAdopterProfile(profileScope)?.completedAt ?? ''),
  );
  const cardRef = useRef<MatchSwipeCardHandle>(null);

  useEffect(() => {
    setProfile(readAdopterProfile(profileScope));
  }, [location.key, profileScope]);

  useEffect(() => {
    if (!profile) return;
    setLikedIds(readMatchLikedPetIds(profile.completedAt));
  }, [profile?.completedAt]);

  useEffect(() => {
    applySeo({
      title: m.seo.swipeTitle,
      description: m.seo.swipeDescription,
      canonicalUrl: canonicalUrlFromPath('/match'),
      robots: SEO_ROBOTS_PRIVATE,
    });
  }, [m.seo.swipeDescription, m.seo.swipeTitle]);

  const profileKey = profile?.completedAt ?? '';

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    setLoading(true);
    loadCatalogShelterPets()
      .then((pets) => {
        if (cancelled) return;
        setRanked(rankPetsForProfile(pets, profile, new Set(), m.reasons));
      })
      .catch(() => {
        if (!cancelled) {
          toast.error(m.toasts.loadError);
          setRanked([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [profile, profileKey, locale, m.reasons]);

  const queue = useMemo(
    () => ranked.filter((x) => !passedIds.has(x.pet.id)),
    [ranked, passedIds],
  );

  const sessionLiked = useMemo(
    () => ranked.filter((x) => likedIds.has(x.pet.id)),
    [ranked, likedIds],
  );

  const current = queue[0] ?? null;

  const advancePet = useCallback((petId: string) => {
    addPassedPetId(petId);
    setPassedIds((prev) => new Set(prev).add(petId));
    setSeenCount((c) => c + 1);
  }, []);

  const handlePass = useCallback(() => {
    if (!current) return;
    advancePet(current.pet.id);
  }, [advancePet, current]);

  const handleLike = useCallback(async () => {
    if (!current || !profile) return;
    const { pet } = current;

    if (!isFavorite(pet.id)) {
      try {
        await toggleFavorite(pet.id);
      } catch {
        toast.error(m.toasts.favoriteError);
        return;
      }
    }

    addMatchLikedPetId(pet.id, profile.completedAt);
    setLikedIds((prev) => new Set(prev).add(pet.id));
    advancePet(pet.id);
  }, [advancePet, current, isFavorite, profile, toggleFavorite]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        cardRef.current?.pass();
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        cardRef.current?.like();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleResetPassed = () => {
    clearPassedPetIds();
    clearMatchLikedPetIds();
    setPassedIds(new Set());
    setSeenCount(0);
    setLikedIds(new Set());
    toast.info(m.toasts.resetPassed);
  };

  if (!profile) {
    return <Navigate to="/match/quiz" replace />;
  }

  const progressLabel =
    ranked.length > 0
      ? `${s.progress.replace('{current}', String(Math.min(seenCount + 1, ranked.length))).replace('{total}', String(ranked.length))}`
      : null;
  const isFinished = !loading && !current;
  const showComplete = isFinished && ranked.length > 0;
  const showSwipeStage = loading || Boolean(current) || ranked.length === 0;
  const viewedCount = passedIds.size;
  const progressPct =
    ranked.length > 0
      ? isFinished
        ? 100
        : Math.min(100, Math.round((seenCount / ranked.length) * 100))
      : 0;
  const remainingLabel =
    current && ranked.length > 0 ? s.remaining.replace('{n}', String(queue.length)) : null;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background lg:bg-muted/20">
      <Header showCitySelector={false} showHomeModeToggle={false} />
      <main
        className={cn(
          'flex w-full flex-1 flex-col px-0 pt-0 sm:px-4 sm:pt-4 lg:px-6 lg:pt-6',
          matchMobileMainPadClass,
        )}
      >
        <div className="page-container mx-auto flex w-full min-w-0 flex-1 flex-col">
          <div className="flex w-full min-w-0 shrink-0 items-center justify-between gap-3 border-b border-border/50 px-4 py-3 lg:hidden">
            <div className="lg:hidden">
              <h1 className="typo-h1-compact">{s.title}</h1>
              {!loading && progressLabel && current && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {progressLabel} · {remainingLabel}
                </p>
              )}
              {isFinished && ranked.length > 0 && (
                <p className="mt-0.5 text-xs font-medium text-primary">{s.finished}</p>
              )}
            </div>
            <div className="flex gap-0.5 lg:hidden">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => navigate('/match/quiz')}
                aria-label={s.editQuiz}
              >
                <Settings2 className="size-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleResetPassed}
                aria-label={s.resetPassed}
              >
                <RotateCcw className="size-5" />
              </Button>
            </div>
          </div>

          <div
            className={cn(
              'flex w-full min-w-0 flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:items-start lg:gap-6 xl:grid-cols-[minmax(0,1fr)_19rem] xl:gap-8',
              showComplete && 'lg:items-start',
            )}
          >
            <div
              className={cn(
                'flex w-full min-w-0 flex-1 flex-col',
                (showSwipeStage || showComplete) && 'min-h-0',
                showSwipeStage && 'max-lg:overflow-hidden',
              )}
            >
              <div
                className={cn(
                  'mx-auto flex w-full min-w-0 flex-1 flex-col',
                  (showSwipeStage || showComplete) && 'min-h-0',
                )}
              >
                <div
                  className={cn(
                    matchDesktopStageClass,
                    matchMobileCardWrapClass,
                    'w-full',
                    (showSwipeStage || showComplete) && 'flex-1 min-h-0 max-lg:flex max-lg:flex-col',
                    showSwipeStage && 'relative lg:h-auto',
                    showComplete && 'max-lg:overflow-hidden',
                  )}
                >
                  {loading ? (
                    <PageLoader />
                  ) : current ? (
                    <MatchSwipeCard
                      ref={cardRef}
                      key={current.pet.id}
                      pet={current.pet}
                      match={current.match}
                      onSwipeLeft={handlePass}
                      onSwipeRight={() => void handleLike()}
                      className="absolute inset-0 lg:static lg:h-auto"
                    />
                  ) : ranked.length === 0 ? (
                    <MatchNoResultsView
                      className="absolute inset-0"
                      onEditQuiz={() => navigate('/match/quiz')}
                    />
                  ) : (
                    <MatchCompleteView
                      viewedCount={viewedCount}
                      totalCount={ranked.length}
                      likedPets={sessionLiked}
                    />
                  )}
                </div>

                {current && !loading && (
                  <div className={matchActionsBarClass} role="group" aria-label={s.cardActions}>
                    <div className={matchActionsBarInnerClass}>
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => cardRef.current?.pass()}
                          className={matchPassButtonClass}
                          aria-label={s.pass}
                        >
                          <X size={28} strokeWidth={2.5} />
                        </button>
                        <span className="mt-1.5 block text-xs font-medium text-muted-foreground">
                          {s.pass}
                        </span>
                      </div>
                      <div className="hidden min-w-0 max-w-[14rem] text-center lg:block">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{s.swipeHint}</p>
                        <p className="mt-0.5 text-sm font-semibold text-foreground">{s.desktopHint}</p>
                      </div>
                      <div className="min-w-0 text-center lg:hidden">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {s.swipeOrTap}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{s.orTap}</p>
                      </div>
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => cardRef.current?.like()}
                          className={matchLikeButtonClass}
                          aria-label={s.like}
                        >
                          <Heart size={30} strokeWidth={2.5} className="fill-current" />
                        </button>
                        <span className="mt-1.5 block text-xs font-medium text-muted-foreground">
                          {s.like}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <MatchDesktopSidebar
              profile={profile}
              onEditQuiz={() => navigate('/match/quiz')}
              onResetPassed={handleResetPassed}
              labels={m}
              progressLabel={!loading && current ? progressLabel : isFinished ? s.finished : null}
              progressPct={progressPct}
              remainingLabel={!loading && current ? remainingLabel : null}
              sticky={Boolean(current) && !loading}
            />
          </div>
        </div>
      </main>
      <div className="relative z-10 hidden shrink-0 lg:mt-6 lg:block">
        <Footer />
      </div>
    </div>
  );
}
