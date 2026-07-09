import { Heart, X } from 'lucide-react';
import {
  matchSwipeLikeOverlayClass,
  matchSwipeLikeStampClass,
  matchSwipePassOverlayClass,
  matchSwipePassStampClass,
  matchSwipeStampLabelClass,
} from '@/shared/styles/match-styles';
import { swipeStampMotion } from './match-swipe-motion';

export interface MatchSwipeOverlaysProps {
  likeOpacity: number;
  passOpacity: number;
  likeLabel: string;
  passLabel: string;
}

export function MatchSwipeOverlays({
  likeOpacity,
  passOpacity,
  likeLabel,
  passLabel,
}: MatchSwipeOverlaysProps) {
  return (
    <>
      <div className={matchSwipeLikeOverlayClass} style={{ opacity: likeOpacity * 0.9 }} aria-hidden />
      <div className={matchSwipePassOverlayClass} style={{ opacity: passOpacity * 0.9 }} aria-hidden />
      <div
        className={matchSwipeLikeStampClass}
        style={swipeStampMotion(likeOpacity, -14)}
        aria-hidden={likeOpacity === 0}
      >
        <Heart size={22} strokeWidth={2.5} className="fill-current" aria-hidden />
        <span className={matchSwipeStampLabelClass}>{likeLabel}</span>
      </div>
      <div
        className={matchSwipePassStampClass}
        style={swipeStampMotion(passOpacity, 14)}
        aria-hidden={passOpacity === 0}
      >
        <X size={22} strokeWidth={3} aria-hidden />
        <span className={matchSwipeStampLabelClass}>{passLabel}</span>
      </div>
    </>
  );
}
