import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
} from 'react';
import {
  matchCardBodyClass,
  matchCardPhotoClass,
  matchCardShellClass,
  matchScoreBadgeClass,
} from '@/shared/styles/match-styles';
import { cn } from '../../ui/utils';
import { MatchPetDetailsBody } from './match-pet-details-body';
import { MatchPetSummary } from './match-pet-summary';
import {
  DRAG_THRESHOLD,
  MAX_EXPAND_RATIO,
  PEEK_FALLBACK,
  PEEK_MAX_RATIO,
  SNAP_EXPAND_RATIO,
} from './match-swipe-constants';
import { MatchSwipeOverlays } from './match-swipe-overlays';
import type { MatchSwipeCardHandle, MatchSwipeCardProps } from './match-swipe-card-types';
import { useHorizontalSwipe } from './use-horizontal-swipe';
import { useMatchPetDisplay } from './use-match-pet-display';

export const MatchSwipeCardMobile = forwardRef<MatchSwipeCardHandle, MatchSwipeCardProps>(function MatchSwipeCardMobile(
  { pet, match, onSwipeLeft, onSwipeRight, className },
  ref,
) {
  const { c, s, name, meta, energy, detailItems } = useMatchPetDisplay(pet, match);
  const [sheetHeight, setSheetHeight] = useState(PEEK_FALLBACK);
  const [isSheetDragging, setIsSheetDragging] = useState(false);

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
