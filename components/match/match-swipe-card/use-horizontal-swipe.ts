import { useState, useRef, useCallback, useEffect, type PointerEvent, type RefObject } from 'react';
import {
  EXIT_ANIM_MS,
  EXIT_DISTANCE_RATIO,
  SWIPE_THRESHOLD,
} from './match-swipe-constants';
import { swipeRotation } from './match-swipe-motion';

export interface HorizontalSwipeHandlers {
  onPointerDown: (e: PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: PointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (e: PointerEvent<HTMLDivElement>) => void;
}

export function useHorizontalSwipe(
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
