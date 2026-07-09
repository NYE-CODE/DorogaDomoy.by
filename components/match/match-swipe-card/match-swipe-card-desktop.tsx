import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { buildShelterPetUrl } from '../../../utils/shelter-pet-browse';
import { matchCardShellDesktopClass } from '@/shared/styles/match-styles';
import { cn } from '../../ui/utils';
import { MatchDesktopPhotoGallery } from './match-desktop-photo-gallery';
import { MatchPetDetailsBody } from './match-pet-details-body';
import { MatchPetSummary } from './match-pet-summary';
import { MatchScoreRing } from './match-score-ring';
import type { MatchSwipeCardHandle, MatchSwipeCardProps } from './match-swipe-card-types';
import { useHorizontalSwipe } from './use-horizontal-swipe';
import { useMatchPetDisplay } from './use-match-pet-display';

export const MatchSwipeCardDesktop = forwardRef<MatchSwipeCardHandle, MatchSwipeCardProps>(function MatchSwipeCardDesktop(
  { pet, match, onSwipeLeft, onSwipeRight, className },
  ref,
) {
  const { c, s, name, meta, energy, detailItems } = useMatchPetDisplay(pet, match);
  const shellRef = useRef<HTMLDivElement>(null);
  const { dragging, likeOpacity, passOpacity, shellStyle, swipeHandlers, triggerPass, triggerLike } =
    useHorizontalSwipe(onSwipeLeft, onSwipeRight, false, shellRef);

  useImperativeHandle(
    ref,
    () => ({
      pass: triggerPass,
      like: triggerLike,
    }),
    [triggerPass, triggerLike],
  );

  const profileHref = buildShelterPetUrl(pet.id, { source: 'match' });

  return (
    <div className={cn('relative h-full w-full min-w-0 select-none', className)} style={{ perspective: 1000 }}>
      <div
        ref={shellRef}
        className={cn(matchCardShellDesktopClass, dragging && 'cursor-grabbing')}
        style={shellStyle}
      >
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(16rem,2fr)] lg:items-stretch">
          <MatchDesktopPhotoGallery
            pet={pet}
            noPhotoLabel={c.noPhoto}
            className="lg:h-full lg:rounded-l-2xl"
            swipeHandlers={swipeHandlers}
            dragging={dragging}
            likeOpacity={likeOpacity}
            passOpacity={passOpacity}
            likeLabel={c.likeStamp}
            passLabel={c.passStamp}
          />

          <div className="flex min-h-0 min-w-0 flex-col border-t border-border/60 lg:border-l lg:border-t-0 lg:rounded-r-2xl lg:bg-card">
            <header className="shrink-0 border-b border-border/70 px-4 py-4 sm:px-5">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="min-w-0 flex-1">
                  <MatchPetSummary
                    name={name}
                    meta={meta}
                    pet={pet}
                    energy={energy}
                    activityLabel={s.activity}
                  />
                  <Link
                    to={profileHref}
                    className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
                  >
                    {c.viewProfile}
                    <ChevronRight size={16} aria-hidden />
                  </Link>
                </div>
                <MatchScoreRing score={match.score} label={c.matchScore} />
              </div>
            </header>

            <div className="min-h-0 flex-1 px-4 py-4 sm:px-5">
              <MatchPetDetailsBody pet={pet} match={match} detailItems={detailItems} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
