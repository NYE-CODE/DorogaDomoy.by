import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { settingsApi } from '../api/client';
import { useI18n } from '../context/I18nContext';
import { adm } from './admin-panel-chrome';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export function AdminSettingsPanel() {
  const { t } = useI18n();
  const ap = t.adminPanel;

  const [settings, setSettings] = useState({
    requireModeration: true,
    autoArchiveDays: 90,
    listingReminderDays: '3,1',
    maxPhotos: 5,
    rewardDefaultPoints: 50,
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const s = await settingsApi.get();
        if (cancelled) return;
        setSettings({
          requireModeration: s.require_moderation === 'true',
          autoArchiveDays: parseInt(s.auto_archive_days, 10) || 90,
          listingReminderDays: s.listing_reminder_days?.trim() || '3,1',
          maxPhotos: parseInt(s.max_photos, 10) || 5,
          rewardDefaultPoints: parseInt(s.reward_default_points ?? '50', 10) || 50,
        });
      } catch (err: unknown) {
        console.warn('[AdminSettingsPanel] settings load failed', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSaveSettings = () => {
    settingsApi
      .update({
        require_moderation: settings.requireModeration ? 'true' : 'false',
        auto_archive_days: String(settings.autoArchiveDays),
        listing_reminder_days: settings.listingReminderDays.trim() || '3,1',
        max_photos: String(settings.maxPhotos),
        reward_default_points: String(settings.rewardDefaultPoints),
      })
      .then(() => {
        toast.success(ap.toasts.settingsSaved);
      })
      .catch(() => {
        toast.error(ap.toasts.settingsError);
      });
  };

  return (
    <div className={adm.page}>
      <div className={adm.headerRow}>
        <div className={adm.headerText}>
          <h2 className={adm.title}>{ap.settings.title}</h2>
        </div>
      </div>

      <div className={adm.settingsCard}>
        <h3 className={adm.settingsCardTitle}>{ap.settings.general}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-2">
              {ap.settings.moderationLabel}
            </label>
            <Select
              value={settings.requireModeration ? 'yes' : 'no'}
              onValueChange={(v) => setSettings((s) => ({ ...s, requireModeration: v === 'yes' }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={ap.settings.moderationPh} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">{ap.settings.moderationYes}</SelectItem>
                <SelectItem value="no">{ap.settings.moderationNo}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-2">
              {ap.settings.archiveLabel}
            </label>
            <input
              type="number"
              min={1}
              max={365}
              value={settings.autoArchiveDays}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  autoArchiveDays: Math.max(1, parseInt(e.target.value, 10) || 90),
                }))
              }
              className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-2">
              {ap.settings.reminderDaysLabel}
            </label>
            <input
              type="text"
              value={settings.listingReminderDays}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  listingReminderDays: e.target.value,
                }))
              }
              placeholder="7,3,1"
              className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">{ap.settings.reminderDaysHint}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-2">
              {ap.settings.maxPhotosLabel}
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={settings.maxPhotos}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  maxPhotos: Math.max(1, Math.min(20, parseInt(e.target.value, 10) || 5)),
                }))
              }
              className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg"
            />
          </div>
        </div>
      </div>

      <div className={adm.settingsCard}>
        <h3 className={adm.settingsCardTitle}>{ap.settings.rewardsSectionTitle}</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={adm.labelFilter}>{ap.settings.rewardDefaultPointsLabel}</label>
              <input
                type="number"
                min={1}
                max={10000}
                value={settings.rewardDefaultPoints}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    rewardDefaultPoints: Math.max(1, parseInt(e.target.value, 10) || 50),
                  }))
                }
                className="w-full px-3 py-2.5 border border-border dark:bg-muted dark:text-white rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>

      <div className={adm.settingsCard}>
        <h3 className={adm.settingsCardTitle}>{ap.settings.citiesTitle}</h3>
        <p className={adm.lead}>{ap.settings.citiesHint}</p>
      </div>

      <div className={adm.footerActions}>
        <button type="button" onClick={handleSaveSettings} className={adm.saveBtnLg}>
          {ap.settings.save}
        </button>
      </div>
    </div>
  );
}
