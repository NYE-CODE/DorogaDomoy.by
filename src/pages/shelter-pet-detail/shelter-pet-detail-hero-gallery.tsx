import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FavoriteHeartButton } from '../../../components/favorite-heart-button';
import { cn } from '@/shared/ui/utils';
import type { ShelterPetDetailT } from './shelter-pet-detail-glyphs';

export interface ShelterPetDetailHeroGalleryProps {
  t: ShelterPetDetailT;
  petId: string;
  title: string;
  photos: string[];
  photoIndex: number;
  setPhotoIndex: React.Dispatch<React.SetStateAction<number>>;
}

export function ShelterPetDetailHeroGallery({
  t,
  petId,
  title,
  photos,
  photoIndex,
  setPhotoIndex,
}: ShelterPetDetailHeroGalleryProps) {
  const safePhotoIndex = Math.min(photoIndex, Math.max(0, photos.length - 1));
  const heroPhoto = photos[safePhotoIndex] || photos[0];
  const canSlide = photos.length > 1;

  const goPrev = () => setPhotoIndex((p) => (p - 1 + photos.length) % photos.length);
  const goNext = () => setPhotoIndex((p) => (p + 1) % photos.length);

  return (
    <div className="overflow-hidden">
      <div className="relative aspect-[4/3] w-full bg-landing-muted">
        {heroPhoto ? (
          <img src={heroPhoto} alt={title} className="block size-full max-h-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            {t.shelterPet.noPhoto}
          </div>
        )}
        {canSlide ? (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-3 top-1/2 z-[5] flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-landing-dark/45 text-on-landing-dark shadow-lg backdrop-blur-sm transition-colors hover:bg-landing-dark/65 sm:left-4"
              aria-label={t.shelterPet.photoPrev}
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-3 top-1/2 z-[5] flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-landing-dark/45 text-on-landing-dark shadow-lg backdrop-blur-sm transition-colors hover:bg-landing-dark/65 sm:right-4"
              aria-label={t.shelterPet.photoNext}
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </>
        ) : null}
        <div className="pointer-events-none absolute inset-0 z-[12]">
          <div className="pointer-events-auto absolute bottom-3 right-3 sm:bottom-4 sm:right-4">
            <FavoriteHeartButton petId={petId} />
          </div>
        </div>
      </div>
      {canSlide ? (
        <div className="flex gap-2 overflow-x-auto border-t border-border bg-card px-3 py-3">
          {photos.map((photo, idx) => (
            <button
              key={`${photo}-${idx}`}
              type="button"
              onClick={() => setPhotoIndex(idx)}
              className={cn(
                'h-16 w-16 shrink-0 overflow-hidden rounded-xl border transition-colors',
                idx === photoIndex
                  ? 'border-shelter ring-2 ring-shelter/25'
                  : 'border-border hover:border-shelter/50',
              )}
              aria-label={t.shelterPet.photoAlt
                .replace('{name}', title)
                .replace('{n}', String(idx + 1))}
            >
              <img
                src={photo}
                alt={t.shelterPet.photoAlt.replace('{name}', title).replace('{n}', String(idx + 1))}
                className="block size-full object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
