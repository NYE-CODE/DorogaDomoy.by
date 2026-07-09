import { Switch } from '../ui/switch';
import { adm } from '../admin-panel-chrome';

export interface AdminInstagramSettingsSectionProps {
  ig: Record<string, string>;
  instagramAutopublishEnabled: boolean;
  setInstagramAutopublishEnabled: (v: boolean) => void;
  instagramStoryEnabled: boolean;
  setInstagramStoryEnabled: (v: boolean) => void;
  instagramManualWhenAutoOff: boolean;
  setInstagramManualWhenAutoOff: (v: boolean) => void;
  busy: boolean;
  onSave: () => void;
}

export function AdminInstagramSettingsSection({
  ig,
  instagramAutopublishEnabled,
  setInstagramAutopublishEnabled,
  instagramStoryEnabled,
  setInstagramStoryEnabled,
  instagramManualWhenAutoOff,
  setInstagramManualWhenAutoOff,
  busy,
  onSave,
}: AdminInstagramSettingsSectionProps) {
  return (
    <div className={adm.settingsCard}>
      <h3 className={adm.settingsCardTitle}>{ig.modeTitle}</h3>
      <div className="mt-4 space-y-4">
        <label className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-foreground/90">{ig.modeAutopublish}</span>
          <Switch
            checked={instagramAutopublishEnabled}
            onCheckedChange={setInstagramAutopublishEnabled}
          />
        </label>
        <label className="flex items-center justify-between gap-4 pt-4 border-t border-border dark:border-border">
          <span className="text-sm font-medium text-foreground/90">{ig.modeStory}</span>
          <Switch checked={instagramStoryEnabled} onCheckedChange={setInstagramStoryEnabled} />
        </label>
        <label className="flex items-center justify-between gap-4 pt-4 border-t border-border dark:border-border">
          <span className="text-sm font-medium text-foreground/90">{ig.modeManualWhenAutoOff}</span>
          <Switch
            checked={instagramManualWhenAutoOff}
            onCheckedChange={setInstagramManualWhenAutoOff}
          />
        </label>
      </div>
      <button
        type="button"
        className={`${adm.primaryBtn} mt-5 disabled:opacity-60`}
        onClick={onSave}
        disabled={busy}
      >
        {ig.saveSettings}
      </button>
    </div>
  );
}
