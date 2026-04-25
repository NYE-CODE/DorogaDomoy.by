import { Heart } from 'lucide-react';
import { cn } from './ui/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { useFavorites } from '../context/FavoritesContext';
import { useI18n } from '../context/I18nContext';

type Size = 'sm' | 'md';

export function FavoriteHeartButton({
  petId,
  className,
  size = 'md',
}: {
  petId: string;
  className?: string;
  size?: Size;
}) {
  const { hydrated, isFavorite, toggleFavorite, pendingPetId } = useFavorites();
  const { t } = useI18n();
  const active = hydrated && isFavorite(petId);
  const busy = pendingPetId === petId;
  const iconClass = size === 'sm' ? 'size-3.5' : 'size-4';
  const label = active ? t.favorites.ariaRemove : t.favorites.ariaAdd;
  const disabled = !hydrated || busy;

  const button = (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (disabled) return;
        void toggleFavorite(petId);
      }}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border border-white/90 bg-black/35 p-1.5 text-white shadow-md backdrop-blur-sm transition-colors',
        'hover:bg-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
        'disabled:pointer-events-none disabled:opacity-50',
        active && 'bg-rose-500/90 text-white border-rose-200/80 hover:bg-rose-600/90',
        className,
      )}
    >
      <Heart
        className={cn(iconClass, active && 'fill-current')}
        aria-hidden
      />
    </button>
  );

  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        {disabled ? (
          <span className="inline-flex shrink-0 rounded-full">{button}</span>
        ) : (
          button
        )}
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={6} className="max-w-[14rem]">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
