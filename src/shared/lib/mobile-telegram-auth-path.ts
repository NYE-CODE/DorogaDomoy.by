/** Hosted Telegram Login Widget for the mobile WebView (static HTML + SPA fallback). */
export function isMobileTelegramAuthPath(pathname: string): boolean {
  return (
    pathname === '/mobile-telegram-auth.html' ||
    pathname === '/mobile-telegram-auth'
  );
}
