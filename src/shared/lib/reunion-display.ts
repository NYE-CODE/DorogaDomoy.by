/** Уровень уверенности и вспомогательные метки для экрана воссоединения. */

export type ReunionConfidence = 'high' | 'medium' | 'review';

export function reunionConfidence(percent: number): ReunionConfidence {
  if (percent >= 80) return 'high';
  if (percent >= 65) return 'medium';
  return 'review';
}

export function reunionConfidenceBadgeClass(level: ReunionConfidence): string {
  if (level === 'high') {
    return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 ring-emerald-500/25';
  }
  if (level === 'medium') {
    return 'bg-primary/12 text-primary ring-primary/20';
  }
  return 'bg-amber-500/15 text-amber-800 dark:text-amber-300 ring-amber-500/25';
}

export type ReunionAttributeRow = {
  key: string;
  sourceValue: string;
  matchValue: string;
  aligned: boolean;
};

function norm(value: string | undefined | null): string {
  return (value ?? '').trim().toLowerCase();
}

export function buildReunionAttributeRows(
  source: {
    breed?: string;
    colors: string[];
    gender: string;
    approximateAge?: string;
    city: string;
  },
  match: {
    breed?: string;
    colors: string[];
    gender: string;
    approximateAge?: string;
    city: string;
  },
  labels: {
    breed: string;
    colors: string;
    gender: string;
    age: string;
    city: string;
    colorMap: Record<string, string>;
    genderMap: Record<string, string>;
    notSpecified: string;
  },
): ReunionAttributeRow[] {
  const sourceColors = new Set(source.colors.map((c) => c.toLowerCase()));
  const matchColors = new Set(match.colors.map((c) => c.toLowerCase()));
  const colorOverlap = [...sourceColors].some((c) => matchColors.has(c));
  const sourceColorText =
    source.colors.map((c) => labels.colorMap[c] ?? c).join(', ') || labels.notSpecified;
  const matchColorText =
    match.colors.map((c) => labels.colorMap[c] ?? c).join(', ') || labels.notSpecified;

  const rows: ReunionAttributeRow[] = [
    {
      key: 'breed',
      sourceValue: source.breed?.trim() || labels.notSpecified,
      matchValue: match.breed?.trim() || labels.notSpecified,
      aligned: Boolean(source.breed && match.breed && norm(source.breed) === norm(match.breed)),
    },
    {
      key: 'colors',
      sourceValue: sourceColorText,
      matchValue: matchColorText,
      aligned: colorOverlap,
    },
    {
      key: 'gender',
      sourceValue: labels.genderMap[source.gender] ?? labels.notSpecified,
      matchValue: labels.genderMap[match.gender] ?? labels.notSpecified,
      aligned: source.gender !== 'unknown' && source.gender === match.gender,
    },
    {
      key: 'age',
      sourceValue: source.approximateAge?.trim() || labels.notSpecified,
      matchValue: match.approximateAge?.trim() || labels.notSpecified,
      aligned: Boolean(
        source.approximateAge && match.approximateAge && norm(source.approximateAge) === norm(match.approximateAge),
      ),
    },
    {
      key: 'city',
      sourceValue: source.city?.trim() || labels.notSpecified,
      matchValue: match.city?.trim() || labels.notSpecified,
      aligned: Boolean(source.city && match.city && norm(source.city) === norm(match.city)),
    },
  ];

  return rows;
}
