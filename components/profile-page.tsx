import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { User, Mail, Phone, MessageCircle, Save, Lock, Link2, Unlink, Bell, BellOff, Copy, Check, ExternalLink, Camera, Send, X, Eye, EyeOff } from 'lucide-react';
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
  volunteer: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
  shelter: 'bg-purple-100 text-purple-700',
  admin: 'bg-primary/10 dark:bg-primary/20 text-primary'
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

  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

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

  type ProfileTab = 'personal' | 'security' | 'notifications';
  const [activeTab, setActiveTab] = useState<ProfileTab>('personal');

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

  /** Сохранить профиль + контакты одной кнопкой (таб «Личные данные») */
  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      toast.error(t.auth.nameMinLength);
      return;
    }
    const tgContact = isTelegramLinked ? `@${user?.telegramUsername}` : undefined;
    if (!phone && !tgContact && !viber) {
      toast.error(t.profile.atLeastOneContact);
      return;
    }
    setIsSavingProfile(true);
    try {
      await updateProfile(name, email);
      await updateContacts({ phone: phone || undefined, telegram: tgContact, viber: viber || undefined });
      toast.success(t.profile.profileUpdated);
    } catch {
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
    <div className="min-h-screen bg-gray-50 dark:bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="min-h-screen bg-gray-50 dark:bg-background py-8">
          <div className="max-w-5xl mx-auto px-4">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-black dark:text-white mb-2">
              {(t.profile as { settingsTitle?: string }).settingsTitle ?? 'Настройки профиля'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {(t.profile as { settingsSubtitle?: string }).settingsSubtitle ?? 'Управляйте своими личными данными и настройками'}
            </p>
          </div>

          <div className="bg-white dark:bg-card rounded-2xl shadow-lg overflow-hidden">
            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <div className="flex overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('personal')}
                  className={`flex-1 min-w-[150px] px-6 py-4 font-medium transition-colors flex items-center justify-center gap-2 ${
                    activeTab === 'personal'
                      ? 'text-[#FF9800] border-b-2 border-[#FF9800] bg-orange-50 dark:bg-orange-950/20'
                      : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <User className="w-5 h-5" />
                  <span>{(t.profile as { tabPersonal?: string }).tabPersonal ?? 'Личные данные'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('security')}
                  className={`flex-1 min-w-[150px] px-6 py-4 font-medium transition-colors flex items-center justify-center gap-2 ${
                    activeTab === 'security'
                      ? 'text-[#FF9800] border-b-2 border-[#FF9800] bg-orange-50 dark:bg-orange-950/20'
                      : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <Lock className="w-5 h-5" />
                  <span>{(t.profile as { tabSecurity?: string }).tabSecurity ?? 'Безопасность'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('notifications')}
                  className={`flex-1 min-w-[150px] px-6 py-4 font-medium transition-colors flex items-center justify-center gap-2 ${
                    activeTab === 'notifications'
                      ? 'text-[#FF9800] border-b-2 border-[#FF9800] bg-orange-50 dark:bg-orange-950/20'
                      : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <Bell className="w-5 h-5" />
                  <span>{(t.profile as { tabNotifications?: string }).tabNotifications ?? 'Уведомления'}</span>
                </button>
              </div>
            </div>

            <div className="p-8">
              {/* Tab: Личные данные */}
              {activeTab === 'personal' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="relative">
                      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 dark:border-gray-600 flex items-center justify-center bg-gradient-to-br from-[#FF9800]/20 to-orange-100 dark:from-orange-950/30 dark:to-gray-800">
                        {user?.avatar ? (
                          <img src={user.avatar} alt={user.name || 'Avatar'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <User className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                        )}
                      </div>
                      <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 w-10 h-10 bg-[#FF9800] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#F57C00] transition-colors shadow-lg">
                        <Camera className="w-5 h-5 text-white" />
                        <input id="avatar-upload" type="file" accept="image/*" className="hidden" />
                      </label>
                    </div>
                    <div className="text-center sm:text-left flex-1">
                      <h3 className="font-bold text-black dark:text-white mb-1">
                        {(t.profile as { photoTitle?: string }).photoTitle ?? 'Фото профиля'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {(t.profile as { avatarHint?: string }).avatarHint ?? 'Рекомендуемый размер: 400x400px, формат: JPG или PNG'}
                      </p>
                      <label htmlFor="avatar-upload-btn" className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium cursor-pointer dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                        <Camera className="w-[18px] h-[18px]" />
                        {(t.profile as { uploadPhoto?: string }).uploadPhoto ?? 'Загрузить фото'}
                        <input id="avatar-upload-btn" type="file" accept="image/*" className="hidden" />
                      </label>
                    </div>
                  </div>

                  <form onSubmit={handleSavePersonal} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t.profile.nameLabel?.replace(/\s*\*\s*$/, '').trim() || 'Имя'} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                          <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder={t.profile.namePlaceholder} className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9800] focus:border-[#FF9800] bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t.profile.emailLabel?.replace(/\s*\*\s*$/, '').trim() || 'Email'} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9800] focus:border-[#FF9800] bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t.profile.phone} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+375 29 123-45-67" className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9800] focus:border-[#FF9800] bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.profile.viber}</label>
                        <div className="relative">
                          <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                          <input type="tel" value={viber} onChange={e => setViber(e.target.value)} placeholder="+375 29 123-45-67" className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9800] focus:border-[#FF9800] bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end pt-4">
                      <button type="submit" disabled={isSavingProfile} className="flex items-center justify-center gap-2 h-12 px-8 bg-[#FF9800] text-white rounded-lg hover:bg-[#F57C00] transition-colors font-medium text-lg disabled:opacity-70">
                        {isSavingProfile ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-5 h-5" /> {t.profile.saveChanges}</>}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Tab: Безопасность — по эталону */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div className="bg-orange-50 dark:bg-orange-950/20 border border-[#FF9800] rounded-lg p-4 mb-6">
                    <h3 className="font-bold text-black dark:text-white mb-2">{t.profile.changePassword}</h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{(t.profile as { passwordHint?: string }).passwordHint ?? 'Пароль должен содержать минимум 8 символов, включая буквы и цифры'}</p>
                  </div>
                  <form onSubmit={handleSavePassword} className="space-y-4">
                    <input type="hidden" autoComplete="username" value={user?.email || ''} readOnly />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.profile.currentPassword?.replace(/\s*\*\s*$/, '').trim() || 'Текущий пароль'} <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type={showCurrentPw ? 'text' : 'password'} autoComplete="current-password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder={t.profile.currentPasswordPlaceholder ?? 'Введите текущий пароль'} className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9800] focus:border-[#FF9800] bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                        <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" tabIndex={-1}>{showCurrentPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.profile.newPassword?.replace(/\s*\*\s*$/, '').trim() || 'Новый пароль'} <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type={showNewPw ? 'text' : 'password'} autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder={t.profile.newPasswordPlaceholder ?? 'Введите новый пароль'} className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9800] focus:border-[#FF9800] bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                        <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" tabIndex={-1}>{showNewPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.profile.confirmPassword?.replace(/\s*\*\s*$/, '').trim() || 'Подтвердите новый пароль'} <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type={showConfirmPw ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder={t.profile.confirmPasswordPlaceholder ?? 'Повторите новый пароль'} className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9800] focus:border-[#FF9800] bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                        <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" tabIndex={-1}>{showConfirmPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
                      </div>
                    </div>
                    <div className="flex justify-end pt-4">
                      <button type="submit" disabled={isSavingPassword || !currentPassword || !newPassword || !confirmPassword} className="flex items-center justify-center gap-2 h-12 px-8 bg-[#FF9800] text-white rounded-lg hover:bg-[#F57C00] transition-colors font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSavingPassword ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Lock className="w-5 h-5" /> {t.profile.changePassword}</>}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Tab: Уведомления — по эталону: карточка Telegram + карточка Настройки */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  {/* Карточка Telegram */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6">
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
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {user?.telegramLinkedAt ? new Date(user.telegramLinkedAt).toLocaleDateString('ru-RU') : ''}
                              </div>
                            </div>
                          </div>
                          <button type="button" onClick={handleUnlink} className="text-red-600 hover:text-red-700 font-medium flex items-center gap-1">
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
                          <button type="button" onClick={handleCopyCode} className="shrink-0 p-2.5 bg-card border border-primary/20 rounded-lg hover:bg-primary/10 transition-colors">{codeCopied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-primary" />}</button>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600 dark:text-gray-400"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse inline-block mr-1" /> {t.profile.waiting}</span>
                          <span className="font-mono text-gray-500">{formatTime(timeLeft)}</span>
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => { cleanupLinking(); setLinkCode(null); setIsLinking(false); }} className="flex-1 px-3 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">{t.common.cancel}</button>
                          <button type="button" onClick={handleRequestLink} className="flex-1 px-3 py-3 text-sm text-primary border border-primary/40 rounded-lg hover:bg-primary/10 transition-colors">{t.profile.newCode}</button>
                        </div>
                      </div>
                    ) : (
                      <button type="button" onClick={() => handleRequestLink()} disabled={isLinking} className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 border border-[#FF9800] text-[#FF9800] rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors disabled:opacity-70">
                        <Link2 className="w-4 h-4" /> {t.profile.linkTelegram}
                      </button>
                    )}
                  </div>

                  {/* Карточка уведомлений */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <Bell className="w-5 h-5 text-[#FF9800] mt-0.5 shrink-0" />
                      <div>
                        <h3 className="font-bold text-black dark:text-white mb-1">{t.notifications.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{t.notifications.description}</p>
                      </div>
                    </div>

                    {!isTelegramLinked ? (
                      <div className="bg-orange-50 dark:bg-orange-950/20 border border-[#FF9800]/50 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <BellOff className="w-5 h-5 text-[#FF9800] shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-black dark:text-white mb-1">{t.notifications.telegramNotLinked}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{t.notifications.telegramNotLinkedHint}</p>
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
                              <input type="checkbox" checked={!!notifSettings?.notifications_enabled} onChange={() => handleToggleNotifications(!notifSettings?.notifications_enabled)} disabled={notifSaving} className="sr-only peer" />
                              <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${notifSettings?.notifications_enabled ? 'bg-[#FF9800]' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${notifSettings?.notifications_enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                              </div>
                            </div>
                          </label>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <label className="font-medium text-black dark:text-white">{t.notifications.radius}</label>
                            <span className="text-[#FF9800] font-bold">{localRadius} {t.notifications.km}</span>
                          </div>
                          <input type="range" min={1} max={10} step={0.5} value={localRadius} onChange={e => setLocalRadius(parseFloat(e.target.value))} className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[#FF9800] [&::-webkit-slider-runnable-track]:bg-[length:100%_100%]" style={{ background: `linear-gradient(to right, rgb(255, 152, 0) 0%, rgb(255, 152, 0) ${((localRadius - 1) / 9) * 100}%, rgb(229, 231, 235) ${((localRadius - 1) / 9) * 100}%, rgb(229, 231, 235) 100%)` }} />
                          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                            <span>1 {t.notifications.km}</span>
                            <span>5 {t.notifications.km}</span>
                            <span>10 {t.notifications.km}</span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">{t.notifications.radiusHint}</p>
                        </div>
                        <button type="button" onClick={handleSaveNotifSettings} disabled={notifSaving} className="w-full mt-6 flex items-center justify-center gap-2 h-12 bg-[#FF9800] text-white rounded-lg hover:bg-[#F57C00] transition-colors font-medium text-lg disabled:opacity-70">
                          {notifSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-5 h-5" /> {t.notifications.saveSettings}</>}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            </div>
          </div>
        </div>
      </main>

      <CitySelectModal
        open={showCityModal}
        onClose={() => setShowCityModal(false)}
        onSelect={handleCityModalSelect}
        currentCity={selectedCity}
      />
    </div>
  );
}
