import { Bell, BellOff, Check, Copy, ExternalLink, Link2, MapPin, Save, Send, X } from 'lucide-react';
import { LocationPicker } from '../location-picker';
import type { NotificationSettingsData } from '../../api/client';
import type { useAuth } from '../../context/AuthContext';

type AuthUser = ReturnType<typeof useAuth>['user'];

export interface ProfileNotificationsTabProps {
  user: AuthUser;
  t: {
    profile: Record<string, string>;
    notifications: Record<string, string>;
    common: { cancel: string };
  };
  isTelegramLinked: boolean;
  linkCode: string | null;
  botUrl: string;
  timeLeft: number;
  isLinking: boolean;
  codeCopied: boolean;
  notifSettings: NotificationSettingsData | null;
  notifLoading: boolean;
  notifSaving: boolean;
  localRadius: number;
  setLocalRadius: (v: number) => void;
  localWatchEnabled: boolean;
  setLocalWatchEnabled: (v: boolean) => void;
  localWatchRadius: number;
  setLocalWatchRadius: (v: number) => void;
  localWatchLocation: { lat: number; lng: number };
  setLocalWatchLocation: (v: { lat: number; lng: number }) => void;
  formatTime: (sec: number) => string;
  onRequestLink: (e?: React.MouseEvent) => void;
  onUnlink: () => void;
  onCopyCode: () => void;
  onCancelLinking: () => void;
  onToggleNotifications: (enabled: boolean) => void;
  onToggleSimilarMatches: (enabled: boolean) => void;
  onSaveNotifSettings: () => void;
}

