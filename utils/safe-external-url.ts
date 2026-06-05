/** Клиентская проверка перед window.open (дополнение к серверной фильтрации). */
export function safeExternalUrl(
  raw: string,
  opts?: { httpsOnly?: boolean },
): string | null {
  const s = raw.trim();
  if (!s) return null;
  try {
    const u = new URL(s);
    if (opts?.httpsOnly) {
      if (u.protocol !== 'https:') return null;
    } else if (u.protocol !== 'https:' && u.protocol !== 'http:') {
      return null;
    }
    if (u.username || u.password) return null;
    if (!u.hostname) return null;
    return u.href;
  } catch {
    return null;
  }
}
