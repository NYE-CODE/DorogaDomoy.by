import { Coins, Target } from 'lucide-react';
import { Pet } from '../types/pet';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { cn } from './ui/utils';

interface RewardBadgeProps {
  pet: Pick<Pet, 'status' | 'rewardMode' | 'rewardAmountByn' | 'rewardPoints'>;
  className?: string;
  compact?: boolean;
  /** Полная ширина + перенос строк (список поиска в узкой колонке) */
  compactWrap?: boolean;
}

export function getRewardBadgeMeta(
  pet: Pick<Pet, 'status' | 'rewardMode' | 'rewardAmountByn' | 'rewardPoints'>,
) {
  if (pet.status !== 'searching') return null;

  if (pet.rewardMode === 'money' && pet.rewardAmountByn) {
    return {
      label: `${pet.rewardAmountByn} BYN`,
      icon: Coins,
      tooltip:
        'Денежное вознаграждение за помощь в поиске. Владелец передает его помощнику напрямую.',
      variant: 'warning' as const,
    };
  }

  return {
    label: `+${pet.rewardPoints ?? 50} очков`,
    icon: Target,
    tooltip: 'Награда очками платформы за подтвержденную помощь в поиске питомца.',
    variant: 'info' as const,
  };
}

export function RewardBadge({
  pet,
  className = '',
  compact = false,
  compactWrap = false,
}: RewardBadgeProps) {
  const badge = getRewardBadgeMeta(pet);

  if (!badge) return null;

  const Icon = badge.icon;

  const solidSurfaceClass =
    badge.variant === 'warning'
      ? 'border-transparent bg-amber-600/95 text-white shadow-sm backdrop-blur-sm dark:bg-amber-600'
      : 'border-transparent bg-sky-600/95 text-white shadow-sm backdrop-blur-sm dark:bg-sky-600';

  const sizeClass = compact && compactWrap
    ? 'max-w-full min-w-0 self-start rounded-full px-2 py-0.5 text-xs leading-snug whitespace-normal break-words'
    : compact
      ? 'rounded-full px-2 py-0.5'
      : 'rounded-full px-3 py-1 text-sm';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant={badge.variant}
          className={cn('gap-1 font-semibold', solidSurfaceClass, sizeClass, className)}
        >
          <Icon className="size-3.5 shrink-0" aria-hidden />
          {badge.label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent sideOffset={8} className="max-w-64 text-center">
        {badge.tooltip}
      </TooltipContent>
    </Tooltip>
  );
}
