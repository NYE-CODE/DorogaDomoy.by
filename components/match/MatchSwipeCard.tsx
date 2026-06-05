import { useRef, useState, useCallback, useLayoutEffect, type PointerEvent } from 'react';
import { Heart, MapPin, Sparkles, X } from 'lucide-react';
import type { Pet } from '../../types/pet';
import type { MatchResult } from '../../utils/pet-match';
import { petEnergyHint } from '../../utils/pet-match';
import { buildTraitScales } from '../../utils/pet-traits';
import { cn } from '../ui/utils';
import { ShelterPetTraits } from '../ShelterPetTraits';
import { useI18n } from '../../context/I18nContext';
import {
  matchCardBodyClass,
  matchCardPhotoClass,
  matchCardShellClass,
  matchReasonChipClass,
  matchScoreBadgeClass,
  matchSwipeLikeOverlayClass,
  matchSwipeLikeStampClass,
  matchSwipePassOverlayClass,
  matchSwipePassStampClass,
  matchSwipeStampLabelClass,
} from '../../styles/match-styles';

const SWIPE_THRESHOLD = 80;
const DRAG_THRESHOLD = 10;
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

interface MatchSwipeCardProps {
  pet: Pet;
  match: MatchResult;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  className?: string;
}

export function MatchSwipeCard({ pet, match, onSwipeLeft, onSwipeRight, className }: MatchSwipeCardProps) {
  const { t } = useI18n();
  const c = t.match.card;
  const s = t.match.swipe;
  const traitScales = buildTraitScales(t.petTraits);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [sheetHeight, setSheetHeight] = useState(PEEK_FALLBACK);
  const [isSheetDragging, setIsSheetDragging] = useState(false);

  const startX = useRef(0);
  const pointerId = useRef<number | null>(null);
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

  const name = pet.name?.trim() || pet.breed || c.defaultName;
  const breed = pet.breed?.trim();
  const age = pet.approximateAge?.trim();
  const meta = [breed, age].filter(Boolean).join(' · ') || '—';
  const energy = petEnergyHint(pet, traitScales);
  const rotate = dragX * 0.04;
  const likeOpacity = Math.min(1, Math.max(0, dragX / SWIPE_THRESHOLD));
  const passOpacity = Math.min(1, Math.max(0, -dragX / SWIPE_THRESHOLD));
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
  const detailItems = [
    [c.detailAge, age || c.notSpecified],
    [c.detailGender, genderLabel[pet.gender] ?? c.notSpecified],
    [
      c.detailHealth,
      pet.healthStatus ? healthLabel[pet.healthStatus] ?? pet.healthStatus : c.notSpecifiedNeuter,
    ],
    [c.detailCity, pet.city || c.notSpecified],
  ];

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

  const finishDrag = (dx: number) => {
    if (dx > SWIPE_THRESHOLD) onSwipeRight();
    else if (dx < -SWIPE_THRESHOLD) onSwipeLeft();
    setDragX(0);
    setDragging(false);
    pointerId.current = null;
  };

  const onPhotoPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (isExpanded || isSheetDragging) return;
    if (e.button !== 0) return;
    pointerId.current = e.pointerId;
    startX.current = e.clientX;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPhotoPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging || pointerId.current !== e.pointerId) return;
    setDragX(e.clientX - startX.current);
  };

  const onPhotoPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== e.pointerId) return;
    finishDrag(dragX);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

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

      if (
        headerDragPending.current &&
        Math.abs(e.clientY - sheetStartY.current) > DRAG_THRESHOLD
      ) {
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
        style={{
          transform: `translateX(${dragX}px) rotate(${rotate}deg)`,
          transition: dragging ? 'none' : 'transform 0.25s ease-out',
        }}
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
          onPointerDown={onPhotoPointerDown}
          onPointerMove={onPhotoPointerMove}
          onPointerUp={onPhotoPointerUp}
          onPointerCancel={onPhotoPointerUp}
        >
          <div
            className={matchSwipeLikeOverlayClass}
            style={{ opacity: likeOpacity * 0.9 }}
            aria-hidden
          />
          <div
            className={matchSwipePassOverlayClass}
            style={{ opacity: passOpacity * 0.9 }}
            aria-hidden
          />

          <div
            className={matchSwipeLikeStampClass}
            style={swipeStampMotion(likeOpacity, -14)}
            aria-hidden={likeOpacity === 0}
          >
            <Heart size={22} strokeWidth={2.5} className="fill-current" aria-hidden />
            <span className={matchSwipeStampLabelClass}>{c.likeStamp}</span>
          </div>
          <div
            className={matchSwipePassStampClass}
            style={swipeStampMotion(passOpacity, 14)}
            aria-hidden={passOpacity === 0}
          >
            <X size={22} strokeWidth={3} aria-hidden />
            <span className={matchSwipeStampLabelClass}>{c.passStamp}</span>
          </div>

          {pet.photos?.[0] ? (
            <img
              src={pet.photos[0]}
              alt=""
              className="size-full object-contain object-center"
              draggable={false}
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">{c.noPhoto}</div>
          )}

          <div className={cn(matchScoreBadgeClass, 'absolute right-3 top-3 z-10 shadow-lg')}>
            {match.score}%
          </div>
        </div>

        <div
          className={cn(matchCardBodyClass, isSheetDragging && 'transition-none')}
          style={{
            height: `${sheetHeight}px`,
            transition: isSheetDragging ? 'none' : 'height 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
          }}
        >
          <div
            ref={peekMeasureRef}
            className="shrink-0 touch-manipulation select-none"
          >
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
              <h2 className="text-base font-extrabold uppercase leading-none tracking-wide text-foreground">
                {name}
              </h2>
              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{meta}</p>

              {(pet.city || energy) && (
                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                  {pet.city ? (
                    <span className="inline-flex items-center gap-0.5">
                      <MapPin size={11} className="shrink-0 text-[#FF9800]" aria-hidden />
                      {pet.city}
                    </span>
                  ) : null}
                  {pet.city && energy ? <span className="mx-1.5 text-border">·</span> : null}
                  {energy ? (
                    <span>
                      {s.activity}: <span className="font-medium text-foreground">{energy}</span>
                    </span>
                  ) : null}
                </p>
              )}
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
                <p className="text-sm leading-relaxed text-foreground/90">{pet.description}</p>
              ) : null}

              <div className="grid grid-cols-2 gap-2">
                {detailItems.map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-border/60 bg-muted/35 px-3 py-2">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
                  </div>
                ))}
              </div>
              <ShelterPetTraits pet={pet} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
