const YM_COUNTER_ID = 107705476;

export type YmGoalParams = Record<string, unknown>;

export function trackYmGoal(goal: string, params?: YmGoalParams): void {
  if (typeof window === "undefined") return;
  const ym = (window as any).ym;
  if (typeof ym !== "function") return;
  ym(YM_COUNTER_ID, "reachGoal", goal, params ?? {});
}
