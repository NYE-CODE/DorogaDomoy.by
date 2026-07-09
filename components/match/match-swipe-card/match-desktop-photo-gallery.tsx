import { useEffect, useMemo, useState } from 'react';
import type { Pet } from '../../../types/pet';
import {
  matchDesktopPhotoClass,
  matchDesktopPhotoImgClass,
  matchDesktopPhotoMainClass,
  matchDesktopThumbActiveClass,
  matchDesktopThumbClass,
  matchDesktopThumbStripClass,
} from '@/shared/styles/match-styles';
import { useI18n } from '../../../context/I18nContext';
import { cn } from '../../ui/utils';
import { MatchSwipeOverlays } from './match-swipe-overlays';
import type { HorizontalSwipeHandlers } from './use-horizontal-swipe';

export interface MatchDesktopPhotoGalleryProps {
  pet: Pet;
  noPhotoLabel: string;
  className?: string;
  swipeHandlers: HorizontalSwipeHandlers;
  dragging: boolean;
  likeOpacity: number;
  passOpacity: number;
  likeLabel: string;
  passLabel: string;
}

export function MatchDesktopPhotoGallery({
  pet,
  noPhotoLabel,
  className,
  swipeHandlers,
  dragging,
  likeOpacity,
  passOpacity,
  likeLabel,
  passLabel,
}: MatchDesktopPhotoGalleryProps) {
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
