import { useCallback, useEffect, useRef } from 'react';
import type { TelegramAuthPayload } from '../api/client';

declare global {
  interface Window {
    onTelegramAuth?: (user: TelegramAuthPayload) => void;
  }
}

type Props = {
  botUsername: string;
  onAuth: (user: TelegramAuthPayload) => void;
  disabled?: boolean;
};

export function TelegramLoginButton({ botUsername, onAuth, disabled }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleAuth = useCallback(
    (user: TelegramAuthPayload) => {
      if (!disabled) onAuth(user);
    },
    [disabled, onAuth],
  );

  useEffect(() => {
    window.onTelegramAuth = handleAuth;
    return () => {
      if (window.onTelegramAuth === handleAuth) {
        delete window.onTelegramAuth;
      }
    };
  }, [handleAuth]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !botUsername || disabled) return;
    el.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', botUsername.replace(/^@/, ''));
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '8');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    el.appendChild(script);
  }, [botUsername, disabled]);

  if (!botUsername) return null;

  return (
    <div
      ref={containerRef}
      className={`flex min-h-[44px] items-center justify-center ${disabled ? 'pointer-events-none opacity-50' : ''}`}
    />
  );
}
