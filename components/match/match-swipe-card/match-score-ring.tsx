import { tokens } from '@/shared/styles/tokens';
import {
  matchScoreRingTrackClass,
  matchScoreRingValueClass,
} from '@/shared/styles/match-styles';
import { SCORE_RING_R } from './match-swipe-constants';

export function MatchScoreRing({ score, label }: { score: number; label: string }) {
  const circumference = 2 * Math.PI * SCORE_RING_R;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex shrink-0 flex-col items-center gap-1.5">
      <div className="relative size-[4.75rem]" aria-hidden>
        <svg className="size-full -rotate-90" viewBox="0 0 64 64">
          <circle
            cx="32"
            cy="32"
            r={SCORE_RING_R}
            fill="none"
            strokeWidth="5"
            className={matchScoreRingTrackClass}
            stroke="currentColor"
          />
          <circle
            cx="32"
            cy="32"
            r={SCORE_RING_R}
            fill="none"
            strokeWidth="5"
            strokeLinecap="round"
            className={matchScoreRingValueClass}
            stroke={tokens.colors.primary}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-lg font-bold tabular-nums text-foreground">
          {score}%
        </span>
      </div>
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  );
}
