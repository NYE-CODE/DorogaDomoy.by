import { Bell, BellOff, Check, Copy, ExternalLink, Link2, MapPin, Save, Send, X } from 'lucide-react';
import { LocationPicker } from '../location-picker';
import type { NotificationSettingsData } from '../../api/client';
import type { useAuth } from '../../context/AuthContext';
import { cn } from '@/shared/lib/classNames';
import {
  surfaceCtaOutline,
  surfaceCtaPrimary,
  surfaceSelectRow,
} from '@/shared/styles/surface-classes';

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

function ToggleSwitch({
  checked,
  disabled,
}: {
  checked: boolean;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        'relative h-6 w-11 rounded-full transition-colors duration-200',
        checked ? 'bg-primary' : 'bg-muted',
        disabled && 'opacity-60',
      )}
      aria-hidden
    >
      <div
        className={cn(
          'absolute top-0.5 left-0.5 size-5 rounded-full bg-card shadow transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </div>
  );
}

function SectionCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-2xl border border-border bg-card p-5 sm:p-6', className)}>
      {children}
    </div>
  );
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
  const radiusPct = ((Number.isFinite(localRadius) ? localRadius : 1) - 1) / 9 * 100;
  const watchPct = ((Number.isFinite(localWatchRadius) ? localWatchRadius : 5) - 1) / 19 * 100;

  return (
    <div className="space-y-6">
      <SectionCard>
        <h3 className="mb-2 flex items-center gap-2 font-semibold text-foreground">
          <Send className="size-5 text-primary" aria-hidden />
          {t.profile.telegram}
        </h3>
        {isTelegramLinked ? (
          <div className="mt-4 rounded-2xl border border-primary/25 bg-primary/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-landing-dark">
                  <Send className="size-5" aria-hidden />
                </div>
                <div className="min-w-0">
                  <div className="truncate font-semibold text-foreground">@{user?.telegramUsername}</div>
                  <div className="text-sm text-muted-foreground">
                    {user?.telegramLinkedAt
                      ? new Date(user.telegramLinkedAt).toLocaleDateString('ru-RU')
                      : ''}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void onUnlink()}
                className="inline-flex shrink-0 items-center gap-1 font-medium text-destructive hover:underline"
              >
                <X className="size-4" aria-hidden />
                {t.profile.unlink}
              </button>
            </div>
          </div>
        ) : linkCode ? (
          <div className="mt-4 space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm">
              <span className="font-semibold">1.</span> {t.profile.openBot}{' '}
              <a
                href={botUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-primary underline"
              >
                @{botUrl.split('/').pop()} <ExternalLink className="size-3" aria-hidden />
              </a>
            </p>
            <p className="text-sm">
              <span className="font-semibold">2.</span> {t.profile.sendCommand}
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-xl border border-primary/20 bg-card px-4 py-2.5 text-center font-mono text-base font-bold">
                /link {linkCode}
              </code>
              <button
                type="button"
                onClick={onCopyCode}
                className="shrink-0 rounded-xl border border-primary/20 bg-card p-2.5 transition-colors hover:bg-primary/10"
              >
                {codeCopied ? (
                  <Check className="size-4 text-primary" aria-hidden />
                ) : (
                  <Copy className="size-4 text-primary" aria-hidden />
                )}
              </button>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                <span className="mr-1 inline-block size-1.5 animate-pulse rounded-full bg-primary" />{' '}
                {t.profile.waiting}
              </span>
              <span className="font-mono text-muted-foreground">{formatTime(timeLeft)}</span>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={onCancelLinking} className={cn(surfaceCtaOutline, 'flex-1 text-sm')}>
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={() => void onRequestLink()}
                className={cn(surfaceCtaOutline, 'flex-1 border-primary/40 text-primary text-sm hover:bg-primary/10')}
              >
                {t.profile.newCode}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => void onRequestLink()}
            disabled={isLinking}
            className={cn(surfaceCtaOutline, 'mt-4 border-primary/50 text-primary hover:bg-primary/10')}
          >
            <Link2 className="size-4" aria-hidden /> {t.profile.linkTelegram}
          </button>
        )}
      </SectionCard>

      <SectionCard>
        <div className="mb-4 flex items-start gap-3">
          <Bell className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <div>
            <h3 className="mb-1 font-semibold text-foreground">{t.notifications.title}</h3>
            <p className="text-sm text-muted-foreground">{t.notifications.description}</p>
          </div>
        </div>

        {!isTelegramLinked ? (
          <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <BellOff className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
              <div>
                <h4 className="mb-1 font-medium text-foreground">{t.notifications.telegramNotLinked}</h4>
                <p className="text-sm text-muted-foreground">{t.notifications.telegramNotLinkedHint}</p>
              </div>
            </div>
          </div>
        ) : notifLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="size-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          </div>
        ) : (
          <>
            <div className="mb-6">
              <label className={cn(surfaceSelectRow, 'justify-between')}>
                <div>
                  <div className="font-medium text-foreground">{t.notifications.telegramNotifications}</div>
                  <div className="text-sm text-muted-foreground">{t.notifications.aboutNearby}</div>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={!!notifSettings?.notifications_enabled}
                    onChange={() => void onToggleNotifications(!notifSettings?.notifications_enabled)}
                    disabled={notifSaving}
                    className="peer sr-only"
                  />
                  <ToggleSwitch checked={!!notifSettings?.notifications_enabled} disabled={notifSaving} />
                </div>
              </label>
            </div>

            <div className="mb-6">
              <label
                className={cn(
                  surfaceSelectRow,
                  'justify-between',
                  !notifSettings?.notifications_enabled && 'cursor-not-allowed opacity-60 hover:bg-card',
                )}
              >
                <div>
                  <div className="font-medium text-foreground">{t.notifications.similarMatches}</div>
                  <div className="text-sm text-muted-foreground">{t.notifications.aboutSimilarMatches}</div>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={notifSettings?.notify_similar_matches !== false}
                    onChange={() => void onToggleSimilarMatches(!notifSettings?.notify_similar_matches)}
                    disabled={notifSaving || !notifSettings?.notifications_enabled}
                    className="peer sr-only"
                  />
                  <ToggleSwitch
                    checked={
                      notifSettings?.notify_similar_matches !== false &&
                      !!notifSettings?.notifications_enabled
                    }
                    disabled={notifSaving || !notifSettings?.notifications_enabled}
                  />
                </div>
              </label>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="font-medium text-foreground">{t.notifications.radius}</label>
                <span className="font-bold text-primary">
                  {localRadius} {t.notifications.km}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={0.5}
                value={localRadius}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setLocalRadius(Number.isFinite(v) ? v : 1);
                }}
                className="h-2 w-full cursor-pointer appearance-none rounded-full accent-primary"
                style={{
                  background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${radiusPct}%, var(--color-bg-landing-muted) ${radiusPct}%, var(--color-bg-landing-muted) 100%)`,
                }}
              />
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>1 {t.notifications.km}</span>
                <span>5 {t.notifications.km}</span>
                <span>10 {t.notifications.km}</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{t.notifications.radiusHint}</p>
            </div>

            <div className="mt-8 border-t border-border pt-6">
              <div className="mb-4 flex items-start gap-3">
                <MapPin className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                <div>
                  <h4 className="font-medium text-foreground">{t.notifications.watchZoneTitle}</h4>
                  <p className="mt-1 text-sm text-muted-foreground">{t.notifications.watchZoneHint}</p>
                </div>
              </div>
              <label
                className={cn(
                  surfaceSelectRow,
                  'mb-4 justify-between',
                  !notifSettings?.notifications_enabled && 'cursor-not-allowed opacity-60 hover:bg-card',
                )}
              >
                <span className="font-medium text-foreground">{t.notifications.watchZoneTitle}</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={localWatchEnabled}
                    onChange={() => setLocalWatchEnabled(!localWatchEnabled)}
                    disabled={notifSaving || !notifSettings?.notifications_enabled}
                    className="peer sr-only"
                  />
                  <ToggleSwitch
                    checked={localWatchEnabled && !!notifSettings?.notifications_enabled}
                    disabled={notifSaving || !notifSettings?.notifications_enabled}
                  />
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
                      <label className="font-medium text-foreground">{t.notifications.watchZoneRadius}</label>
                      <span className="font-bold text-primary">
                        {localWatchRadius} {t.notifications.km}
                      </span>
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
                      className="h-2 w-full cursor-pointer appearance-none rounded-full accent-primary"
                      style={{
                        background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${watchPct}%, var(--color-bg-landing-muted) ${watchPct}%, var(--color-bg-landing-muted) 100%)`,
                      }}
                    />
                    <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                      <span>1 {t.notifications.km}</span>
                      <span>10 {t.notifications.km}</span>
                      <span>20 {t.notifications.km}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => void onSaveNotifSettings()}
              disabled={notifSaving}
              className={cn(surfaceCtaPrimary, 'mt-6')}
            >
              {notifSaving ? (
                <div className="size-5 animate-spin rounded-full border-2 border-landing-dark/30 border-t-landing-dark" />
              ) : (
                <>
                  <Save className="size-5" aria-hidden />
                  {t.notifications.saveSettings}
                </>
              )}
            </button>
          </>
        )}
      </SectionCard>
    </div>
  );
}
