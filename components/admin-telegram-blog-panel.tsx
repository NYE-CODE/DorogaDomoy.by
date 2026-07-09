import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { settingsApi } from '../api/client';
import { useI18n } from '../context/I18nContext';
import { adm } from './admin-panel-chrome';

export function AdminTelegramBlogPanel() {
  const { t } = useI18n();
  const ap = t.adminPanel;

  const [blogTelegramChatId, setBlogTelegramChatId] = useState('');
  const [blogTelegramPublicUsername, setBlogTelegramPublicUsername] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const s = await settingsApi.get();
        if (cancelled) return;
        setBlogTelegramChatId(s.telegram_blog_chat_id ?? '');
        setBlogTelegramPublicUsername(s.telegram_blog_public_username ?? '');
      } catch (err: unknown) {
        console.warn('[AdminTelegramBlogPanel] settings load failed', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSaveBlogTelegramSettings = () => {
    settingsApi
      .update({
        telegram_blog_chat_id: blogTelegramChatId.trim(),
        telegram_blog_public_username: blogTelegramPublicUsername.trim().replace(/^@/, ''),
      })
      .then((s) => {
        setBlogTelegramChatId(s.telegram_blog_chat_id ?? '');
        setBlogTelegramPublicUsername(s.telegram_blog_public_username ?? '');
        toast.success(ap.toasts.telegramSaved);
      })
      .catch(() => {
        toast.error(ap.toasts.telegramError);
      });
  };

  return (
    <div className={adm.page}>
      <div className={adm.headerRow}>
        <div className={adm.headerText}>
          <h2 className={adm.title}>{ap.telegram.title}</h2>
          <p className={adm.subtitle}>{ap.telegram.intro}</p>
        </div>
      </div>

      <div className={`${adm.settingsCard} space-y-4 max-w-3xl`}>
        <div>
          <h3 className={adm.settingsCardTitle}>{ap.telegram.publishTargetTitle}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {ap.telegram.envVarsIntro}{' '}
            <code className="text-xs bg-muted px-1 rounded">TELEGRAM_BLOG_CHAT_ID</code>{' '}
            {ap.telegram.envVarsConjunction}{' '}
            <code className="text-xs bg-muted px-1 rounded">TELEGRAM_BLOG_PUBLIC_USERNAME</code>
            {ap.telegram.envVarsSuffix}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/90 mb-1">
            {ap.telegram.chatIdLabel}
          </label>
          <input
            type="text"
            value={blogTelegramChatId}
            onChange={(e) => setBlogTelegramChatId(e.target.value)}
            placeholder={ap.telegram.chatIdPlaceholder}
            className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg text-sm font-mono"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/90 mb-1">
            {ap.telegram.publicUsernameLabel}
          </label>
          <input
            type="text"
            value={blogTelegramPublicUsername}
            onChange={(e) => setBlogTelegramPublicUsername(e.target.value.replace(/^@/, ''))}
            placeholder={ap.telegram.usernamePlaceholder}
            className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg text-sm font-mono"
          />
          <p className="text-xs text-muted-foreground mt-1">{ap.telegram.usernameHint}</p>
        </div>
        <button type="button" onClick={handleSaveBlogTelegramSettings} className={adm.primaryBtn}>
          {ap.telegram.save}
        </button>
      </div>
    </div>
  );
}
