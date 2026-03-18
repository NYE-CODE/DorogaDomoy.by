import { useState, useRef, useCallback, useEffect } from 'react';

/** Свёрнутая высота: полка + ручка + заголовок списка */
const HEADER_HEIGHT = 96;
const SNAP_THRESHOLD = 0.4; // если высота > 40% экрана — раскрыть
/** Fallback отступ сверху, если измерение недоступно */
const SITE_HEADER_SAFE_FALLBACK = 170;
/** Высота полки над ручкой — чтобы при раскрытии ручка не пряталась под шапкой (компактно) */
const HANDLE_SPACER = 16;
/** Порог движения (px), после которого считаем жест драгом, а не тапом */
const DRAG_THRESHOLD = 10;

interface MobileListSheetProps {
  header: React.ReactNode;
  children: React.ReactNode;
}

export function MobileListSheet({ header, children }: MobileListSheetProps) {
  const [height, setHeight] = useState(HEADER_HEIGHT);
  const [isDragging, setIsDragging] = useState(false);
  const [headerSafeTop, setHeaderSafeTop] = useState(SITE_HEADER_SAFE_FALLBACK);
  const startYRef = useRef(0);
  const startHeightRef = useRef(HEADER_HEIGHT);
  const maxHeightRef = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const dragZoneRef = useRef<HTMLDivElement>(null);
  const heightRef = useRef(HEADER_HEIGHT);
  const pointerDownOnHeaderRef = useRef(false);
  heightRef.current = height;

  const updateMaxHeight = useCallback(() => {
    const el = rootRef.current?.parentElement;
    if (el && typeof window !== 'undefined') {
      const rect = el.getBoundingClientRect();
      const top = Math.ceil(rect.top) + 8;
      const max = Math.max(200, Math.floor(window.innerHeight - top));
      maxHeightRef.current = max;
      setHeaderSafeTop(top);
    } else {
      maxHeightRef.current = Math.max(200, Math.floor(window.innerHeight - SITE_HEADER_SAFE_FALLBACK));
      setHeaderSafeTop(SITE_HEADER_SAFE_FALLBACK);
    }
  }, []);

  useEffect(() => {
    updateMaxHeight();
    const ro = new ResizeObserver(updateMaxHeight);
    const el = rootRef.current?.parentElement;
    if (el) ro.observe(el);
    window.addEventListener('resize', updateMaxHeight);
    return () => {
      if (el) ro.unobserve(el);
      window.removeEventListener('resize', updateMaxHeight);
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
            HEADER_HEIGHT,
            Math.min(maxHeightRef.current, startHeightRef.current + delta)
          );
          setHeight(newHeight);
        }
        return;
      }
      e.preventDefault();
      const delta = startYRef.current - e.clientY;
      const newHeight = Math.max(
        HEADER_HEIGHT,
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
    if (currentH > maxH * SNAP_THRESHOLD) {
      setHeight(maxH);
    } else {
      setHeight(HEADER_HEIGHT);
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
      className="absolute inset-x-0 bottom-0 z-30 flex flex-col bg-card border-t border-gray-200 dark:border-gray-700 rounded-t-2xl shadow-lg overflow-hidden"
      style={{ height: `${height}px`, maxHeight: `calc(100vh - ${headerSafeTop}px)` }}
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
