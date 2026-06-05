import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { Heart, Keyboard, RotateCcw, Settings2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/button';
import { PageLoader } from '../components/ui/page-loader';
import { MatchSwipeCard } from '../components/match/MatchSwipeCard';
import { MatchCompleteView, MatchNoResultsView } from '../components/match/MatchCompleteView';
import { useFavorites } from '../context/FavoritesContext';
import {
  addPassedPetId,
  addMatchLikedPetId,
  clearMatchLikedPetIds,
  clearPassedPetIds,
  readAdopterProfile,
  readMatchLikedPetIds,
  readPassedPetIds,
} from '../utils/adopter-profile-storage';
import { useI18n } from '../context/I18nContext';
import { rankPetsForProfile, type RankedPet } from '../utils/pet-match';
import { adopterHealthSummary, agePrefLabel, genderPrefLabel } from '../utils/adopter-profile-labels';
import { loadCatalogShelterPets } from '../utils/shelter-pet-browse';
import { applySeo, canonicalUrlFromPath, SEO_ROBOTS_PRIVATE } from '../utils/seo';
import { cn } from '../components/ui/utils';
import { matchLikeButtonClass, matchMobileActionsClass, matchMobileActionsInnerClass, matchMobileCardWrapClass, matchMobileMainPadClass, matchPassButtonClass } from '../styles/match-styles';

function MatchDesktopSidebar({
  onEditQuiz,
  labels,
}: {
  onEditQuiz: () => void;
  labels: ReturnType<typeof useI18n>['t']['match'];
}) {
  const profile = readAdopterProfile();
  if (!profile) return null;

  const s = labels.swipe;
  const p = labels.profile;
  const animal =
    profile.animalType === 'cat'
      ? s.animalCat
      : profile.animalType === 'dog'
        ? s.animalDog
        : s.animalAny;

  return (
    <aside className="hidden lg:block lg:sticky lg:top-24">
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
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-muted/30 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Keyboard size={16} aria-hidden />
          {s.hotkeys}
        </div>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>
            <kbd className="rounded border border-border bg-background px-1.5 py-0.5 text-xs">←</kbd>{' '}
            {s.hotkeyPass}
          </li>
          <li>
            <kbd className="rounded border border-border bg-background px-1.5 py-0.5 text-xs">→</kbd>{' '}
            {s.hotkeyLike}
          </li>
        </ul>
      </div>
    </aside>
  );
}

export default function MatchSwipePage() {
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const m = t.match;
  const s = m.swipe;
  const location = useLocation();
  const [profile, setProfile] = useState(() => readAdopterProfile());
  const { toggleFavorite, isFavorite } = useFavorites();
  const [loading, setLoading] = useState(true);
  const [ranked, setRanked] = useState<RankedPet[]>([]);
  const [passedIds, setPassedIds] = useState<Set<string>>(() => readPassedPetIds());
  const [seenCount, setSeenCount] = useState(0);
  const [likedIds, setLikedIds] = useState<Set<string>>(() =>
    readMatchLikedPetIds(readAdopterProfile()?.completedAt ?? ''),
  );

  useEffect(() => {
    setProfile(readAdopterProfile());
  }, [location.key]);

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
  const nextPreview = queue[1] ?? null;

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
        handlePass();
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        void handleLike();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleLike, handlePass]);

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
  const viewedCount = passedIds.size;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <Header showCitySelector={false} showHomeModeToggle={false} />
      <main
        className={cn(
          'flex min-h-0 w-full flex-1 flex-col px-0 pt-0 sm:px-4 sm:pt-4',
          matchMobileMainPadClass,
        )}
      >
        <div className="mx-auto flex w-full min-w-0 max-w-5xl flex-1 flex-col">
          <div className="flex w-full min-w-0 shrink-0 items-center justify-between gap-3 border-b border-border/50 px-4 py-3 lg:mb-2 lg:border-0 lg:px-0 lg:py-0">
            <div>
              <h1 className="text-lg font-bold tracking-tight text-foreground lg:text-xl">{s.title}</h1>
              {!loading && progressLabel && current && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {progressLabel} · {s.remaining.replace('{n}', String(queue.length))}
                </p>
              )}
              {isFinished && ranked.length > 0 && (
                <p className="mt-0.5 text-xs font-medium text-[#FF9800]">{s.finished}</p>
              )}
            </div>
            <div className={cn('flex gap-0.5', !isFinished && 'lg:hidden')}>
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

          <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col lg:mt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start lg:gap-8">
            <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col max-lg:overflow-hidden">
              <div className="mx-auto flex min-h-0 w-full min-w-0 flex-1 flex-col lg:max-w-lg">
                <div className={cn(matchMobileCardWrapClass, 'relative min-h-0 lg:min-h-[34rem]')}>
                  {loading ? (
                    <PageLoader />
                  ) : current ? (
                    <>
                      {nextPreview && (
                        <div
                          aria-hidden
                          className="pointer-events-none absolute inset-x-3 top-1 -z-10 hidden scale-[0.98] rounded-2xl border border-border bg-card opacity-35 shadow-sm lg:block"
                          style={{ height: 'calc(100% - 4px)' }}
                        />
                      )}
                      <MatchSwipeCard
                        key={current.pet.id}
                        pet={current.pet}
                        match={current.match}
                        onSwipeLeft={handlePass}
                        onSwipeRight={() => void handleLike()}
                        className="absolute inset-0"
                      />
                    </>
                  ) : ranked.length === 0 ? (
                    <MatchNoResultsView
                      className="absolute inset-0"
                      onEditQuiz={() => navigate('/match/quiz')}
                    />
                  ) : (
                    <MatchCompleteView
                      className="absolute inset-0"
                      viewedCount={viewedCount}
                      totalCount={ranked.length}
                      likedPets={sessionLiked}
                    />
                  )}
                </div>

                {current && !loading && (
                  <div className={matchMobileActionsClass} role="group" aria-label={s.cardActions}>
                    <div className={matchMobileActionsInnerClass}>
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={handlePass}
                          className={matchPassButtonClass}
                          aria-label={s.pass}
                        >
                          <X size={28} strokeWidth={2.5} />
                        </button>
                        <span className="mt-1 hidden text-[11px] font-medium text-muted-foreground sm:block lg:hidden">
                          {s.pass}
                        </span>
                      </div>
                      <div className="hidden min-w-0 text-center lg:block">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{s.swipeHint}</p>
                        <p className="mt-0.5 text-sm font-semibold text-foreground">{s.chooseAction}</p>
                      </div>
                      <div className="min-w-0 text-center lg:hidden">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          {s.swipeOrTap}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{s.orTap}</p>
                      </div>
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => void handleLike()}
                          className={matchLikeButtonClass}
                          aria-label={s.like}
                        >
                          <Heart size={30} strokeWidth={2.5} className="fill-current" />
                        </button>
                        <span className="mt-1 hidden text-[11px] font-medium text-muted-foreground sm:block lg:hidden">
                          {s.like}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <MatchDesktopSidebar onEditQuiz={() => navigate('/match/quiz')} labels={m} />
          </div>
        </div>
      </main>
      <div className="hidden lg:block">
        <Footer />
      </div>
    </div>
  );
}
