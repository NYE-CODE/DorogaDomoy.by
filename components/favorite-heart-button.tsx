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
  favoritesCount,
}: {
  petId: string;
  className?: string;
  size?: Size;
  /** Публичный счётчик избранного (≥1 показываем рядом с сердцем). */
  favoritesCount?: number;
}) {
  const { hydrated, isFavorite, toggleFavorite, pendingPetId } = useFavorites();
  const { t } = useI18n();
  const active = hydrated && isFavorite(petId);
  const busy = pendingPetId === petId;
  const iconClass = size === 'sm' ? 'size-3.5' : 'size-4';
  const label = active ? t.favorites.ariaRemove : t.favorites.ariaAdd;
  const disabled = !hydrated || busy;
  const count = Math.max(0, favoritesCount ?? 0);
  const showCount = count > 0;

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
      aria-label={showCount ? `${label}. ${count}` : label}
      aria-pressed={active}
      className={cn(
        'inline-flex h-11 shrink-0 items-center justify-center gap-1 rounded-full border border-white/90 bg-black/35 text-white shadow-md backdrop-blur-sm transition-colors',
        showCount ? 'min-w-11 px-2.5' : 'size-11',
        'hover:bg-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
        'disabled:pointer-events-none disabled:opacity-50',
        active && 'border-rose-200/80 bg-rose-500/90 text-white hover:bg-rose-600/90',
        className,
      )}
    >
      <Heart className={cn(iconClass, active && 'fill-current')} aria-hidden />
      {showCount ? (
        <span className="text-xs font-semibold tabular-nums leading-none">{count}</span>
      ) : null}
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
