import { cssVar } from '@/shared/styles/tokens';

/** Градиент трека range input: заполнено primary, остаток — slider track token. */
export function rangeSliderGradient(value: number, min: number, max: number): string {
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const fill = cssVar.primary;
  const track = cssVar.sliderTrack;
  return `linear-gradient(to right, ${fill} 0%, ${fill} ${pct}%, ${track} ${pct}%, ${track} 100%)`;
}
