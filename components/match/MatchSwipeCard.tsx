import { useRef, useState, useCallback, useLayoutEffect, useEffect, useMemo, useImperativeHandle, forwardRef, type PointerEvent, type RefObject } from 'react';
import { Link } from 'react-router';
import { ChevronRight, Heart, MapPin, Sparkles, X } from 'lucide-react';
import type { Pet } from '../../types/pet';
import type { MatchResult } from '../../utils/pet-match';
import { petEnergyHint } from '../../utils/pet-match';
import { buildTraitScales } from '../../utils/pet-traits';
import { buildShelterPetUrl } from '../../utils/shelter-pet-browse';
import { cn } from '../ui/utils';
import { ShelterPetTraits } from '../ShelterPetTraits';
import { useI18n } from '../../context/I18nContext';
import { tokens } from '@/shared/styles/tokens';
import {
  matchCardBodyClass,
  matchCardPhotoClass,
  matchCardShellClass,
  matchCardShellDesktopClass,
  matchDesktopPhotoClass,
  matchDesktopPhotoMainClass,
  matchDesktopPhotoImgClass,
  matchDesktopThumbStripClass,
  matchDesktopThumbActiveClass,
  matchDesktopThumbClass,
  matchReasonChipClass,
  matchScoreBadgeClass,
  matchScoreRingTrackClass,
  matchScoreRingValueClass,
  matchSwipeLikeOverlayClass,
  matchSwipeLikeStampClass,
  matchSwipePassOverlayClass,
  matchSwipePassStampClass,
  matchSwipeStampLabelClass,
} from '../../styles/match-styles';

const SWIPE_THRESHOLD = 80;
const DRAG_THRESHOLD = 10;
const EXIT_ANIM_MS = 520;
const ROTATE_FACTOR = 0.014;
const ROTATE_MAX_DEG = 7;
const EXIT_DISTANCE_RATIO = 0.55;
const PEEK_FALLBACK = 108;
const PEEK_MAX_RATIO = 0.26;
const MAX_EXPAND_RATIO = 0.66;
const SNAP_EXPAND_RATIO = 0.55;

function swipeStampMotion(opacity: number, rotateDeg: number) {
  const scale = 0.72 + opacity * 0.28;
  const lift = (1 - opacity) * 14;
  return {
    opacity,
    transform: `translateY(calc(-50% + ${lift}px)) rotate(${rotateDeg}deg) scale(${scale})`,
  };
}

function swipeRotation(dragX: number) {
  const deg = dragX * ROTATE_FACTOR;
  return Math.max(-ROTATE_MAX_DEG, Math.min(ROTATE_MAX_DEG, deg));
}

interface MatchSwipeCardProps {
  pet: Pet;
  match: MatchResult;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  className?: string;
}

export interface MatchSwipeCardHandle {
  pass: () => void;
  like: () => void;
}

function useMatchPetDisplay(pet: Pet, match: MatchResult) {
  const { t } = useI18n();
  const c = t.match.card;
  const s = t.match.swipe;
  const traitScales = buildTraitScales(t.petTraits);

  const name = pet.name?.trim() || pet.breed || c.defaultName;
  const breed = pet.breed?.trim();
  const age = pet.approximateAge?.trim();
  const meta = [breed, age].filter(Boolean).join(' · ') || '—';
  const energy = petEnergyHint(pet, traitScales);
  const genderLabel: Record<string, string> = {
    male: c.genderMale,
    female: c.genderFemale,
    unknown: c.genderUnknown,
  };
  const healthLabel: Record<string, string> = {
    disabled: c.healthDisabled,
    treatment: c.healthTreatment,
    good: c.healthGood,
    excellent: c.healthExcellent,
  };
  const detailItems: [string, string][] = [
    [c.detailAge, age || c.notSpecified],
    [c.detailGender, genderLabel[pet.gender] ?? c.notSpecified],
    [
      c.detailHealth,
      pet.healthStatus ? healthLabel[pet.healthStatus] ?? pet.healthStatus : c.notSpecifiedNeuter,
    ],
    [c.detailCity, pet.city || c.notSpecified],
  ];

  return { c, s, name, meta, energy, detailItems, match };
}

