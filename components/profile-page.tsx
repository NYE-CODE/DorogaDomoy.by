import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { User, Mail, Phone, MessageCircle, Save, AlertCircle, Lock, Edit2, Shield, Link2, Unlink, Bell, BellOff, Copy, Check, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { telegramApi, notificationsApi, type NotificationSettingsData } from '../api/client';
import { toast } from 'sonner';
import { Header } from './layout/Header';
import { CitySelectModal } from './city-select-modal';
import type { City } from '../utils/cities';

const roleLabels: Record<string, string> = {
  user: 'Пользователь',
  volunteer: 'Волонтёр',
  shelter: 'Приют',
  admin: 'Администратор'
};

const roleColors: Record<string, string> = {
  user: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  volunteer: 'bg-blue-100 text-blue-700',
  shelter: 'bg-purple-100 text-purple-700',
  admin: 'bg-red-100 text-red-700'
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateContacts, updateProfile, refreshUser } = useAuth();
  const { t } = useI18n();
  
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
  const [isSavingContacts, setIsSavingContacts] = useState(false);

  // Telegram linking
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [botUrl, setBotUrl] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isLinking, setIsLinking] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Notification settings
  const [notifSettings, setNotifSettings] = useState<NotificationSettingsData | null>(null);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifSaving, setNotifSaving] = useState(false);
  const [localRadius, setLocalRadius] = useState(1);

  const [selectedCity, setSelectedCity] = useState(() => {
    try {
      const saved = localStorage.getItem('pet_finder_user_location');
      if (saved) {
        const data = JSON.parse(saved);
        return (data.city || '').trim();
      }
    } catch {}
    return '';
  });
  const [showCityModal, setShowCityModal] = useState(false);

  const isTelegramLinked = !!user?.telegramId;

  const saveUserLocation = useCallback((loc: { lat: number; lng: number }, city?: string) => {
    try {
      const toSave: { lat: number; lng: number; city?: string } = { lat: loc.lat, lng: loc.lng };
      if (city) toSave.city = city;
      localStorage.setItem('pet_finder_user_location', JSON.stringify(toSave));
    } catch {}
  }, []);

  const handleCityModalSelect = useCallback((city: City | null) => {
    if (city) {
      setSelectedCity(city.name);
      saveUserLocation({ lat: city.coordinates[0], lng: city.coordinates[1] }, city.name);
    } else {
      setSelectedCity('');
      try { localStorage.removeItem('pet_finder_user_location'); } catch {}
    }
    try { localStorage.setItem('pet_finder_city_confirmed', 'true'); } catch {}
    setShowCityModal(false);
  }, [saveUserLocation]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.contacts?.phone || '');
      setTelegram(user.contacts?.telegram || '');
      setViber(user.contacts?.viber || '');
    }
  }, [user]);

  useEffect(() => {
    if (isTelegramLinked) {
      setNotifLoading(true);
      notificationsApi.getSettings()
        .then((s) => {
          setNotifSettings(s);
          setLocalRadius(s.notification_radius_km);
        })
        .catch(() => {})
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

  // --- Handlers ---

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
    } catch {
      toast.error(t.profile.profileUpdateError);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error(t.profile.passwordsNotMatch); return; }
    if (newPassword.length < 6) { toast.error(t.auth.passwordMinLength); return; }
    setIsSavingPassword(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    setIsSavingPassword(false);
    toast.success(t.profile.passwordChanged);
  };

  const handleSaveContacts = async (e: React.FormEvent) => {
    e.preventDefault();
    const tgContact = isTelegramLinked ? `@${user?.telegramUsername}` : undefined;
    if (!phone && !tgContact && !viber) { toast.error(t.profile.atLeastOneContact); return; }
    setIsSavingContacts(true);
    try {
      await updateContacts({ phone: phone || undefined, telegram: tgContact, viber: viber || undefined });
      toast.success(t.profile.contactsUpdated);
    } catch { toast.error(t.common.error); }
    finally { setIsSavingContacts(false); }
  };

  const handleRequestLink = async (e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    cleanupLinking();
    setIsLinking(true);
    try {
      const resp = await telegramApi.requestLink();
      setLinkCode(resp.code);
      setBotUrl(resp.bot_url);
      const expiresAt = Date.now() + resp.expires_in * 1000;
      setTimeLeft(resp.expires_in);
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
        } catch {}
      }, 3000);
    } catch (err: any) {
      toast.error(err.message || t.profile.linkCodeError);
      setIsLinking(false);
    }
  };

  const handleUnlink = async () => {
    if (!confirm(t.profile.unlinkConfirm)) return;
    try {
      await telegramApi.unlink();
      await refreshUser();
      setNotifSettings(null);
      toast.success(t.profile.telegramUnlinked);
    } catch (e: any) { toast.error(e.message || t.profile.unlinkError); }
  };

  const handleCopyCode = () => {
    if (!linkCode) return;
    navigator.clipboard.writeText(`/link ${linkCode}`);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    setNotifSaving(true);
    try {
      const updated = await notificationsApi.updateSettings({ notifications_enabled: enabled });
      setNotifSettings(updated);
      toast.success(enabled ? t.notifications.enabled : t.notifications.disabled);
    } catch (e: any) { toast.error(e.message || t.common.error); }
    finally { setNotifSaving(false); }
  };

  const handleSaveNotifSettings = async () => {
    setNotifSaving(true);
    try {
      const updated = await notificationsApi.updateSettings({ notification_radius_km: localRadius });
      setNotifSettings(updated);
      toast.success(t.notifications.settingsSaved);
    } catch (e: any) { toast.error(e.message || t.common.error); }
    finally { setNotifSaving(false); }
  };

  const formatTime = (sec: number) => `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;

  const hasAnyContact = phone || viber || isTelegramLinked || telegram;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header
        onViewChange={() => navigate('/')}
        selectedCity={selectedCity}
        onCityClick={() => setShowCityModal(true)}
      />

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 md:px-6 py-8 space-y-6">
        {/* Profile Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User className="w-8 h-8 text-white" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{user?.name}</h2>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mt-1">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{user?.email}</span>
              </div>
              {user?.role && (
                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full mt-2 ${roleColors[user.role]}`}>
                  <Shield className="w-3 h-3" />
                  {t.profile.roles[user.role as keyof typeof t.profile.roles]}
                </span>
              )}
            </div>
          </div>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Edit2 className="w-5 h-5" /> {t.profile.personalInfo}</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.profile.nameLabel}</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-500 dark:placeholder-gray-400" placeholder={t.profile.namePlaceholder} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.profile.emailLabel}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-500 dark:placeholder-gray-400" placeholder="email@example.by" />
              </div>
            </div>
            <button type="submit" disabled={isSavingProfile} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 active:scale-[0.98] transition-all font-medium disabled:opacity-70">
              {isSavingProfile ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> {t.profile.saveChanges}</>}
            </button>
          </form>
        </div>

        {/* Password */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Lock className="w-5 h-5" /> {t.profile.changePassword}</h3>
          <form onSubmit={handleSavePassword} className="space-y-4">
            <input type="hidden" autoComplete="username" value={user?.email || ''} readOnly />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.profile.currentPassword}</label>
              <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" /><input type="password" autoComplete="current-password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-500 dark:placeholder-gray-400" placeholder="••••••••" /></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.profile.newPassword}</label>
              <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" /><input type="password" autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-500 dark:placeholder-gray-400" placeholder="••••••••" /></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.profile.confirmPassword}</label>
              <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" /><input type="password" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-500 dark:placeholder-gray-400" placeholder="••••••••" /></div>
            </div>
            <button type="submit" disabled={isSavingPassword || !currentPassword || !newPassword || !confirmPassword} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 active:scale-[0.98] transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed">
              {isSavingPassword ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> {t.profile.changePassword}</>}
            </button>
          </form>
        </div>

        {/* Contacts Warning */}
        {!hasAnyContact && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-900 dark:text-amber-300 mb-1">{t.profile.addContacts}</h3>
              <p className="text-sm text-amber-800 dark:text-amber-400">{t.profile.addContactsDescription}</p>
            </div>
          </div>
        )}

        {/* Contacts */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{t.profile.contacts}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{t.profile.contactsDescription}</p>
          <div className="space-y-5">
            <form onSubmit={handleSaveContacts} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.profile.phone}</label>
                <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" /><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-500 dark:placeholder-gray-400" placeholder="+375291234567" /></div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.profile.viber}</label>
                <div className="relative"><MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" /><input type="tel" value={viber} onChange={e => setViber(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-500 dark:placeholder-gray-400" placeholder="+375291234567" /></div>
              </div>
              <button type="submit" disabled={isSavingContacts} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 active:scale-[0.98] transition-all font-medium disabled:opacity-70">
                {isSavingContacts ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> {t.profile.saveContacts}</>}
              </button>
            </form>

            {/* Telegram — linking (outside form to prevent accidental form submission) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.profile.telegram}</label>
              {isTelegramLinked ? (
                <div className="flex items-center justify-between gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center gap-3 min-w-0">
                    <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900 dark:text-white">@{user?.telegramUsername}</span>
                      </div>
                      {user?.telegramLinkedAt && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{new Date(user.telegramLinkedAt).toLocaleDateString('ru-RU')}</p>}
                    </div>
                  </div>
                  <button type="button" onClick={handleUnlink} className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <Unlink className="w-3.5 h-3.5" /> {t.profile.unlink}
                  </button>
                </div>
              ) : linkCode ? (
                <div className="space-y-4 border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg p-4">
                  <div>
                    <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">
                      <span className="font-semibold">1.</span> {t.profile.openBot} <a href={botUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 underline inline-flex items-center gap-1">@{botUrl.split('/').pop()} <ExternalLink className="w-3 h-3" /></a>
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-300"><span className="font-semibold">2.</span> {t.profile.sendCommand}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2.5 text-base font-mono font-bold text-blue-900 dark:text-blue-300 text-center tracking-wider">/link {linkCode}</code>
                    <button type="button" onClick={handleCopyCode} className="shrink-0 p-2.5 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors" title="Копировать">
                      {codeCopied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-blue-600" />}
                    </button>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse inline-block" /> {t.profile.waiting}</span>
                      <span className="text-gray-500 dark:text-gray-400 font-mono">{formatTime(timeLeft)}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1">
                      <div className="bg-blue-500 h-1 rounded-full transition-all duration-1000" style={{ width: `${(timeLeft / 300) * 100}%` }} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { cleanupLinking(); setLinkCode(null); setIsLinking(false); }} className="flex-1 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">{t.common.cancel}</button>
                    <button type="button" onClick={handleRequestLink} className="flex-1 px-3 py-1.5 text-sm text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">{t.profile.newCode}</button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={handleRequestLink} disabled={isLinking} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-70">
                  <Link2 className="w-4 h-4" /> {t.profile.linkTelegram}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            {t.notifications.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">{t.notifications.description}</p>

          {!isTelegramLinked ? (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
              <BellOff className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-900 dark:text-amber-300 mb-1">{t.notifications.telegramNotLinked}</h4>
                <p className="text-sm text-amber-800 dark:text-amber-400">{t.notifications.telegramNotLinkedHint}</p>
              </div>
            </div>
          ) : notifLoading ? (
            <div className="flex items-center justify-center py-8"><div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div>
          ) : (
            <div className="space-y-6">
              {/* Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{t.notifications.telegramNotifications}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.notifications.aboutNearby}</p>
                </div>
                <button type="button" onClick={() => handleToggleNotifications(!notifSettings?.notifications_enabled)} disabled={notifSaving}
                  className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${notifSettings?.notifications_enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                  <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white dark:bg-gray-800 rounded-full shadow transition-transform duration-200 ${notifSettings?.notifications_enabled ? 'translate-x-7' : ''}`} />
                </button>
              </div>

              {/* Radius */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">{t.notifications.radius}</h4>
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">{localRadius} {t.notifications.km}</span>
                </div>
                <input type="range" min={1} max={10} step={0.5} value={localRadius} onChange={e => setLocalRadius(parseFloat(e.target.value))} className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1"><span>1 {t.notifications.km}</span><span>5 {t.notifications.km}</span><span>10 {t.notifications.km}</span></div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{t.notifications.radiusHint}</p>
              </div>

              <button type="button" onClick={handleSaveNotifSettings} disabled={notifSaving} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 active:scale-[0.98] transition-all font-medium disabled:opacity-70">
                {notifSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> {t.notifications.saveSettings}</>}
              </button>
            </div>
          )}
        </div>
      </div>

      <CitySelectModal
        open={showCityModal}
        onClose={() => setShowCityModal(false)}
        onSelect={handleCityModalSelect}
        currentCity={selectedCity}
      />
    </div>
  );
}
