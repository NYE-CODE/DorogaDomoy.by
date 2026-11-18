import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { Link } from 'react-router';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { displayPhotoUrl, type UploadDisplayWidth } from '@/shared/lib/display-photo-url';
import { cn } from './ui/utils';

const SWIPE_LOCK_PX = 10;
const SWIPE_COMMIT_PX = 48;

export interface CardPhotoGalleryProps {
  photos?: string[];
  alt: string;
  className?: string;
  fallback?: ReactNode;
  photoWidth?: UploadDisplayWidth;
  /** Нижний градиент, как у компактной карточки объявления. */
  scrim?: boolean;
  /** Фото — отдельная ссылка. Стрелки и точки остаются снаружи неё. */
  linkTo?: string;
  onNavigate?: () => void;
  /** Сдвинуть индикатор от правого нижнего угла, где стоит «в избранное». */
  reserveEndCorner?: boolean;
}

export function CardPhotoGallery({
  photos = [],
  alt,
  className,
  fallback = null,
  photoWidth = 640,
  scrim = false,
  linkTo,
  onNavigate,
  reserveEndCorner = true,
}: CardPhotoGalleryProps) {
  const { t } = useI18n();
  const slides = photos.filter((src) => typeof src === 'string' && src.length > 0);
  const signature = slides.join('\u0001');

  const frameRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(0);
  const offsetRef = useRef(0);
  const reducedRef = useRef(false);
  const suppressClick = useRef(false);
  const rafRef = useRef(0);
  const dragRef = useRef({
    x: 0,
    y: 0,
    pointerId: -1,
    active: false,
    axis: null as 'x' | 'y' | null,
  });

  const [index, setIndex] = useState(0);
  const [signatureSeen, setSignatureSeen] = useState(signature);
  const [frameWidth, setFrameWidth] = useState(0);
  const [canHover, setCanHover] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches,
  );

  if (signature !== signatureSeen) {
    setSignatureSeen(signature);
    setIndex(0);
    indexRef.current = 0;
    offsetRef.current = 0;
  }

  const activeIndex =
    signature !== signatureSeen ? 0 : Math.min(index, Math.max(0, slides.length - 1));
  indexRef.current = activeIndex;

  const place = (animate: boolean) => {
    const track = trackRef.current;
    const frame = frameRef.current;
    if (!track || !frame) return;
    const width = frame.clientWidth;
    track.style.transition =
      animate && !reducedRef.current
        ? 'transform var(--duration-slow) var(--ease-default)'
        : 'none';
    track.style.transform = `translate3d(${-indexRef.current * width + offsetRef.current}px, 0, 0)`;
  };

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const hover = window.matchMedia('(hover: hover) and (pointer: fine)');
    const sync = () => {
      reducedRef.current = motion.matches;
      setCanHover(hover.matches);
    };
    sync();
    motion.addEventListener('change', sync);
    hover.addEventListener('change', sync);
    return () => {
      cancelAnimationFrame(rafRef.current);
      motion.removeEventListener('change', sync);
      hover.removeEventListener('change', sync);
    };
  }, []);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame || slides.length < 2) return;
    const update = () => {
      const width = frame.clientWidth;
      setFrameWidth((prev) => (prev === width ? prev : width));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [slides.length]);

  useLayoutEffect(() => {
    if (slides.length < 2) return;
    offsetRef.current = 0;
    place(false);
    // Снап только при смене кадра или набора фото. Сдвиг индекса анимирует place(true)
    // и не должен сбрасываться здесь — иначе переход обнуляется до отрисовки.
  }, [frameWidth, signature, slides.length]);

  const commitIndex = (next: number) => {
    const clamped = Math.max(0, Math.min(slides.length - 1, next));
    indexRef.current = clamped;
    offsetRef.current = 0;
    place(true);
    setIndex(clamped);
  };

  const finishDrag = (clientX: number, pointerId: number) => {
    const drag = dragRef.current;
    if (!drag.active || drag.pointerId !== pointerId) return;
    const dx = clientX - drag.x;
    const horizontal = drag.axis === 'x';
    drag.active = false;
    drag.axis = null;
    if (frameRef.current?.hasPointerCapture(pointerId)) {
      frameRef.current.releasePointerCapture(pointerId);
    }
    if (!horizontal) {
      offsetRef.current = 0;
      place(false);
      return;
    }

    suppressClick.current = true;
    const width = frameRef.current?.clientWidth ?? 1;
    const threshold = Math.min(SWIPE_COMMIT_PX, width * 0.18);
    let next = indexRef.current;
    if (dx <= -threshold) next += 1;
    else if (dx >= threshold) next -= 1;

    place(true);
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      commitIndex(next);
    });
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (slides.length < 2 || event.button !== 0) return;
    if ((event.target as HTMLElement).closest('button')) return;
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
      active: true,
      axis: null,
    };
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.axis) {
      if (Math.abs(dx) < SWIPE_LOCK_PX && Math.abs(dy) < SWIPE_LOCK_PX) return;
      drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (drag.axis === 'y') {
        drag.active = false;
        return;
      }
      frameRef.current?.setPointerCapture(event.pointerId);
    }
    if (drag.axis !== 'x') return;
    const atStart = indexRef.current === 0 && dx > 0;
    const atEnd = indexRef.current === slides.length - 1 && dx < 0;
    offsetRef.current = atStart || atEnd ? dx * 0.35 : dx;
    place(false);
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    finishDrag(event.clientX, event.pointerId);
  };

  const onFrameClick = (event: MouseEvent<HTMLElement>) => {
    if (!suppressClick.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClick.current = false;
  };

  const altText =
    slides.length > 1
      ? `${alt} — ${t.common.photoN.replace('{n}', String(activeIndex + 1))}`
      : alt;

  const image = slides[0] ? (
    <img
      src={displayPhotoUrl(slides[0], photoWidth)}
      alt={altText}
      draggable={false}
      loading="lazy"
      decoding="async"
      className="size-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
    />
  ) : (
    <div className="flex size-full items-center justify-center">{fallback}</div>
  );

  if (slides.length < 2) {
    return (
      <div className={cn('overflow-hidden', className)}>
        {linkTo ? (
          <Link
            to={linkTo}
            tabIndex={-1}
            aria-hidden
            onClick={(event) => {
              onFrameClick(event);
              if (!event.defaultPrevented) onNavigate?.();
            }}
            className="block size-full"
          >
            {image}
          </Link>
        ) : (
          image
        )}
      </div>
    );
  }

  const slideWidth = frameWidth > 0 ? frameWidth : undefined;

  return (
    <div
      ref={frameRef}
      role="group"
      aria-label={alt}
      className={cn('relative touch-pan-y overflow-hidden select-none', className)}
      onClick={onFrameClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {linkTo ? (
        <Link
          to={linkTo}
          tabIndex={-1}
          aria-hidden
          draggable={false}
          onClick={(event) => {
            onFrameClick(event);
            if (!event.defaultPrevented) onNavigate?.();
          }}
          className="block size-full"
        >
          <Track
            trackRef={trackRef}
            slides={slides}
            activeIndex={activeIndex}
            altText={altText}
            photoWidth={photoWidth}
            slideWidth={slideWidth}
          />
        </Link>
      ) : (
        <Track
          trackRef={trackRef}
          slides={slides}
          activeIndex={activeIndex}
          altText={altText}
          photoWidth={photoWidth}
          slideWidth={slideWidth}
        />
      )}

      {scrim ? (
        <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      ) : null}

      {activeIndex > 0 ? (
        <ArrowButton
          side="prev"
          label={t.common.photoPrev}
          revealed={!canHover}
          onPress={() => commitIndex(activeIndex - 1)}
        />
      ) : null}
      {activeIndex < slides.length - 1 ? (
        <ArrowButton
          side="next"
          label={t.common.photoNext}
          revealed={!canHover}
          onPress={() => commitIndex(activeIndex + 1)}
        />
      ) : null}

      <div
        className={cn(
          'pointer-events-none absolute bottom-0 z-[6] flex h-11 items-center justify-center',
          reserveEndCorner ? 'left-2 right-14' : 'inset-x-2',
        )}
      >
        {slides.length <= 8 ? (
          <div className="relative flex max-w-full items-center">
            <div className="absolute inset-x-0 top-1/2 h-4 -translate-y-1/2 rounded-full bg-landing-dark/75" />
            {slides.map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                aria-label={t.common.photoN.replace('{n}', String(i + 1))}
                aria-current={i === activeIndex ? 'true' : undefined}
                onPointerDown={(event) => event.stopPropagation()}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') event.stopPropagation();
                }}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  commitIndex(i);
                }}
                className="pointer-events-auto flex h-11 w-6 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span
                  className={cn(
                    'h-1.5 rounded-full bg-on-landing-dark transition-[width,opacity] duration-200',
                    i === activeIndex ? 'w-3.5 opacity-100' : 'w-1.5 opacity-50',
                  )}
                />
              </button>
            ))}
          </div>
        ) : (
          <span className="rounded-full bg-landing-dark/75 px-2.5 py-1 text-xs font-medium tabular-nums text-on-landing-dark">
            {activeIndex + 1} / {slides.length}
          </span>
        )}
      </div>

      <span className="sr-only" aria-live="polite">
        {altText}
      </span>
    </div>
  );
}

