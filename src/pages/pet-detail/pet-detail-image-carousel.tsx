import { useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [current, setCurrent] = useState(0);
  if (photos.length === 0) return null;
  const goTo = (index: number) => {
    setCurrent((index + photos.length) % photos.length);
  };
  return (
    <>
      <div className="relative aspect-[4/3] bg-black">
        <img
          src={photos[current]}
          alt={photos.length > 1 ? `${alt} — фото ${current + 1}` : alt}
          className="w-full h-full object-contain"
        />
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => goTo(current - 1)}
                  className="absolute left-3 top-1/2 z-[5] flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/35 text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-black/50 sm:left-4"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={() => goTo(current + 1)}
                  className="absolute right-3 top-1/2 z-[5] flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/35 text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-black/50 sm:right-4"
                  aria-label="Next photo"
                >
                  <ChevronRight className="size-5" />
                </button>
                <div className="absolute bottom-4 left-1/2 z-[5] flex -translate-x-1/2 gap-2">
                  {photos.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCurrent(i)}
                      className={cn(
                        'h-2 rounded-full transition-all',
                        i === current ? 'w-7 bg-primary shadow-sm' : 'w-2 bg-white/55 hover:bg-white/85',
                      )}
                      aria-label={`Photo ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
        {overlay != null ? (
          <div className="pointer-events-none absolute inset-0 z-[12]">
            <div className="pointer-events-auto absolute bottom-3 right-3 sm:bottom-4 sm:right-4">{overlay}</div>
          </div>
        ) : null}
      </div>
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto border-t border-border bg-muted/30 p-3 sm:p-4">
          {photos.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              className={cn(
                'h-20 w-20 shrink-0 overflow-hidden rounded-md border-2 transition-colors',
                i === current
                  ? 'border-primary ring-2 ring-primary/25'
                  : 'border-transparent ring-1 ring-border hover:border-muted-foreground/30',
              )}
            >
              <img src={src} alt={`${alt} — миниатюра ${i + 1}`} className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </>
  );
}