function useHorizontalSwipe(
  onSwipeLeft: () => void,
  onSwipeRight: () => void,
  disabled = false,
  shellRef?: RefObject<HTMLDivElement | null>,
) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [exiting, setExiting] = useState<'left' | 'right' | null>(null);
  const startX = useRef(0);
  const pointerId = useRef<number | null>(null);
  const dragXRef = useRef(0);
  const busyRef = useRef(false);
  const exitTimerRef = useRef<number | null>(null);
  dragXRef.current = dragX;

  const exitDistance = useCallback(() => {
    const shellW = shellRef?.current?.offsetWidth;
    if (shellW && shellW > 0) return shellW * EXIT_DISTANCE_RATIO;
    if (typeof window !== 'undefined') return Math.min(window.innerWidth * 0.42, 360);
    return 280;
  }, [shellRef]);

  const clearExitTimer = useCallback(() => {
    if (exitTimerRef.current != null) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearExitTimer();
  }, [clearExitTimer]);

  const animateExit = useCallback(
    (direction: 'left' | 'right', onComplete: () => void) => {
      if (busyRef.current || disabled) return;
      busyRef.current = true;
      setDragging(false);
      pointerId.current = null;
      setExiting(direction);
      setDragX(direction === 'right' ? exitDistance() : -exitDistance());

      clearExitTimer();
      exitTimerRef.current = window.setTimeout(() => {
        exitTimerRef.current = null;
        onComplete();
        busyRef.current = false;
        setExiting(null);
        setDragX(0);
      }, EXIT_ANIM_MS);
    },
    [clearExitTimer, disabled, exitDistance],
  );

  const finishDrag = useCallback(
    (dx: number) => {
      if (dx > SWIPE_THRESHOLD) animateExit('right', onSwipeRight);
      else if (dx < -SWIPE_THRESHOLD) animateExit('left', onSwipeLeft);
      else {
        setDragX(0);
        setDragging(false);
        pointerId.current = null;
      }
    },
    [animateExit, onSwipeLeft, onSwipeRight],
  );

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled || busyRef.current || exiting || e.button !== 0) return;
    pointerId.current = e.pointerId;
    startX.current = e.clientX;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging || pointerId.current !== e.pointerId) return;
    setDragX(e.clientX - startX.current);
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== e.pointerId) return;
    finishDrag(dragXRef.current);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const rotate = swipeRotation(dragX);
  const likeOpacity =
    exiting === 'right' ? 1 : Math.min(1, Math.max(0, dragX / SWIPE_THRESHOLD));
  const passOpacity =
    exiting === 'left' ? 1 : Math.min(1, Math.max(0, -dragX / SWIPE_THRESHOLD));

  const triggerPass = useCallback(() => animateExit('left', onSwipeLeft), [animateExit, onSwipeLeft]);
  const triggerLike = useCallback(() => animateExit('right', onSwipeRight), [animateExit, onSwipeRight]);

  return {
    dragging,
    exiting,
    isBusy: Boolean(exiting) || busyRef.current,
    likeOpacity,
    passOpacity,
    shellStyle: {
      transform: `translateX(${dragX}px) rotate(${rotate}deg)`,
      transition: dragging
        ? 'none'
        : exiting
          ? `transform ${EXIT_ANIM_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
          : 'transform 0.3s ease-out',
    } as const,
    swipeHandlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp },
    triggerPass,
    triggerLike,
  };
}

function MatchSwipeOverlays({
  likeOpacity,
  passOpacity,
  likeLabel,
  passLabel,
}: {
  likeOpacity: number;
  passOpacity: number;
  likeLabel: string;
  passLabel: string;
}) {
  return (
    <>
      <div className={matchSwipeLikeOverlayClass} style={{ opacity: likeOpacity * 0.9 }} aria-hidden />
      <div className={matchSwipePassOverlayClass} style={{ opacity: passOpacity * 0.9 }} aria-hidden />
      <div
        className={matchSwipeLikeStampClass}
        style={swipeStampMotion(likeOpacity, -14)}
        aria-hidden={likeOpacity === 0}
      >
        <Heart size={22} strokeWidth={2.5} className="fill-current" aria-hidden />
        <span className={matchSwipeStampLabelClass}>{likeLabel}</span>
      </div>
      <div
        className={matchSwipePassStampClass}
        style={swipeStampMotion(passOpacity, 14)}
        aria-hidden={passOpacity === 0}
      >
        <X size={22} strokeWidth={3} aria-hidden />
        <span className={matchSwipeStampLabelClass}>{passLabel}</span>
      </div>
    </>
  );
}

const SCORE_RING_R = 28;

function MatchScoreRing({ score, label }: { score: number; label: string }) {
  const circumference = 2 * Math.PI * SCORE_RING_R;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex shrink-0 flex-col items-center gap-1.5">
      <div className="relative size-[4.75rem]" aria-hidden>
        <svg className="size-full -rotate-90" viewBox="0 0 64 64">
          <circle
            cx="32"
            cy="32"
            r={SCORE_RING_R}
            fill="none"
            strokeWidth="5"
            className={matchScoreRingTrackClass}
            stroke="currentColor"
          />
          <circle
            cx="32"
            cy="32"
            r={SCORE_RING_R}
            fill="none"
            strokeWidth="5"
            strokeLinecap="round"
            className={matchScoreRingValueClass}
            stroke={tokens.colors.primary}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-lg font-bold tabular-nums text-foreground">
          {score}%
        </span>
      </div>
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  );
}

function MatchDesktopPhotoGallery({
  pet,
  noPhotoLabel,
  className,
  swipeHandlers,
  dragging,
  likeOpacity,
  passOpacity,
  likeLabel,
  passLabel,
}: {
  pet: Pet;
  noPhotoLabel: string;
  className?: string;
  swipeHandlers: ReturnType<typeof useHorizontalSwipe>['swipeHandlers'];
  dragging: boolean;
  likeOpacity: number;
  passOpacity: number;
  likeLabel: string;
  passLabel: string;
}) {
  const { t } = useI18n();
  const c = t.match.card;
  const photos = useMemo(() => (pet.photos ?? []).filter((url) => url?.trim()), [pet.photos]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [pet.id]);

  const safeIndex = photos.length > 0 ? Math.min(index, photos.length - 1) : 0;
  const currentPhoto = photos[safeIndex];
  const showThumbStrip = photos.length > 0;

  return (
    <div className={cn(matchDesktopPhotoClass, className)}>
      <div
        className={cn(
          matchDesktopPhotoMainClass,
          dragging ? 'cursor-grabbing' : 'cursor-grab',
        )}
        {...swipeHandlers}
      >
        <MatchSwipeOverlays
          likeOpacity={likeOpacity}
          passOpacity={passOpacity}
          likeLabel={likeLabel}
          passLabel={passLabel}
        />
        {currentPhoto ? (
          <img src={currentPhoto} alt="" className={matchDesktopPhotoImgClass} draggable={false} />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">{noPhotoLabel}</div>
        )}

        {showThumbStrip ? (
          <div className={matchDesktopThumbStripClass}>
            <div className="flex justify-center gap-2 overflow-x-auto pb-0.5">
              {photos.map((url, photoIndex) => (
                <button
                  key={`${pet.id}-${photoIndex}`}
                  type="button"
                  onClick={() => setIndex(photoIndex)}
                  className={cn(
                    matchDesktopThumbClass,
                    photoIndex === safeIndex && matchDesktopThumbActiveClass,
                  )}
                  aria-label={c.photoOf
                    .replace('{n}', String(photoIndex + 1))
                    .replace('{total}', String(photos.length))}
                  aria-current={photoIndex === safeIndex ? 'true' : undefined}
                >
                  <img src={url} alt="" className="size-full object-cover object-center" draggable={false} />
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MatchPetDetailsBody({
  pet,
  match,
  detailItems,
  className,
}: {
  pet: Pet;
  match: MatchResult;
  detailItems: [string, string][];
  className?: string;
}) {
  return (
    <div className={cn('space-y-4', className)}>
      {match.reasons.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {match.reasons.map((r) => (
            <span key={r} className={matchReasonChipClass}>
              <Sparkles size={11} aria-hidden />
              {r}
            </span>
          ))}
        </div>
      )}

      {pet.description?.trim() ? (
        <p className="text-sm leading-relaxed text-foreground/90 lg:text-base lg:leading-7">{pet.description}</p>
      ) : null}

      <div className="grid grid-cols-2 gap-2 lg:gap-2.5">
        {detailItems.map(([label, value]) => (
          <div key={label} className="rounded-md border border-border/60 bg-muted/35 px-3 py-2 lg:px-3.5 lg:py-2.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      <ShelterPetTraits pet={pet} />
    </div>
  );
}

function MatchPetSummary({
  name,
  meta,
  pet,
  energy,
  activityLabel,
  compact,
}: {
  name: string;
  meta: string;
  pet: Pet;
  energy: string | null;
  activityLabel: string;
  compact?: boolean;
}) {
  return (
    <>
      <h2
        className={cn(
          'font-extrabold uppercase tracking-wide text-foreground',
          compact ? 'text-base leading-none' : 'text-xl leading-tight lg:text-2xl lg:normal-case lg:tracking-tight',
        )}
      >
        {name}
      </h2>
      <p className={cn('text-muted-foreground', compact ? 'mt-1 line-clamp-1 text-xs' : 'mt-1 text-sm')}>{meta}</p>
      {(pet.city || energy) && (
        <p className={cn('text-muted-foreground', compact ? 'mt-1 line-clamp-1 text-xs' : 'mt-2 text-sm')}>
          {pet.city ? (
            <span className="inline-flex items-center gap-1">
              <MapPin size={compact ? 11 : 14} className="shrink-0 text-primary" aria-hidden />
              {pet.city}
            </span>
          ) : null}
          {pet.city && energy ? <span className="mx-1.5 text-border">·</span> : null}
          {energy ? (
            <span>
              {activityLabel}: <span className="font-medium text-foreground">{energy}</span>
            </span>
          ) : null}
        </p>
      )}
    </>
  );
}

const MatchSwipeCardMobile = forwardRef<MatchSwipeCardHandle, MatchSwipeCardProps>(function MatchSwipeCardMobile(
  { pet, match, onSwipeLeft, onSwipeRight, className },
  ref,
) {
  const { c, s, name, meta, energy, detailItems } = useMatchPetDisplay(pet, match);
  const [sheetHeight, setSheetHeight] = useState(PEEK_FALLBACK);
  const [isSheetDragging, setIsSheetDragging] = useState(false);

  const startX = useRef(0);
  const shellRef = useRef<HTMLDivElement>(null);
  const peekMeasureRef = useRef<HTMLDivElement>(null);
  const sheetStartY = useRef(0);
  const sheetStartHeight = useRef(PEEK_FALLBACK);
  const peekHeightRef = useRef(PEEK_FALLBACK);
  const maxHeightRef = useRef(480);
  const sheetHeightRef = useRef(PEEK_FALLBACK);
  const headerDragPending = useRef(false);
  const sheetDragJustEnded = useRef(false);

  sheetHeightRef.current = sheetHeight;
  const isExpanded = sheetHeight > peekHeightRef.current + 24;
  const swipeDisabled = isExpanded || isSheetDragging;

  const { dragging, likeOpacity, passOpacity, shellStyle, swipeHandlers, triggerPass, triggerLike } =
    useHorizontalSwipe(onSwipeLeft, onSwipeRight, swipeDisabled, shellRef);

  useImperativeHandle(
    ref,
    () => ({
      pass: triggerPass,
      like: triggerLike,
    }),
    [triggerPass, triggerLike],
  );

  const updateHeights = useCallback(() => {
    const shell = shellRef.current;
    if (!shell) return;
    const shellH = shell.clientHeight;
    maxHeightRef.current = Math.max(220, Math.floor(shellH * MAX_EXPAND_RATIO));

    const measuredPeek = peekMeasureRef.current?.scrollHeight;
    const peekCap = Math.floor(shellH * PEEK_MAX_RATIO);
    const peek = Math.min(
      Math.max(PEEK_FALLBACK, measuredPeek ?? PEEK_FALLBACK),
      Math.max(PEEK_FALLBACK, peekCap),
    );
    const prevPeek = peekHeightRef.current;
    peekHeightRef.current = peek;

    setSheetHeight((h) => {
      if (h <= prevPeek + 20) return peek;
      return Math.min(h, maxHeightRef.current);
    });
  }, []);

  useLayoutEffect(() => {
    setSheetHeight(PEEK_FALLBACK);
    updateHeights();
    const shell = shellRef.current;
    if (!shell) return;
    const ro = new ResizeObserver(updateHeights);
    ro.observe(shell);
    return () => ro.disconnect();
  }, [updateHeights, pet.id]);

  const snapSheet = useCallback((currentH: number) => {
    const peek = peekHeightRef.current;
    const max = maxHeightRef.current;
    const mid = peek + (max - peek) * SNAP_EXPAND_RATIO;
    setSheetHeight(currentH >= mid ? max : peek);
  }, []);

  const onHandlePointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    sheetStartY.current = e.clientY;
    sheetStartHeight.current = sheetHeightRef.current;
    shellRef.current?.setPointerCapture(e.pointerId);
    setIsSheetDragging(true);
  }, []);

  const onSheetPointerMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (isSheetDragging) {
        e.preventDefault();
        const delta = sheetStartY.current - e.clientY;
        const next = Math.max(
          peekHeightRef.current,
          Math.min(maxHeightRef.current, sheetStartHeight.current + delta),
        );
        setSheetHeight(next);
        return;
      }

      if (headerDragPending.current && Math.abs(e.clientY - sheetStartY.current) > DRAG_THRESHOLD) {
        headerDragPending.current = false;
        e.preventDefault();
        sheetStartHeight.current = sheetHeightRef.current;
        sheetStartY.current = e.clientY;
        shellRef.current?.setPointerCapture(e.pointerId);
        setIsSheetDragging(true);
        const delta = sheetStartY.current - e.clientY;
        const next = Math.max(
          peekHeightRef.current,
          Math.min(maxHeightRef.current, sheetStartHeight.current + delta),
        );
        setSheetHeight(next);
      }
    },
    [isSheetDragging],
  );

  const onSheetPointerUp = useCallback(() => {
    headerDragPending.current = false;
    if (!isSheetDragging) return;
    setIsSheetDragging(false);
    sheetDragJustEnded.current = true;
    snapSheet(sheetHeightRef.current);
    requestAnimationFrame(() => {
      sheetDragJustEnded.current = false;
    });
  }, [isSheetDragging, snapSheet]);

  const onHeaderPointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    headerDragPending.current = true;
    sheetStartY.current = e.clientY;
    sheetStartHeight.current = sheetHeightRef.current;
    const cleanup = () => {
      headerDragPending.current = false;
    };
    document.addEventListener('pointerup', cleanup, { once: true });
    document.addEventListener('pointercancel', cleanup, { once: true });
  }, []);

  const onHandleTap = useCallback(() => {
    if (isSheetDragging || sheetDragJustEnded.current) return;
    const peek = peekHeightRef.current;
    const max = maxHeightRef.current;
    setSheetHeight(sheetHeightRef.current >= peek + (max - peek) * 0.35 ? peek : max);
  }, [isSheetDragging]);

  return (
    <div className={cn('relative h-full w-full min-w-0 touch-none select-none', className)} style={{ perspective: 1000 }}>
      <div
        ref={shellRef}
        className={cn(matchCardShellClass, dragging && 'cursor-grabbing')}
        style={shellStyle}
        onPointerMove={isSheetDragging ? onSheetPointerMove : undefined}
        onPointerUp={onSheetPointerUp}
        onPointerCancel={onSheetPointerUp}
      >
        <div
          className={cn(matchCardPhotoClass, !isExpanded && (dragging ? 'cursor-grabbing' : 'cursor-grab'))}
          style={{
            bottom: `${sheetHeight}px`,
            transition: isSheetDragging ? 'none' : 'bottom 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
          }}
          {...swipeHandlers}
        >
          <MatchSwipeOverlays
            likeOpacity={likeOpacity}
            passOpacity={passOpacity}
            likeLabel={c.likeStamp}
            passLabel={c.passStamp}
          />
          {pet.photos?.[0] ? (
            <img src={pet.photos[0]} alt="" className="size-full object-contain object-center" draggable={false} />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">{c.noPhoto}</div>
          )}
          <div className={cn(matchScoreBadgeClass, 'absolute right-3 top-3 z-10 shadow-lg')}>{match.score}%</div>
        </div>

        <div
          className={cn(matchCardBodyClass, isSheetDragging && 'transition-none')}
          style={{
            height: `${sheetHeight}px`,
            transition: isSheetDragging ? 'none' : 'height 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
          }}
        >
          <div ref={peekMeasureRef} className="shrink-0 touch-manipulation select-none">
            <div
              className="shrink-0 touch-none cursor-grab select-none active:cursor-grabbing"
              onPointerDown={onHandlePointerDown}
              onPointerMove={onSheetPointerMove}
              onPointerUp={onSheetPointerUp}
              onPointerCancel={onSheetPointerUp}
            >
              <button
                type="button"
                className="mx-auto flex w-full items-center justify-center px-4 pb-1 pt-2 sm:px-5"
                aria-expanded={isExpanded}
                aria-label={isExpanded ? c.collapseDetails : c.expandDetails}
                onClick={onHandleTap}
              >
                <span className="h-1 w-10 rounded-full bg-muted-foreground/40" />
              </button>
            </div>

            <div
              className="cursor-grab select-none px-4 pb-2 active:cursor-grabbing sm:px-5"
              onPointerDown={onHeaderPointerDown}
              onPointerMove={onSheetPointerMove}
            >
              <MatchPetSummary
                name={name}
                meta={meta}
                pet={pet}
                energy={energy}
                activityLabel={s.activity}
                compact
              />
            </div>
          </div>

          <div
            className={cn(
              'min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 sm:px-5 sm:pb-5',
              isSheetDragging && 'pointer-events-none',
              !isExpanded && 'pointer-events-none opacity-0',
            )}
            aria-hidden={!isExpanded}
          >
            <div className="space-y-3 border-t border-border/70 pt-3">
              <MatchPetDetailsBody pet={pet} match={match} detailItems={detailItems} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const MatchSwipeCardDesktop = forwardRef<MatchSwipeCardHandle, MatchSwipeCardProps>(function MatchSwipeCardDesktop(
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

export const MatchSwipeCard = forwardRef<MatchSwipeCardHandle, MatchSwipeCardProps>(function MatchSwipeCard(
  props,
  ref,
) {
  const mobileRef = useRef<MatchSwipeCardHandle>(null);
  const desktopRef = useRef<MatchSwipeCardHandle>(null);

  useImperativeHandle(
    ref,
    () => ({
      pass: () => {
        if (typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches) {
          desktopRef.current?.pass();
        } else {
          mobileRef.current?.pass();
        }
      },
      like: () => {
        if (typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches) {
          desktopRef.current?.like();
        } else {
          mobileRef.current?.like();
        }
      },
    }),
    [],
  );

  return (
    <>
      <MatchSwipeCardMobile {...props} ref={mobileRef} className={cn(props.className, 'lg:hidden')} />
      <MatchSwipeCardDesktop {...props} ref={desktopRef} className={cn(props.className, 'hidden lg:block')} />
    </>
  );
});
