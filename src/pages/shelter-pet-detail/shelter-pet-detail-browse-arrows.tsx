import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ShelterPetDetailT } from './shelter-pet-detail-glyphs';

export interface ShelterPetDetailBrowseArrowsProps {
  t: ShelterPetDetailT;
  show: boolean;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export function ShelterPetDetailBrowseArrows({
  t,
  show,
  canPrev,
  canNext,
  onPrev,
  onNext,
}: ShelterPetDetailBrowseArrowsProps) {
  if (!show) return null;

  return (
    <>
      <button
        type="button"
        onClick={onPrev}
        disabled={!canPrev}
        className="fixed left-2 top-[42%] z-30 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border/70 bg-background/85 text-muted-foreground shadow-sm backdrop-blur-sm transition hover:border-border hover:bg-muted/80 hover:text-foreground disabled:pointer-events-none disabled:opacity-25 lg:inline-flex"
        aria-label={t.nav.prevPet}
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        className="fixed right-2 top-[42%] z-30 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border/70 bg-background/85 text-muted-foreground shadow-sm backdrop-blur-sm transition hover:border-border hover:bg-muted/80 hover:text-foreground disabled:pointer-events-none disabled:opacity-25 lg:inline-flex"
        aria-label={t.nav.nextPet}
      >
        <ChevronRight className="size-5" />
      </button>
    </>
  );
}