export function ProfileNotificationsTab({
  user,
  t,
  isTelegramLinked,
  linkCode,
  botUrl,
  timeLeft,
  isLinking,
  codeCopied,
  notifSettings,
  notifLoading,
  notifSaving,
  localRadius,
  setLocalRadius,
  localWatchEnabled,
  setLocalWatchEnabled,
  localWatchRadius,
  setLocalWatchRadius,
  localWatchLocation,
  setLocalWatchLocation,
  formatTime,
  onRequestLink,
  onUnlink,
  onCopyCode,
  onCancelLinking,
  onToggleNotifications,
  onToggleSimilarMatches,
  onSaveNotifSettings,
}: ProfileNotificationsTabProps) {
  return (
    <div className="space-y-6">
      <div className="border border-gray-200 dark:border-gray-700 rounded-md p-6">
        <h3 className="font-bold text-black dark:text-white mb-2 flex items-center gap-2">
          <Send className="w-5 h-5 text-[#FF9800]" />
          {t.profile.telegram}
        </h3>
        {isTelegramLinked ? (
          <div className="mt-4 bg-orange-50 dark:bg-orange-950/20 border border-[#FF9800] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FF9800] rounded-full flex items-center justify-center shrink-0">
                  <Send className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-bold text-black dark:text-white">@{user?.telegramUsername}</div>
                  <div className="text-sm text-muted-foreground">
                    {user?.telegramLinkedAt ? new Date(user.telegramLinkedAt).toLocaleDateString('ru-RU') : ''}
                  </div>
                </div>
              </div>
              <button type="button" onClick={() => void onUnlink()} className="text-red-600 hover:text-red-700 font-medium flex items-center gap-1">
                <X className="w-4 h-4" />
                {t.profile.unlink}
              </button>
            </div>
          </div>
        ) : linkCode ? (
          <div className="mt-4 space-y-4 border border-primary/20 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg p-4">
            <p className="text-sm"><span className="font-semibold">1.</span> {t.profile.openBot} <a href={botUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline inline-flex items-center gap-1">@{botUrl.split('/').pop()} <ExternalLink className="w-3 h-3" /></a></p>
            <p className="text-sm"><span className="font-semibold">2.</span> {t.profile.sendCommand}</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-card border border-primary/20 rounded-lg px-4 py-2.5 text-base font-mono font-bold text-center">/link {linkCode}</code>
              <button type="button" onClick={onCopyCode} className="shrink-0 p-2.5 bg-card border border-primary/20 rounded-lg hover:bg-primary/10 transition-colors">{codeCopied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-primary" />}</button>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse inline-block mr-1" /> {t.profile.waiting}</span>
              <span className="font-mono text-gray-500">{formatTime(timeLeft)}</span>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={onCancelLinking} className="flex-1 px-3 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">{t.common.cancel}</button>
              <button type="button" onClick={() => void onRequestLink()} className="flex-1 px-3 py-3 text-sm text-primary border border-primary/40 rounded-lg hover:bg-primary/10 transition-colors">{t.profile.newCode}</button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => void onRequestLink()} disabled={isLinking} className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 border border-[#FF9800] text-[#FF9800] rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors disabled:opacity-70">
            <Link2 className="w-4 h-4" /> {t.profile.linkTelegram}
          </button>
        )}
      </div>

      <div className="border border-gray-200 dark:border-gray-700 rounded-md p-6">
        <div className="flex items-start gap-3 mb-4">
          <Bell className="w-5 h-5 text-[#FF9800] mt-0.5 shrink-0" />
          <div>
            <h3 className="font-bold text-black dark:text-white mb-1">{t.notifications.title}</h3>
            <p className="text-sm text-muted-foreground">{t.notifications.description}</p>
          </div>
        </div>

        {!isTelegramLinked ? (
          <div className="bg-orange-50 dark:bg-orange-950/20 border border-[#FF9800]/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <BellOff className="w-5 h-5 text-[#FF9800] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-black dark:text-white mb-1">{t.notifications.telegramNotLinked}</h4>
                <p className="text-sm text-muted-foreground">{t.notifications.telegramNotLinkedHint}</p>
              </div>
            </div>
          </div>
        ) : notifLoading ? (
          <div className="flex items-center justify-center py-8"><div className="w-6 h-6 border-2 border-[#FF9800]/30 border-t-[#FF9800] rounded-full animate-spin" /></div>
        ) : (
          <>
            <div className="mb-6">
              <label className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div>
                  <div className="font-medium text-black dark:text-white">{t.notifications.telegramNotifications}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{t.notifications.aboutNearby}</div>
                </div>
                <div className="relative">
                  <input type="checkbox" checked={!!notifSettings?.notifications_enabled} onChange={() => void onToggleNotifications(!notifSettings?.notifications_enabled)} disabled={notifSaving} className="sr-only peer" />
                  <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${notifSettings?.notifications_enabled ? 'bg-[#FF9800]' : 'bg-gray-300 dark:bg-gray-600'}`}>
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${notifSettings?.notifications_enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </div>
              </label>
            </div>
            <div className="mb-6">
              <label
                className={`flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg transition-colors ${
                  notifSettings?.notifications_enabled
                    ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800'
                    : 'opacity-60 cursor-not-allowed'
                }`}
              >
                <div>
                  <div className="font-medium text-black dark:text-white">{t.notifications.similarMatches}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{t.notifications.aboutSimilarMatches}</div>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={notifSettings?.notify_similar_matches !== false}
                    onChange={() => void onToggleSimilarMatches(!notifSettings?.notify_similar_matches)}
                    disabled={notifSaving || !notifSettings?.notifications_enabled}
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${notifSettings?.notify_similar_matches !== false && notifSettings?.notifications_enabled ? 'bg-[#FF9800]' : 'bg-gray-300 dark:bg-gray-600'}`}>
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${notifSettings?.notify_similar_matches !== false && notifSettings?.notifications_enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </div>
              </label>
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="font-medium text-black dark:text-white">{t.notifications.radius}</label>
                <span className="text-[#FF9800] font-bold">{localRadius} {t.notifications.km}</span>
              </div>
              <input type="range" min={1} max={10} step={0.5} value={localRadius} onChange={(e) => { const v = parseFloat(e.target.value); setLocalRadius(Number.isFinite(v) ? v : 1); }} className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[#FF9800] [&::-webkit-slider-runnable-track]:bg-[length:100%_100%]" style={{ background: `linear-gradient(to right, rgb(255, 152, 0) 0%, rgb(255, 152, 0) ${((Number.isFinite(localRadius) ? localRadius : 1) - 1) / 9 * 100}%, rgb(229, 231, 235) ${((Number.isFinite(localRadius) ? localRadius : 1) - 1) / 9 * 100}%, rgb(229, 231, 235) 100%)` }} />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                <span>1 {t.notifications.km}</span>
                <span>5 {t.notifications.km}</span>
                <span>10 {t.notifications.km}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-3">{t.notifications.radiusHint}</p>
            </div>

            <div className="mt-8 border-t border-gray-200 dark:border-gray-600 pt-6">
              <div className="mb-4 flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#FF9800]" aria-hidden />
                <div>
                  <h4 className="font-medium text-black dark:text-white">{t.notifications.watchZoneTitle}</h4>
                  <p className="mt-1 text-sm text-muted-foreground">{t.notifications.watchZoneHint}</p>
                </div>
              </div>
              <label
                className={`mb-4 flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-600 ${
                  notifSettings?.notifications_enabled
                    ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800'
                    : 'cursor-not-allowed opacity-60'
                }`}
              >
                <span className="font-medium text-black dark:text-white">{t.notifications.watchZoneTitle}</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={localWatchEnabled}
                    onChange={() => setLocalWatchEnabled(!localWatchEnabled)}
                    disabled={notifSaving || !notifSettings?.notifications_enabled}
                    className="sr-only peer"
                  />
                  <div className={`h-6 w-11 rounded-full transition-colors duration-200 ${localWatchEnabled && notifSettings?.notifications_enabled ? 'bg-[#FF9800]' : 'bg-gray-300 dark:bg-gray-600'}`}>
                    <div className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${localWatchEnabled && notifSettings?.notifications_enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </div>
              </label>
              {localWatchEnabled && notifSettings?.notifications_enabled && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">{t.notifications.watchZoneMapHint}</p>
                  <LocationPicker
                    initialLocation={localWatchLocation}
                    onLocationSelect={setLocalWatchLocation}
                    mapHeight="h-64"
                    radiusKm={localWatchRadius}
                    radiusBadge={`${localWatchRadius} ${t.notifications.km}`}
                  />
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <label className="font-medium text-black dark:text-white">{t.notifications.watchZoneRadius}</label>
                      <span className="font-bold text-[#FF9800]">{localWatchRadius} {t.notifications.km}</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={20}
                      step={0.5}
                      value={localWatchRadius}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        setLocalWatchRadius(Number.isFinite(v) ? v : 5);
                      }}
                      className="h-2 w-full cursor-pointer appearance-none rounded-lg accent-[#FF9800] dark:bg-gray-600"
                      style={{
                        background: `linear-gradient(to right, rgb(255, 152, 0) 0%, rgb(255, 152, 0) ${((Number.isFinite(localWatchRadius) ? localWatchRadius : 5) - 1) / 19 * 100}%, rgb(229, 231, 235) ${((Number.isFinite(localWatchRadius) ? localWatchRadius : 5) - 1) / 19 * 100}%, rgb(229, 231, 235) 100%)`,
                      }}
                    />
                    <div className="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>1 {t.notifications.km}</span>
                      <span>10 {t.notifications.km}</span>
                      <span>20 {t.notifications.km}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <button type="button" onClick={() => void onSaveNotifSettings()} disabled={notifSaving} className="w-full mt-6 flex items-center justify-center gap-2 h-12 bg-[#FF9800] text-white rounded-lg hover:bg-[#F57C00] transition-colors font-medium text-lg disabled:opacity-70">
              {notifSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-5 h-5" /> {t.notifications.saveSettings}</>}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
