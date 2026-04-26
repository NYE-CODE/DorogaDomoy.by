import { Pet } from "../types/pet";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface RewardBadgeProps {
  pet: Pick<Pet, "status" | "rewardMode" | "rewardAmountByn" | "rewardPoints">;
  className?: string;
  compact?: boolean;
  /** Полная ширина + перенос строк (список поиска в узкой колонке) */
  compactWrap?: boolean;
}

export function getRewardBadgeMeta(
  pet: Pick<Pet, "status" | "rewardMode" | "rewardAmountByn" | "rewardPoints">,
) {
  if (pet.status !== "searching") return null;

  if (pet.rewardMode === "money" && pet.rewardAmountByn) {
    return {
      text: `💰 ${pet.rewardAmountByn} BYN`,
      tooltip:
        "Денежное вознаграждение за помощь в поиске. Владелец передает его помощнику напрямую.",
      className:
        "bg-amber-100 dark:bg-amber-900/35 text-amber-950 dark:text-amber-100",
    };
  }

  return {
    text: `🎯 +${pet.rewardPoints ?? 50} очков`,
    tooltip: "Награда очками платформы за подтвержденную помощь в поиске питомца.",
    className:
      "bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-200",
  };
}

export function RewardBadge({
  pet,
  className = "",
  compact = false,
  compactWrap = false,
}: RewardBadgeProps) {
  const badge = getRewardBadgeMeta(pet);

  if (!badge) return null;

  const wrapClass =
    "block w-full max-w-full min-w-0 rounded-md px-2 py-1 text-left text-[11px] font-semibold leading-snug whitespace-normal break-words";
  const compactInlineClass =
    "inline-flex items-center rounded-full px-2 py-0.5 text-[11px]";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={`font-semibold ${
            compact && compactWrap
              ? wrapClass
              : compact
                ? compactInlineClass
                : "inline-flex items-center rounded-full px-3 py-1 text-sm"
          } ${badge.className} ${className}`.trim()}
        >
          {badge.text}
        </span>
      </TooltipTrigger>
      <TooltipContent sideOffset={8} className="max-w-64 text-center">
        {badge.tooltip}
      </TooltipContent>
    </Tooltip>
  );
}
