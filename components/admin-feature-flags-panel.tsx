import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { featureFlagsApi } from '../api/client';
import { useI18n } from '../context/I18nContext';
import { adm } from './admin-panel-chrome';
import { Switch } from './ui/switch';

export function AdminFeatureFlagsPanel() {
  const { t } = useI18n();
  const ap = t.adminPanel;

  const [featureFlags, setFeatureFlags] = useState({
    ff_landing_show_stats: true,
    ff_landing_show_help: true,
    ff_landing_show_pets_feature: true,
    ff_landing_show_faq: true,
    ff_partner_ads_enabled: false,
    ff_reward_enabled: true,
    ff_reward_money_enabled: true,
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const ff = await featureFlagsApi.get();
        if (cancelled) return;
        setFeatureFlags({
          ff_landing_show_stats: ff.ff_landing_show_stats === 'true',
          ff_landing_show_help: ff.ff_landing_show_help === 'true',
          ff_landing_show_pets_feature: (ff.ff_landing_show_pets_feature ?? 'true') === 'true',
          ff_landing_show_faq: (ff.ff_landing_show_faq ?? 'true') === 'true',
          ff_partner_ads_enabled: (ff.ff_partner_ads_enabled ?? 'false') === 'true',
          ff_reward_enabled: (ff.ff_reward_enabled ?? 'true') === 'true',
          ff_reward_money_enabled: (ff.ff_reward_money_enabled ?? 'true') === 'true',
        });
      } catch (err: unknown) {
        console.warn('[AdminFeatureFlagsPanel] feature flags load failed', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSaveFeatureFlags = () => {
    featureFlagsApi
      .update({
        ff_landing_show_stats: featureFlags.ff_landing_show_stats,
        ff_landing_show_help: featureFlags.ff_landing_show_help,
        ff_landing_show_pets_feature: featureFlags.ff_landing_show_pets_feature,
        ff_landing_show_faq: featureFlags.ff_landing_show_faq,
        ff_partner_ads_enabled: featureFlags.ff_partner_ads_enabled,
        ff_reward_enabled: featureFlags.ff_reward_enabled,
        ff_reward_money_enabled: featureFlags.ff_reward_money_enabled,
      })
      .then(() => {
        toast.success(ap.toasts.flagsSaved);
      })
      .catch(() => {
        toast.error(ap.toasts.flagsError);
      });
  };

  return (
    <div className={adm.page}>
      <div className={adm.headerRow}>
        <div className={adm.headerText}>
          <h2 className={adm.title}>{ap.featureFlags.title}</h2>
        </div>
      </div>

      <div className={adm.settingsCard}>
        <h3 className={adm.settingsCardTitle}>{ap.featureFlags.landingTitle}</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground/90">{ap.featureFlags.ffStats}</p>
              <p className="text-xs text-muted-foreground mt-1">{ap.featureFlags.ffStatsDesc}</p>
            </div>
            <Switch
              checked={featureFlags.ff_landing_show_stats}
              onCheckedChange={(v) => setFeatureFlags((f) => ({ ...f, ff_landing_show_stats: v }))}
            />
          </div>
          <div className="flex items-center justify-between gap-4 pt-4 border-t border-border dark:border-border">
            <div>
              <p className="text-sm font-medium text-foreground/90">{ap.featureFlags.ffHelp}</p>
              <p className="text-xs text-muted-foreground mt-1">{ap.featureFlags.ffHelpDesc}</p>
            </div>
            <Switch
              checked={featureFlags.ff_landing_show_help}
              onCheckedChange={(v) => setFeatureFlags((f) => ({ ...f, ff_landing_show_help: v }))}
            />
          </div>
          <div className="flex items-center justify-between gap-4 pt-4 border-t border-border dark:border-border">
            <div>
              <p className="text-sm font-medium text-foreground/90">{ap.featureFlags.ffPets}</p>
              <p className="text-xs text-muted-foreground mt-1">{ap.featureFlags.ffPetsDesc}</p>
            </div>
            <Switch
              checked={featureFlags.ff_landing_show_pets_feature}
              onCheckedChange={(v) => setFeatureFlags((f) => ({ ...f, ff_landing_show_pets_feature: v }))}
            />
          </div>
          <div className="flex items-center justify-between gap-4 pt-4 border-t border-border dark:border-border">
            <div>
              <p className="text-sm font-medium text-foreground/90">{ap.featureFlags.ffFaq}</p>
              <p className="text-xs text-muted-foreground mt-1">{ap.featureFlags.ffFaqDesc}</p>
            </div>
            <Switch
              checked={featureFlags.ff_landing_show_faq}
              onCheckedChange={(v) => setFeatureFlags((f) => ({ ...f, ff_landing_show_faq: v }))}
            />
          </div>
        </div>
      </div>

      <div className={adm.settingsCard}>
        <h3 className={adm.settingsCardTitle}>{ap.featureFlags.siteTitle}</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground/90">{ap.featureFlags.ffRewardEnabled}</p>
              <p className="text-xs text-muted-foreground mt-1">{ap.featureFlags.ffRewardEnabledDesc}</p>
            </div>
            <Switch
              checked={featureFlags.ff_reward_enabled}
              onCheckedChange={(v) => setFeatureFlags((f) => ({ ...f, ff_reward_enabled: v }))}
            />
          </div>
          <div className="flex items-center justify-between gap-4 pt-4 border-t border-border dark:border-border">
            <div>
              <p className="text-sm font-medium text-foreground/90">{ap.featureFlags.ffRewardMoneyEnabled}</p>
              <p className="text-xs text-muted-foreground mt-1">{ap.featureFlags.ffRewardMoneyEnabledDesc}</p>
            </div>
            <Switch
              checked={featureFlags.ff_reward_money_enabled}
              onCheckedChange={(v) => setFeatureFlags((f) => ({ ...f, ff_reward_money_enabled: v }))}
            />
          </div>
          <div className="flex items-center justify-between gap-4 pt-4 border-t border-border dark:border-border">
            <div>
              <p className="text-sm font-medium text-foreground/90">{ap.featureFlags.ffPartnerAds}</p>
              <p className="text-xs text-muted-foreground mt-1">{ap.featureFlags.ffPartnerAdsDesc}</p>
            </div>
            <Switch
              checked={featureFlags.ff_partner_ads_enabled}
              onCheckedChange={(v) => setFeatureFlags((f) => ({ ...f, ff_partner_ads_enabled: v }))}
            />
          </div>
          <p className="text-sm text-muted-foreground pt-2 border-t border-border dark:border-border">
            {ap.featureFlags.siteEmpty}
          </p>
        </div>
      </div>

      <div className={adm.footerActions}>
        <button type="button" onClick={handleSaveFeatureFlags} className={adm.saveBtnLg}>
          {t.common.save}
        </button>
      </div>
    </div>
  );
}
