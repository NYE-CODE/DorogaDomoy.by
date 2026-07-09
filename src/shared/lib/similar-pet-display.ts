/** Отображение процента совпадения и подсказок для похожих объявлений. */

const REASON_PRIORITY: Record<string, number> = {
  same_breed: 10,
  similar_breed: 20,
  related_breed: 30,
  visual_similarity: 40,
  same_color: 50,
  similar_color: 60,
  very_nearby: 70,
  nearby: 80,
  same_area: 90,
  same_city: 100,
  same_gender: 110,
  same_age: 120,
  similar_description: 130,
};

const GEO_REASONS = new Set(['very_nearby', 'nearby', 'same_area', 'same_city']);

export function sortSimilarReasons(reasons: string[]): string[] {
  return [...reasons].sort(
    (a, b) => (REASON_PRIORITY[a] ?? 200) - (REASON_PRIORITY[b] ?? 200),
  );
}

export function buildSimilarPetTooltipLines(
  item: { reasons: string[]; distanceKm: number | null },
  labels: {
    reasons: Record<string, string>;
    distanceKm: string;
  },
): string[] {
  const lines: string[] = [];
  const sorted = sortSimilarReasons(item.reasons);

  for (const reason of sorted) {
    if (GEO_REASONS.has(reason) && item.distanceKm != null) continue;
    const label = labels.reasons[reason];
    if (label) lines.push(label);
  }

  if (item.distanceKm != null) {
    lines.push(labels.distanceKm.replace('{km}', String(item.distanceKm)));
  }

  return lines;
}

/** Цвет бейджа по уровню совпадения. */
export function matchPercentBadgeClass(percent: number): string {
  if (percent >= 80) {
    return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 ring-emerald-500/25';
  }
  if (percent >= 65) {
    return 'bg-primary/12 text-primary ring-primary/20';
  }
  if (percent >= 50) {
    return 'bg-amber-500/15 text-amber-800 dark:text-amber-300 ring-amber-500/25';
  }
  return 'bg-muted text-muted-foreground ring-border';
}

/** Запасной расчёт, если API ещё без match_percent. */
export function fallbackMatchPercent(score: number): number {
  const normalized = (score - 32) / 88;
  return Math.round(Math.max(38, Math.min(97, 38 + normalized * 59)));
}
