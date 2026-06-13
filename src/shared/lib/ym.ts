import { YM_ID } from '@/shared/config';
import { hasAnalyticsConsent } from '@/shared/lib/cookie-consent';

export type YmGoalParams = Record<string, unknown>;

export function trackYmGoal(goal: string, params?: YmGoalParams): void {
  if (typeof window === 'undefined' || !hasAnalyticsConsent()) return;
  const ym = (window as Window & { ym?: (...args: unknown[]) => void }).ym;
  if (typeof ym !== 'function') return;
  ym(YM_ID, 'reachGoal', goal, params ?? {});
}
