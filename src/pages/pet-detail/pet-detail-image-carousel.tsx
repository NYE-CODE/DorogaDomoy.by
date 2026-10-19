import { useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { useI18n } from '@/app/providers/I18nContext';
import { cn } from '@/shared/ui/utils';

export function ImageCarousel({
  photos,
  alt,
  overlay,
}: {
  photos: string[];
  alt: string;
  overlay?: ReactNode;
}) {
  const { t } = useI18n();
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (photos.length === 0) return null;

  const goTo = (index: number) => {
    setCurrent((index + photos.length) % photos.length);
  };

  const mainSrc = photos[current];
  const altText =
    photos.length > 1
      ? `${alt} — ${t.common.photoN.replace('{n}', String(current + 1))}`
      : alt;

  return (
    <>
      <div className="relative aspect-[4/3] overflow-hidden bg-landing-muted">
        <img
          src={mainSrc}
          alt={altText}
          className="h-full w-full object-cover"
        />
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(current - 1)}
              className="absolute left-3 top-1/2 z-[5] flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-landing-dark/45 text-on-landing-dark shadow-lg backdrop-blur-sm transition-colors hover:bg-landing-dark/65 sm:left-4"
              aria-label={t.common.photoPrev}
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => goTo(current + 1)}
              className="absolute right-3 top-1/2 z-[5] flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-landing-dark/45 text-on-landing-dark shadow-lg backdrop-blur-sm transition-colors hover:bg-landing-dark/65 sm:right-4"
              aria-label={t.common.photoNext}
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => setLightbox(true)}
          className="absolute bottom-3 right-3 z-[5] flex size-11 items-center justify-center rounded-full border border-white/25 bg-landing-dark/45 text-on-landing-dark shadow-lg backdrop-blur-sm transition-colors hover:bg-landing-dark/65 sm:bottom-4 sm:right-4"
          aria-label={t.petDetail.openFullscreen}
        >
          <Maximize2 className="size-4" aria-hidden />
        </button>
        {overlay != null ? (
          <div className="pointer-events-none absolute inset-0 z-[12]">
            <div className="pointer-events-auto absolute bottom-3 left-3 sm:bottom-4 sm:left-4">
              {overlay}
            </div>
          </div>
        ) : null}
      </div>

      {photos.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto p-3 sm:gap-3 sm:p-4">
          {photos.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              className={cn(
                'h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-xl border-2 transition-colors sm:h-20 sm:w-20',
                i === current
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-transparent ring-1 ring-border hover:border-muted-foreground/25',
              )}
              aria-label={t.common.photoN.replace('{n}', String(i + 1))}
              aria-current={i === current ? 'true' : undefined}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {lightbox ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-landing-dark/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={altText}
          onClick={() => setLightbox(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setLightbox(false);
          }}
        >
          <img
            src={mainSrc}
            alt={altText}
            className="max-h-[90vh] max-w-full rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </>
  );
}
