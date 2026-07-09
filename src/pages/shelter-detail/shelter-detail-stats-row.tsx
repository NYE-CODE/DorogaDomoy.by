import { Heart, Home, PawPrint } from 'lucide-react';

export interface ShelterDetailStatsRowProps {
  totalPets: number;
  foundPets: number;
  searchingPets: number;
}

export function ShelterDetailStatsRow({
  totalPets,
  foundPets,
  searchingPets,
}: ShelterDetailStatsRowProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="rounded-md border border-border/80 bg-card p-4 text-center shadow-sm">
        <div className="mx-auto mb-2 hidden size-9 items-center justify-center rounded-full bg-primary/8 sm:flex">
          <PawPrint className="size-4 text-primary/90" aria-hidden />
        </div>
        <p className="typo-h1 md:text-2xl">{totalPets}</p>
        <p className="mt-0.5 text-xs text-muted-foreground md:text-sm">Всего питомцев</p>
      </div>
      <div className="rounded-md border border-border/80 bg-card p-4 text-center shadow-sm">
        <div className="mx-auto mb-2 hidden size-9 items-center justify-center rounded-full bg-primary/8 sm:flex">
          <Heart className="size-4 text-primary/90" aria-hidden />
        </div>
        <p className="typo-h1 md:text-2xl">{foundPets}</p>
        <p className="mt-0.5 text-xs text-muted-foreground md:text-sm">Нашли дом</p>
      </div>
      <div className="rounded-md border border-border/80 bg-card p-4 text-center shadow-sm">
        <div className="mx-auto mb-2 hidden size-9 items-center justify-center rounded-full bg-primary/8 sm:flex">
          <Home className="size-4 text-primary/90" aria-hidden />
        </div>
        <p className="typo-h1 md:text-2xl">{searchingPets}</p>
        <p className="mt-0.5 text-xs text-muted-foreground md:text-sm">Ищут дом</p>
      </div>
    </div>
  );
}
