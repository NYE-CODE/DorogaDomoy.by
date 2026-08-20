import { useEffect, useState } from 'react';
import { TelegramLoginButton } from '../../components/auth/TelegramLoginButton';
import { authApi, type TelegramAuthPayload } from '@/shared/api/auth';
import {
  applySeo,
  canonicalUrlFromPath,
  SEO_ROBOTS_PRIVATE,
} from '@/shared/lib/seo';

declare global {
  interface Window {
    TelegramAuthChannel?: { postMessage: (message: string) => void };
  }
}

/** Fallback when nginx/CDN serves the SPA instead of public/mobile-telegram-auth.html. */
export default function MobileTelegramAuthPage() {
  const [bot, setBot] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    applySeo({
      title: 'Вход через Telegram | DorogaDomoy.by',
      description: 'Авторизация в приложении DorogaDomoy через Telegram.',
      canonicalUrl: canonicalUrlFromPath('/mobile-telegram-auth.html'),
      robots: SEO_ROBOTS_PRIVATE,
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    authApi
      .getConfig()
      .then((cfg) => {
        if (cancelled) return;
        const username = (cfg.telegram_bot_username || '').replace(/^@/, '');
        setBot(username || null);
        setEnabled(Boolean(cfg.telegram_login_enabled && username));
      })
      .catch(() => {
        if (!cancelled) {
          setError('Не удалось загрузить виджет. Проверьте интернет и попробуйте снова.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onAuth = (user: TelegramAuthPayload) => {
    try {
      if (window.TelegramAuthChannel?.postMessage) {
        window.TelegramAuthChannel.postMessage(JSON.stringify(user));
        return;
      }
    } catch {
      // Flutter channel is only present inside the app WebView.
    }
    setError('Откройте эту страницу внутри приложения DorogaDomoy.');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f7f4] p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white px-[22px] py-7 text-center shadow-[0_8px_28px_rgba(0,0,0,.06)]">
        <h1 className="mb-2 text-xl font-semibold text-[#1a1a1a]">Вход через Telegram</h1>
        <p className="mb-5 text-[0.95rem] leading-snug text-[#5b5b5b]">
          Авторизуйтесь виджетом Telegram — приложение продолжит автоматически.
        </p>
        {loading ? (
          <p className="text-sm text-[#5b5b5b]">Загрузка…</p>
        ) : enabled && bot ? (
          <TelegramLoginButton botUsername={bot} onAuth={onAuth} />
        ) : (
          !error && (
            <p className="text-sm text-[#b42318]">Вход через Telegram сейчас недоступен.</p>
          )
        )}
        {error ? <p className="mt-3 text-sm text-[#b42318]">{error}</p> : null}
      </div>
    </div>
  );
}
