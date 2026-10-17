import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { Save, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { settingsApi } from '../api/client';
import { useI18n } from '../context/I18nContext';
import { safeExternalUrl } from '../utils/safe-external-url';
import { adm } from './admin-panel-chrome';

export function AdminMobileAppPanel() {
  const { t } = useI18n();
  const h = t.adminPanel.mobileApp;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [playUrl, setPlayUrl] = useState('');

  useEffect(() => {
    setLoading(true);
    settingsApi
      .get()
      .then((s) => setPlayUrl(s.mobile_app_play_url ?? ''))
      .catch((err) => toast.error(err instanceof Error ? err.message : h.loadError))
      .finally(() => setLoading(false));
  }, []);

  const previewUrl = safeExternalUrl(playUrl, { httpsOnly: true });

  const save = async () => {
    const trimmed = playUrl.trim();
    if (trimmed && !safeExternalUrl(trimmed, { httpsOnly: true })) {
      toast.error(h.saveError);
      return;
    }
    setSaving(true);
    try {
      const res = await settingsApi.update({ mobile_app_play_url: trimmed });
      setPlayUrl(res.mobile_app_play_url ?? trimmed);
      toast.success(h.saved);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : h.saveError);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className={adm.subtitle}>{h.loading}</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className={adm.title}>{h.title}</h2>
        <p className={adm.subtitle}>{h.hint}</p>
        <p className="mt-2 text-sm text-muted-foreground">{h.flagHint}</p>
      </div>

      <section className="rounded-md border border-border bg-white dark:bg-card/50 p-5 space-y-4">
        <div className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Smartphone className="w-4 h-4 text-primary" />
          {h.urlLabel}
        </div>
        <input
          type="url"
          value={playUrl}
          onChange={(e) => setPlayUrl(e.target.value.slice(0, 2000))}
          placeholder={h.urlPlaceholder}
          className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? h.saving : h.save}
        </button>
      </section>

      <section className="rounded-md border border-border bg-white dark:bg-card/50 p-5 space-y-4">
        <h3 className="text-base font-semibold text-foreground">{h.previewTitle}</h3>
        {previewUrl ? (
          <div className="inline-flex rounded-xl border border-border bg-white p-4">
            <QRCode value={previewUrl} size={160} level="M" />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{h.previewEmpty}</p>
        )}
      </section>
    </div>
  );
}
