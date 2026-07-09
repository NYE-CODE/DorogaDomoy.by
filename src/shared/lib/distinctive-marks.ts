/** Сравнение отличительных примет на фронтенде (экран воссоединения). */

function norm(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function tokens(mark: string): Set<string> {
  const matches = norm(mark).match(/[a-zа-яё0-9]{3,}/g);
  return new Set(matches ?? []);
}

export function overlapDistinctiveMarks(a: string[] = [], b: string[] = []): string[] {
  const matched: string[] = [];
  const usedB = new Set<number>();
  for (const ma of a) {
    const maNorm = norm(ma);
    const maTokens = tokens(ma);
    for (let i = 0; i < b.length; i += 1) {
      if (usedB.has(i)) continue;
      const mb = b[i]!;
      const mbNorm = norm(mb);
      if (maNorm === mbNorm || maNorm.includes(mbNorm) || mbNorm.includes(maNorm)) {
        matched.push(ma);
        usedB.add(i);
        break;
      }
      const mbTokens = tokens(mb);
      if (maTokens.size && mbTokens.size) {
        let common = 0;
        for (const t of maTokens) {
          if (mbTokens.has(t)) common += 1;
        }
        const overlap = common / Math.min(maTokens.size, mbTokens.size);
        if (overlap >= 0.5) {
          matched.push(ma);
          usedB.add(i);
          break;
        }
      }
    }
  }
  return matched;
}