function Track({
  trackRef,
  slides,
  activeIndex,
  altText,
  photoWidth,
  slideWidth,
}: {
  trackRef: RefObject<HTMLDivElement | null>;
  slides: string[];
  activeIndex: number;
  altText: string;
  photoWidth: UploadDisplayWidth;
  slideWidth: number | undefined;
}) {
  return (
    <div
      ref={trackRef}
      className="flex h-full"
      style={{ width: slideWidth ? slideWidth * slides.length : '100%' }}
    >
      {slides.map((src, i) => {
        const near = Math.abs(i - activeIndex) <= 1;
        return (
          <div
            key={`${src}-${i}`}
            className="h-full shrink-0"
            style={{ width: slideWidth ?? '100%' }}
            aria-hidden={i === activeIndex ? undefined : true}
          >
            {near ? (
              <img
                src={displayPhotoUrl(src, photoWidth)}
                alt={i === activeIndex ? altText : ''}
                draggable={false}
                loading={i === activeIndex ? 'eager' : 'lazy'}
                decoding="async"
                className="pointer-events-none size-full object-cover object-center"
              />
            ) : (
              <div className="size-full bg-landing-muted" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ArrowButton({
  side,
  label,
  revealed,
  onPress,
}: {
  side: 'prev' | 'next';
  label: string;
  /** На тач-экране стрелка видна сразу: наведения нет, свайп неочевиден без знака. */
  revealed: boolean;
  onPress: () => void;
}) {
  const Icon = side === 'prev' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={label}
      tabIndex={revealed ? 0 : -1}
      onPointerDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') event.stopPropagation();
      }}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onPress();
      }}
      className={cn(
        'absolute top-1/2 z-[6] flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-landing-dark/75 text-on-landing-dark shadow-lg',
        'transition-opacity duration-200 hover:bg-landing-dark/90',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        revealed
          ? 'pointer-events-auto opacity-100'
          : 'pointer-events-none opacity-0 focus-visible:pointer-events-auto focus-visible:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100',
        side === 'prev' ? 'left-2' : 'right-2',
      )}
    >
      <Icon className="size-5" aria-hidden />
    </button>
  );
}
