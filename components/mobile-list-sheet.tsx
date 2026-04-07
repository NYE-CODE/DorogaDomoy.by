import { useState, useRef, useCallback, useLayoutEffect } from 'react';

/** Минимальная высота: ручка + заголовок (можно опустить вниз) */
const COLLAPSED_HEIGHT = 96;
/** Высота по умолчанию: ручка + заголовок + первое объявление */
const PEEK_HEIGHT = 320;
const SNAP_THRESHOLD_FULL = 0.6; // если > 60% экрана — раскрыть на полную
const SNAP_THRESHOLD_PEEK = 0.25; // если < 25% экрана — свернуть до минимума
/** Fallback отступ сверху, если измерение недоступно */
const SITE_HEADER_SAFE_FALLBACK = 170;
/** Запас снизу, если элемент навигации ещё не в DOM (≈ h-16 + safe area) */
const BOTTOM_NAV_FALLBACK_PX = 96;
/** Высота полки над ручкой — чтобы при раскрытии ручка не пряталась под шапкой (компактно) */
const HANDLE_SPACER = 16;
/** Порог движения (px), после которого считаем жест драгом, а не тапом */
const DRAG_THRESHOLD = 10;

interface MobileListSheetProps {
  header: React.ReactNode;
  children: React.ReactNode;
}

function measureBottomNavReserve(): number {
  if (typeof window === 'undefined') return 0;
  const nav = document.getElementById('mobile-bottom-nav');
  if (!nav) return BOTTOM_NAV_FALLBACK_PX;
  const top = nav.getBoundingClientRect().top;
  return Math.max(0, Math.ceil(window.innerHeight - top));
}

