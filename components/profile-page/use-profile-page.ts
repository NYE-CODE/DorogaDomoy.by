import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { telegramApi, notificationsApi, type NotificationSettingsData } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useCity } from '../../context/CityContext';
import type { City } from '../../utils/cities';
import {
  formatBelarusPhoneStorage,
  isValidBelarusMobilePhoneOptional,
} from '../../utils/belarus-phone';
import { toast } from 'sonner';
import { getSafeReturnPath } from '@/shared/lib/auth-return-path';
import { formatProfileCountdown, sanitizeTelegramBotUrl, saveUserLocation } from './profile-page-helpers';
import type { ProfileRoleDraft, ProfileTab, ProfileTranslations } from './profile-page-types';

const DEFAULT_WATCH_LOCATION = { lat: 53.9045, lng: 27.5615 };

export function useProfilePage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, updateContacts, updateProfile, changePassword, setPassword, uploadAvatar, refreshUser, deleteAccount } = useAuth();
  const { t } = useI18n();
  const pr = t.profile as typeof t.profile & ProfileTranslations;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [phone, setPhone] = useState('');
  const [telegram, setTelegram] = useState('');
  const [viber, setViber] = useState('');

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isSavingContacts, setIsSavingContacts] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [botUrl, setBotUrl] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isLinking, setIsLinking] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [helperCopied, setHelperCopied] = useState(false);
  const codeCopiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const helperCopiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [notifSettings, setNotifSettings] = useState<NotificationSettingsData | null>(null);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifSaving, setNotifSaving] = useState(false);
  const [localRadius, setLocalRadius] = useState(1);
  const [localWatchEnabled, setLocalWatchEnabled] = useState(false);
  const [localWatchRadius, setLocalWatchRadius] = useState(5);
  const [localWatchLocation, setLocalWatchLocation] = useState(DEFAULT_WATCH_LOCATION);

  const { selectedCity, saveCity, clearCity } = useCity();
  const [showCityModal, setShowCityModal] = useState(false);

  const [activeTab, setActiveTab] = useState<ProfileTab>('personal');
  const [roleDraft, setRoleDraft] = useState<ProfileRoleDraft>('user');
  const [volunteerConfirmOpen, setVolunteerConfirmOpen] = useState(false);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'notifications' || tab === 'security' || tab === 'personal') {
      setActiveTab(tab);
    } else {
      setActiveTab('personal');
    }
  }, [searchParams]);

  const isTelegramLinked = !!user?.telegramId;

  const resolveTelegramContactForSave = useCallback((): string | undefined => {
    if (!isTelegramLinked) return undefined;
    const u = user?.telegramUsername?.trim();
    if (u) return `@${u}`;
    return user?.contacts?.telegram?.trim() || undefined;
  }, [isTelegramLinked, user?.telegramUsername, user?.contacts?.telegram]);

  const handleCityModalSelect = useCallback((city: City | null) => {
    if (city) {
      saveCity(city.coordinates[0], city.coordinates[1], city.name);
      saveUserLocation({ lat: city.coordinates[0], lng: city.coordinates[1] }, city.name);
    } else {
      clearCity();
    }
    setShowCityModal(false);
  }, [saveCity, clearCity]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.contacts?.phone || '');
      setTelegram(user.contacts?.telegram || '');
      setViber(user.contacts?.viber || '');
      setRoleDraft(user.role === 'volunteer' ? 'volunteer' : 'user');
    }
  }, [user]);

  useEffect(() => {
    if (isTelegramLinked) {
      setNotifLoading(true);
      notificationsApi.getSettings()
        .then((s) => {
          setNotifSettings(s);
          const r = Number(s.notification_radius_km);
          setLocalRadius(
            Number.isFinite(r) ? Math.min(10, Math.max(1, r)) : 5,
          );
          setLocalWatchEnabled(!!s.watch_zone_enabled);
          const wr = Number(s.watch_radius_km);
          setLocalWatchRadius(Number.isFinite(wr) ? Math.min(20, Math.max(1, wr)) : 5);
          if (s.home_lat != null && s.home_lng != null) {
            setLocalWatchLocation({ lat: s.home_lat, lng: s.home_lng });
          } else {
            try {
              const raw = localStorage.getItem('pet_finder_user_location');
              if (raw) {
                const data = JSON.parse(raw) as { lat?: number; lng?: number };
                if (typeof data.lat === 'number' && typeof data.lng === 'number') {
                  setLocalWatchLocation({ lat: data.lat, lng: data.lng });
                }
              }
            } catch {
              /* ignore */
            }
          }
        })
        .catch((err: unknown) => {
          console.warn('[ProfilePage] notification settings load failed', err);
        })
        .finally(() => setNotifLoading(false));
    }
  }, [isTelegramLinked]);

  const cleanupLinking = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    pollRef.current = null;
    timerRef.current = null;
  }, []);

  useEffect(() => () => cleanupLinking(), [cleanupLinking]);

  useEffect(() => () => {
    if (codeCopiedTimerRef.current) clearTimeout(codeCopiedTimerRef.current);
    if (helperCopiedTimerRef.current) clearTimeout(helperCopiedTimerRef.current);
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      toast.error(t.auth.nameMinLength);
      return;
    }
    setIsSavingProfile(true);
    try {
      await updateProfile(name, email);
      toast.success(t.profile.profileUpdated);
    } catch (err: unknown) {
      console.warn('[ProfilePage] updateProfile failed', err);
      toast.error(t.profile.profileUpdateError);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasPassword = user?.passwordSet !== false;
    if (hasPassword && !currentPassword.trim()) {
      toast.error(t.profile.currentPasswordPlaceholder);
      return;
    }
    if (newPassword !== confirmPassword) { toast.error(t.profile.passwordsNotMatch); return; }
    if (newPassword.length < 6) { toast.error(t.auth.passwordMinLength); return; }
    setIsSavingPassword(true);
    try {
      if (hasPassword) {
        await changePassword(currentPassword, newPassword);
      } else {
        await setPassword(newPassword);
      }
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      toast.success(t.profile.passwordChanged);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.profile.wrongPassword);
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      `${t.profile.deleteAccountTitle}\n\n${t.profile.deleteAccountBody}`,
    );
    if (!confirmed) return;
    setIsDeletingAccount(true);
    try {
      await deleteAccount();
      navigate('/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.profile.deleteAccountError);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleSaveContacts = async (e: React.FormEvent) => {
    e.preventDefault();
    const tgContact = resolveTelegramContactForSave();
    if (!phone && !tgContact && !viber) { toast.error(t.profile.atLeastOneContact); return; }
    if (!isValidBelarusMobilePhoneOptional(phone)) { toast.error(t.profile.belarusPhoneInvalid); return; }
    if (!isValidBelarusMobilePhoneOptional(viber)) { toast.error(t.profile.belarusPhoneInvalid); return; }
    setIsSavingContacts(true);
    try {
      await updateContacts({
        phone: phone.trim() ? (formatBelarusPhoneStorage(phone) ?? undefined) : undefined,
        telegram: tgContact,
        viber: viber.trim() ? (formatBelarusPhoneStorage(viber) ?? undefined) : undefined,
      });
      toast.success(t.profile.contactsUpdated);
    } catch (err: unknown) {
      console.warn('[ProfilePage] updateContacts failed', err);
      toast.error(t.common.error);
    }
    finally { setIsSavingContacts(false); }
  };

  const performPersonalSave = async (opts?: { roleVolunteer?: boolean }) => {
    const tgContact = resolveTelegramContactForSave();
    await updateProfile(
      name,
      email,
      opts?.roleVolunteer ? { role: 'volunteer' } : undefined,
    );
    await updateContacts({
      phone: phone.trim() ? (formatBelarusPhoneStorage(phone) ?? undefined) : undefined,
      telegram: tgContact,
      viber: viber.trim() ? (formatBelarusPhoneStorage(viber) ?? undefined) : undefined,
    });
    toast.success(t.profile.profileUpdated);
    const returnPath = getSafeReturnPath(
      (location.state as { fromProtected?: string } | null)?.fromProtected,
    );
    if (returnPath) {
      navigate(returnPath, { replace: true });
    }
  };

  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      toast.error(t.auth.nameMinLength);
      return;
    }
    const tgContact = resolveTelegramContactForSave();
    if (!phone && !tgContact && !viber) {
      toast.error(t.profile.atLeastOneContact);
      return;
    }
    if (!isValidBelarusMobilePhoneOptional(phone)) { toast.error(t.profile.belarusPhoneInvalid); return; }
    if (!isValidBelarusMobilePhoneOptional(viber)) { toast.error(t.profile.belarusPhoneInvalid); return; }

    const upgradingVolunteer =
      user?.role === 'user' && roleDraft === 'volunteer';

    if (upgradingVolunteer) {
      setVolunteerConfirmOpen(true);
      return;
    }

    setIsSavingProfile(true);
    try {
      await performPersonalSave();
    } catch (err: unknown) {
      console.warn('[ProfilePage] handleSavePersonal failed', err);
      toast.error(t.profile.profileUpdateError);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleConfirmVolunteerUpgrade = async () => {
    setVolunteerConfirmOpen(false);
    setIsSavingProfile(true);
    try {
      await performPersonalSave({ roleVolunteer: true });
    } catch (err: unknown) {
      console.warn('[ProfilePage] volunteer upgrade save failed', err);
      toast.error(t.profile.profileUpdateError);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleRequestLink = async (e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    cleanupLinking();
    setIsLinking(true);
    try {
      const resp = await telegramApi.requestLink();
      const safeBotUrl = sanitizeTelegramBotUrl(resp.bot_url);
      if (!safeBotUrl) {
        toast.error(t.profile.linkCodeError);
        setIsLinking(false);
        return;
      }
      setLinkCode(resp.code);
      setBotUrl(safeBotUrl);
      const ttlRaw = Number(resp.expires_in);
      const safeTtl =
        Number.isFinite(ttlRaw) && ttlRaw > 0 ? ttlRaw : 300;
      const expiresAt = Date.now() + safeTtl * 1000;
      setTimeLeft(safeTtl);
      timerRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
        setTimeLeft(remaining);
        if (remaining <= 0) { cleanupLinking(); setLinkCode(null); setIsLinking(false); }
      }, 1000);
      pollRef.current = setInterval(async () => {
        try {
          const status = await telegramApi.checkStatus();
          if (status.linked) {
            cleanupLinking(); setLinkCode(null); setIsLinking(false);
            await refreshUser();
            toast.success(t.profile.telegramLinked);
          }
        } catch (err: unknown) {
          console.warn('[ProfilePage] telegram link poll failed', err);
        }
      }, 3000);
    } catch (err) {
      if (import.meta.env.DEV && err instanceof Error) console.warn('[telegram requestLink]', err);
      toast.error(t.profile.linkCodeError);
      setIsLinking(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    e.target.value = '';
    setIsUploadingAvatar(true);
    try {
      await uploadAvatar(file);
      toast.success(t.profile.avatarUploaded);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.common.toasts.photoUploadError);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleUnlink = async () => {
    if (!confirm(t.profile.unlinkConfirm)) return;
    try {
      await telegramApi.unlink();
      await refreshUser();
      setNotifSettings(null);
      toast.success(t.profile.telegramUnlinked);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : t.profile.unlinkError;
      toast.error(message || t.profile.unlinkError);
    }
  };

  const handleCopyCode = () => {
    if (!linkCode) return;
    navigator.clipboard.writeText(`/link ${linkCode}`);
    setCodeCopied(true);
    if (codeCopiedTimerRef.current) clearTimeout(codeCopiedTimerRef.current);
    codeCopiedTimerRef.current = setTimeout(() => {
      codeCopiedTimerRef.current = null;
      setCodeCopied(false);
    }, 2000);
  };

  const handleCopyHelperCode = async () => {
    const code = user?.helperCode?.trim();
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setHelperCopied(true);
      if (helperCopiedTimerRef.current) clearTimeout(helperCopiedTimerRef.current);
      helperCopiedTimerRef.current = setTimeout(() => {
        helperCopiedTimerRef.current = null;
        setHelperCopied(false);
      }, 2000);
    } catch {
      toast.error(t.common.error);
    }
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    setNotifSaving(true);
    try {
      const updated = await notificationsApi.updateSettings({ notifications_enabled: enabled });
      setNotifSettings(updated);
      toast.success(enabled ? t.notifications.enabled : t.notifications.disabled);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : t.common.error;
      toast.error(message || t.common.error);
    }
    finally { setNotifSaving(false); }
  };

  const handleToggleSimilarMatches = async (enabled: boolean) => {
    setNotifSaving(true);
    try {
      const updated = await notificationsApi.updateSettings({ notify_similar_matches: enabled });
      setNotifSettings(updated);
      toast.success(
        enabled ? t.notifications.similarMatchesEnabled : t.notifications.similarMatchesDisabled,
      );
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : t.common.error;
      toast.error(message || t.common.error);
    }
    finally { setNotifSaving(false); }
  };

  const handleSaveNotifSettings = async () => {
    setNotifSaving(true);
    try {
      const radius = Number.isFinite(localRadius)
        ? Math.min(10, Math.max(1, localRadius))
        : 5;
      const watchRadius = Number.isFinite(localWatchRadius)
        ? Math.min(20, Math.max(1, localWatchRadius))
        : 5;
      const updated = await notificationsApi.updateSettings({
        notification_radius_km: radius,
        watch_zone_enabled: localWatchEnabled,
        watch_radius_km: watchRadius,
        home_lat: localWatchEnabled ? localWatchLocation.lat : undefined,
        home_lng: localWatchEnabled ? localWatchLocation.lng : undefined,
      });
      setNotifSettings(updated);
      toast.success(t.notifications.settingsSaved);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : t.common.error;
      toast.error(message || t.common.error);
    }
    finally { setNotifSaving(false); }
  };

  const hasAnyContact = phone || viber || isTelegramLinked || telegram;

  return {
    user,
    t,
    pr,
    selectedCity,
    showCityModal,
    setShowCityModal,
    handleCityModalSelect,
    activeTab,
    setActiveTab,
    volunteerConfirmOpen,
    setVolunteerConfirmOpen,
    name,
    setName,
    email,
    setEmail,
    phone,
    setPhone,
    viber,
    setViber,
    roleDraft,
    setRoleDraft,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showCurrentPw,
    setShowCurrentPw,
    showNewPw,
    setShowNewPw,
    showConfirmPw,
    setShowConfirmPw,
    isSavingProfile,
    isSavingPassword,
    isDeletingAccount,
    isSavingContacts,
    isUploadingAvatar,
    isTelegramLinked,
    linkCode,
    botUrl,
    timeLeft,
    isLinking,
    codeCopied,
    helperCopied,
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
    hasAnyContact,
    handleSaveProfile,
    handleSavePassword,
    handleDeleteAccount,
    handleSaveContacts,
    handleSavePersonal,
    handleConfirmVolunteerUpgrade,
    handleRequestLink,
    handleAvatarUpload,
    handleUnlink,
    handleCopyCode,
    handleCopyHelperCode,
    handleToggleNotifications,
    handleToggleSimilarMatches,
    handleSaveNotifSettings,
    cleanupLinking,
    setLinkCode,
    setIsLinking,
    formatTime: formatProfileCountdown,
  };
}
