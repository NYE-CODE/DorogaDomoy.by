import { ROTATE_FACTOR, ROTATE_MAX_DEG } from './match-swipe-constants';

export function swipeStampMotion(opacity: number, rotateDeg: number) {
  const scale = 0.72 + opacity * 0.28;
  const lift = (1 - opacity) * 14;
  return {
    opacity,
    transform: `translateY(calc(-50% + ${lift}px)) rotate(${rotateDeg}deg) scale(${scale})`,
  };
}

export function swipeRotation(dragX: number) {
  const deg = dragX * ROTATE_FACTOR;
  return Math.max(-ROTATE_MAX_DEG, Math.min(ROTATE_MAX_DEG, deg));
}