export function MobileListSheet({ header, children }: MobileListSheetProps) {
  const [height, setHeight] = useState(PEEK_HEIGHT);
  const [isDragging, setIsDragging] = useState(false);
  const [headerSafeTop, setHeaderSafeTop] = useState(SITE_HEADER_SAFE_FALLBACK);
  const [bottomReserve, setBottomReserve] = useState(0);
  const startYRef = useRef(0);
  const startHeightRef = useRef(PEEK_HEIGHT);
  const maxHeightRef = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const dragZoneRef = useRef<HTMLDivElement>(null);
  const heightRef = useRef(PEEK_HEIGHT);
  const pointerDownOnHeaderRef = useRef(false);
  heightRef.current = height;

  const updateMaxHeight = useCallback(() => {
    const reserve = measureBottomNavReserve();
    setBottomReserve(reserve);
    const el = rootRef.current?.parentElement;
    if (el && typeof window !== 'undefined') {
      const rect = el.getBoundingClientRect();
      const top = Math.ceil(rect.top) + 8;
      const max = Math.max(200, Math.floor(window.innerHeight - top - reserve));
      maxHeightRef.current = max;
      setHeaderSafeTop(top);
    } else {
      maxHeightRef.current = Math.max(
        200,
        Math.floor(window.innerHeight - SITE_HEADER_SAFE_FALLBACK - reserve)
      );
      setHeaderSafeTop(SITE_HEADER_SAFE_FALLBACK);
    }
    setHeight((h) => Math.max(COLLAPSED_HEIGHT, Math.min(h, maxHeightRef.current)));
  }, []);

  useLayoutEffect(() => {
    updateMaxHeight();
    const ro = new ResizeObserver(updateMaxHeight);
    const el = rootRef.current?.parentElement;
    if (el) ro.observe(el);
    window.addEventListener('resize', updateMaxHeight);
    const nav = typeof document !== 'undefined' ? document.getElementById('mobile-bottom-nav') : null;
    let navRo: ResizeObserver | null = null;
    if (nav) {
      navRo = new ResizeObserver(updateMaxHeight);
      navRo.observe(nav);
    }
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    vv?.addEventListener('resize', updateMaxHeight);
    return () => {
      if (el) ro.unobserve(el);
      window.removeEventListener('resize', updateMaxHeight);
      navRo?.disconnect();
      vv?.removeEventListener('resize', updateMaxHeight);
    };
  }, [updateMaxHeight]);

  const handleHandlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      startYRef.current = e.clientY;
      startHeightRef.current = heightRef.current;
      rootRef.current?.setPointerCapture?.(e.pointerId);
      setIsDragging(true);
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) {
        if (
          pointerDownOnHeaderRef.current &&
          Math.abs(e.clientY - startYRef.current) > DRAG_THRESHOLD
        ) {
          pointerDownOnHeaderRef.current = false;
          e.preventDefault();
          startHeightRef.current = heightRef.current;
          startYRef.current = e.clientY;
          rootRef.current?.setPointerCapture?.(e.pointerId);
          setIsDragging(true);
          const delta = startYRef.current - e.clientY;
          const newHeight = Math.max(
            COLLAPSED_HEIGHT,
            Math.min(maxHeightRef.current, startHeightRef.current + delta)
          );
          setHeight(newHeight);
        }
        return;
      }
      e.preventDefault();
      const delta = startYRef.current - e.clientY;
      const newHeight = Math.max(
        COLLAPSED_HEIGHT,
        Math.min(maxHeightRef.current, startHeightRef.current + delta)
      );
      setHeight(newHeight);
    },
    [isDragging]
  );

  const handlePointerUp = useCallback(() => {
    pointerDownOnHeaderRef.current = false;
    if (!isDragging) return;
    setIsDragging(false);
    const maxH = maxHeightRef.current;
    const currentH = heightRef.current;
    if (currentH > maxH * SNAP_THRESHOLD_FULL) {
      setHeight(maxH);
    } else if (currentH < maxH * SNAP_THRESHOLD_PEEK) {
      setHeight(COLLAPSED_HEIGHT);
    } else {
      setHeight(PEEK_HEIGHT);
    }
  }, [isDragging]);

  const handleHeaderPointerDown = useCallback((e: React.PointerEvent) => {
    pointerDownOnHeaderRef.current = true;
    startYRef.current = e.clientY;
    startHeightRef.current = heightRef.current;
    const cleanup = () => {
      pointerDownOnHeaderRef.current = false;
      document.removeEventListener('pointerup', cleanup);
      document.removeEventListener('pointercancel', cleanup);
    };
    document.addEventListener('pointerup', cleanup, { once: true });
    document.addEventListener('pointercancel', cleanup, { once: true });
  }, []);

  return (
    <div
      ref={rootRef}
      className="absolute inset-x-0 z-30 flex flex-col bg-card border-t border-gray-200 dark:border-gray-700 rounded-t-2xl shadow-lg overflow-hidden"
      style={{
        height: `${height}px`,
        bottom: bottomReserve || 0,
        maxHeight:
          bottomReserve > 0
            ? `calc(100vh - ${headerSafeTop}px - ${bottomReserve}px)`
            : `calc(100vh - ${headerSafeTop}px)`,
      }}
      onPointerMove={isDragging ? handlePointerMove : undefined}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div
        ref={dragZoneRef}
        className="shrink-0 touch-none select-none cursor-grab active:cursor-grabbing flex flex-col"
        onPointerDown={handleHandlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="shrink-0 w-full" style={{ height: HANDLE_SPACER }} aria-hidden />
        <div className="shrink-0 pb-1 flex justify-center">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" aria-hidden />
        </div>
      </div>
      <div
        className="shrink-0 overflow-hidden cursor-grab active:cursor-grabbing select-none touch-manipulation"
        onPointerDown={handleHeaderPointerDown}
        onPointerMove={handlePointerMove}
      >
        {header}
      </div>
      <div
        className={`flex-1 min-h-0 overflow-y-auto overscroll-contain ${isDragging ? 'pointer-events-none' : ''}`}
      >
        {children}
      </div>
    </div>
  );
}
