import {
  ChevronLeft,
  ChevronRight,
  Eye,
  FilePlus,
  MoreVertical,
  PawPrint,
  Pencil,
} from 'lucide-react';
import type { ProfilePetResponse } from '@/shared/api/client';
import { Button, buttonVariants } from '@/shared/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { typoH1 } from '@/shared/styles/typography-classes';
import { cn } from '@/shared/ui/utils';

export interface MyPetProfilePhotoCardProps {
  pet: ProfilePetResponse;
  photos: string[];
  photoIndex: number;
  speciesLine: string;
  op: Record<string, string>;
  menuEditLabel: string;
  menuCreateAdLabel: string;
  thumbRefs: React.MutableRefObject<Array<HTMLButtonElement | null>>;
  onPhotoIndexChange: (index: number) => void;
  onPrevPhoto: () => void;
  onNextPhoto: () => void;
  onEdit: () => void;
  onOpenPublicPage: () => void;
  onCreateAd: () => void;
}

export function MyPetProfilePhotoCard({
  pet,
  photos,
  photoIndex,
  speciesLine,
  op,
  menuEditLabel,
  menuCreateAdLabel,
  thumbRefs,
  onPhotoIndexChange,
  onPrevPhoto,
  onNextPhoto,
  onEdit,
  onOpenPublicPage,
  onCreateAd,
}: MyPetProfilePhotoCardProps) {
  const mainPhoto = photos[photoIndex] ?? photos[0];

  return (
    <Card className="gap-0 overflow-hidden border-border/80 shadow-md ring-1 ring-border/50">
      <div className="relative bg-muted">
        {photos.length > 1 ? (
          <>
            <button
              type="button"
              onClick={onPrevPhoto}
              className="absolute left-2 top-1/2 z-20 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/95 text-foreground shadow-md backdrop-blur-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:left-3"
              aria-label={op.photoPrev}
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              onClick={onNextPhoto}
              className="absolute right-2 top-1/2 z-20 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/95 text-foreground shadow-md backdrop-blur-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:right-3"
              aria-label={op.photoNext}
            >
              <ChevronRight size={22} />
            </button>
          </>
        ) : null}
        <div className="flex min-h-[220px] items-center justify-center px-4 py-8 sm:min-h-[280px] sm:py-10">
          {mainPhoto ? (
            <img
              src={mainPhoto}
              alt={pet.name}
              className="max-h-[min(52vh,480px)] w-full max-w-3xl object-contain object-center"
            />
          ) : (
            <PawPrint className="text-muted-foreground/35" size={72} strokeWidth={1.25} />
          )}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card/90 to-transparent sm:h-20" />
      </div>

      {photos.length > 1 ? (
        <div className="border-t border-border/60 bg-card px-2 py-3 sm:px-3">
          <div className="mb-2 flex items-center justify-between gap-2 px-1">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {op.photosTitle}
            </span>
            <span className="tabular-nums text-xs text-muted-foreground">
              {photoIndex + 1} / {photos.length}
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto overflow-y-hidden scroll-smooth pb-1 pt-0.5 [scrollbar-width:thin]">
            {photos.map((src, i) => (
              <button
                key={src + i}
                type="button"
                ref={(el) => {
                  thumbRefs.current[i] = el;
                }}
                onClick={() => onPhotoIndexChange(i)}
                className={cn(
                  'relative size-[4.5rem] shrink-0 snap-start overflow-hidden rounded-md border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:size-20',
                  i === photoIndex
                    ? 'border-primary ring-2 ring-primary/30'
                    : 'border-border/80 opacity-90 hover:border-primary/50 hover:opacity-100',
                )}
              >
                <img src={src} alt={`${pet.name} ${i + 1}`} className="size-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <CardHeader className="relative z-10 border-t border-border/60 bg-card pb-6 pt-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className={typoH1}>{pet.name}</CardTitle>
            <CardDescription className="pb-5 text-base text-muted-foreground sm:pb-6">
              {speciesLine}
            </CardDescription>
          </div>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger
              type="button"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'icon' }),
                'relative z-20 shrink-0 cursor-pointer',
              )}
              aria-label={op.menuOpen}
              aria-haspopup="menu"
            >
              <MoreVertical size={20} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="z-[110] w-52">
              <DropdownMenuItem className="cursor-pointer gap-2" onSelect={onEdit}>
                <Pencil size={16} className="opacity-70" />
                {menuEditLabel}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-2"
                onSelect={(e) => {
                  e.preventDefault();
                  onOpenPublicPage();
                }}
              >
                <Eye size={16} className="opacity-70" />
                {op.menuPublicPage}
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer gap-2" onSelect={onCreateAd}>
                <FilePlus size={16} className="opacity-70" />
                {menuCreateAdLabel}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
    </Card>
  );
}
