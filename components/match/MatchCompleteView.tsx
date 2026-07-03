import { Link } from 'react-router';
import { ChevronRight, Heart, MapPin, PawPrint } from 'lucide-react';
import { Button } from '../ui/button';
import { useI18n } from '../../context/I18nContext';
import type { RankedPet } from '../../utils/pet-match';
import { buildShelterPetUrl } from '../../utils/shelter-pet-browse';
import { appOutlineCtaClass, appPrimaryCtaClass } from '../../styles/cta-classes';
import { matchScoreBadgeClass } from '../../styles/match-styles';
import { cn } from '../ui/utils';
import { typoH3, typoH4 } from '@/shared/styles/typography-classes';

interface MatchCompleteViewProps {
  viewedCount: number;
  totalCount: number;
  likedPets: RankedPet[];
  className?: string;
}

function StatTile({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div
      className={cn(
        'flex flex-1 flex-col items-center rounded-md border px-3 py-3 text-center lg:min-w-[5.5rem] lg:flex-none',
        accent
          ? 'border-primary/35 bg-primary/8 dark:bg-primary/12'
          : 'border-border/70 bg-muted/25 dark:bg-muted/10',
      )}
    >
      <p className={cn('text-2xl font-bold tabular-nums', accent ? 'text-primary' : 'text-foreground')}>
        {value}
      </p>
      <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

function useLikedPetDisplay(item: RankedPet) {
  const { t } = useI18n();
  const c = t.match.card;
  const name = item.pet.name?.trim() || item.pet.breed || c.defaultName;
  const meta = [item.pet.breed, item.pet.approximateAge?.trim()].filter(Boolean).join(' · ');
  const href = buildShelterPetUrl(item.pet.id, { source: 'match' });
  return { c, name, meta, href };
}

/** Компактная строка — мобильный список. */
function LikedPetRow({ item }: { item: RankedPet }) {
  const { c, name, meta, href } = useLikedPetDisplay(item);

  return (
    <Link
      to={href}
      className="group flex items-center gap-3 rounded-md border border-border/80 bg-card p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md dark:hover:shadow-black/20"
    >
      <div className="relative size-[4.5rem] shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
        {item.pet.photos?.[0] ? (
          <img src={item.pet.photos[0]} alt="" className="size-full object-cover object-center" />
        ) : (
          <div className="flex size-full items-center justify-center">
            <PawPrint className="size-8 text-muted-foreground/40" aria-hidden />
          </div>
        )}
        <span className={cn(matchScoreBadgeClass, 'absolute bottom-1 right-1 px-1.5 py-0.5 text-xs')}>
          {item.match.score}%
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-bold text-foreground">{name}</p>
        {meta ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{meta}</p> : null}
        {item.pet.city ? (
          <p className="mt-1 truncate text-xs text-muted-foreground">{item.pet.city}</p>
        ) : null}
      </div>
      <ChevronRight
        className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
        aria-hidden
      />
    </Link>
  );
}

/** Карточка в сетке — десктоп (компактная). */
function LikedPetGridCard({ item }: { item: RankedPet }) {
  const { c, name, meta, href } = useLikedPetDisplay(item);

  return (
    <Link
      to={href}
      className="group flex h-full flex-col overflow-hidden rounded-md border border-border/80 bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md dark:hover:shadow-black/20"
    >
      <div className="relative h-[7.5rem] shrink-0 bg-muted sm:h-[8rem]">
        {item.pet.photos?.[0] ? (
          <img
            src={item.pet.photos[0]}
            alt=""
            className="size-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <PawPrint className="size-10 text-muted-foreground/30" aria-hidden />
          </div>
        )}
        <span className={cn(matchScoreBadgeClass, 'absolute right-2 top-2 px-2 py-0.5 text-xs')}>
          {item.match.score}%
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-3">
        <h4 className={cn(typoH4, 'line-clamp-1 text-sm transition-colors group-hover:text-primary')}>
          {name}
        </h4>
        {meta ? <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{meta}</p> : null}
        {item.pet.city ? (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin size={12} className="shrink-0 text-primary" aria-hidden />
            <span className="line-clamp-1">{item.pet.city}</span>
          </p>
        ) : null}

        <span className="mt-auto inline-flex items-center gap-0.5 pt-2.5 text-xs font-semibold text-primary transition-colors group-hover:text-primary-hover">
          {c.viewProfile}
          <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

export function MatchCompleteView({
  viewedCount,
  totalCount,
  likedPets,
  className,
}: MatchCompleteViewProps) {
  const { t } = useI18n();
  const c = t.match.complete;
  const likedCount = likedPets.length;
  const hasLikes = likedCount > 0;

  return (
    <div
      className={cn(
        'flex w-full flex-col rounded-lg border border-border/80 bg-card shadow-sm max-lg:min-h-0 max-lg:flex-1 max-lg:overflow-hidden max-lg:rounded-none max-lg:border-x-0 lg:shadow-md',
        className,
      )}
    >
      <div className="shrink-0 border-b border-border/60 bg-gradient-to-br from-primary/12 via-card to-card px-5 pb-4 pt-6 dark:from-primary/10 sm:px-6 lg:px-6 lg:pb-4 lg:pt-5">
        <div className="lg:flex lg:items-center lg:justify-between lg:gap-6">
          <div className="lg:flex lg:min-w-0 lg:flex-1 lg:items-center lg:gap-4">
            <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary ring-4 ring-primary/10 dark:bg-primary/20 lg:mx-0">
              {hasLikes ? (
                <Heart className="size-6 fill-current" aria-hidden />
              ) : (
                <PawPrint className="size-6" aria-hidden />
              )}
            </div>
            <div className="lg:min-w-0 lg:text-left">
              <h2 className={`${typoH3} mt-4 text-center lg:mt-0 lg:text-left`}>
                {hasLikes ? c.titleLikes : c.titleDone}
              </h2>
              <p className="mx-auto mt-1.5 max-w-sm text-center text-sm text-muted-foreground lg:mx-0 lg:max-w-lg lg:text-left">
                {hasLikes ? c.descLikes : c.descDone}
              </p>
              {hasLikes ? (
                <div className="mt-3 hidden lg:block">
                  <Button type="button" size="sm" className={cn(appPrimaryCtaClass, 'min-w-[10rem]')} asChild>
                    <Link to="/favorites">{c.openFavorites}</Link>
                  </Button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex gap-2 lg:mt-0 lg:shrink-0 lg:gap-2">
            <StatTile label={c.statViewed} value={viewedCount} />
            <StatTile label={c.statLiked} value={likedCount} accent={hasLikes} />
            <StatTile label={c.statTotal} value={totalCount} />
          </div>
        </div>
      </div>

      <div className="px-5 py-4 sm:px-6 lg:px-6 lg:py-5">
        {hasLikes ? (
          <div className="flex min-h-0 flex-1 flex-col max-lg:overflow-hidden lg:block">
            <div className="mb-3 flex shrink-0 items-end justify-between gap-3 lg:mb-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">{c.findings}</h3>
                <p className="mt-0.5 hidden text-xs text-muted-foreground lg:block">{c.findingsHint}</p>
              </div>
              <span className="hidden shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary-emphasis dark:text-primary-soft lg:inline-flex">
                {likedCount}
              </span>
            </div>

            <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain lg:hidden">
              {likedPets.map((item) => (
                <LikedPetRow key={item.pet.id} item={item} />
              ))}
            </div>

            <div className="hidden lg:block">
              <div className="grid grid-cols-[repeat(auto-fill,minmax(8.75rem,1fr))] gap-3 xl:grid-cols-[repeat(auto-fill,minmax(9.25rem,1fr))] xl:gap-3.5">
                {likedPets.map((item) => (
                  <LikedPetGridCard key={item.pet.id} item={item} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-border/80 bg-muted/20 px-4 py-8 text-center dark:bg-muted/10 lg:py-12">
            <Heart className="mx-auto size-9 text-muted-foreground/35" aria-hidden />
            <p className="mt-3 text-sm font-medium text-foreground">{c.emptySwipeHint}</p>
            <p className="mt-1 text-xs text-muted-foreground">{c.emptySwipeDesc}</p>
          </div>
        )}
      </div>

      {hasLikes ? (
        <div className="shrink-0 border-t border-border/60 bg-card px-5 py-4 sm:px-6 lg:hidden">
          <Button type="button" className={cn(appPrimaryCtaClass, 'w-full')} asChild>
            <Link to="/favorites">{c.openFavorites}</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}

interface MatchNoResultsViewProps {
  onEditQuiz: () => void;
  className?: string;
}

export function MatchNoResultsView({ onEditQuiz, className }: MatchNoResultsViewProps) {
  const { t } = useI18n();
  const n = t.match.noResults;

  return (
    <div
      className={cn(
        'flex h-full flex-col items-center justify-center rounded-lg border border-border/80 bg-card p-8 text-center shadow-sm max-lg:rounded-none max-lg:border-x-0',
        className,
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-primary/12 text-primary dark:bg-primary/18">
        <PawPrint className="size-7" aria-hidden />
      </div>
      <h2 className="mt-4 typo-h1">{n.title}</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{n.description}</p>
      <div className="mt-6 flex w-full max-w-xs flex-col gap-2">
        <Button type="button" className={appPrimaryCtaClass} onClick={onEditQuiz}>
          {n.editQuiz}
        </Button>
        <Button type="button" variant="outline" className={appOutlineCtaClass} asChild>
          <Link to="/shelters?tab=pets">{n.browseCatalog}</Link>
        </Button>
      </div>
    </div>
  );
}
