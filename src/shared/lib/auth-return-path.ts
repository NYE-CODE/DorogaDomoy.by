const BLOCKED_PREFIXES = ['/complete-profile', '/forgot-password', '/reset-password'];

/** Безопасный внутренний путь для редиректа после входа. */
export function getSafeReturnPath(path: unknown): string | null {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) {
    return null;
  }
  const pathname = path.split('?')[0]?.split('#')[0] ?? path;
  if (BLOCKED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }
  return path;
}
