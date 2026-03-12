import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, User, Mail, Phone, MessageCircle, Save, AlertCircle, Lock, Edit2, Shield, Link2, Unlink, Bell, BellOff, Copy, Check, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { telegramApi, notificationsApi, type NotificationSettingsData } from '../api/client';
import { toast } from 'sonner';

interface ProfilePageProps {
  onBack: () => void;
}

const roleLabels: Record<string, string> = {
  user: 'Пользователь',
  volunteer: 'Волонтёр',
  shelter: 'Приют',
  admin: 'Администратор'
};

const roleColors: Record<string, string> = {
  user: 'bg-gray-100 text-gray-700',
  volunteer: 'bg-blue-100 text-blue-700',
  shelter: 'bg-purple-100 text-purple-700',
  admin: 'bg-red-100 text-red-700'
};

export function ProfilePage({ onBack }: ProfilePageProps) {
  const { user, updateContacts, updateProfile, refreshUser } = useAuth();
  
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

  const isTelegramLinked = !!user?.telegramId;

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
      toast.error('Имя должно содержать минимум 2 символа');
      return;
    }
    setIsSavingProfile(true);
    try {
      await updateProfile(name, email);
      toast.success('Профиль обновлен!');
    } catch {
      toast.error('Не удалось обновить профиль. Попробуйте снова.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error('Пароли не совпадают'); return; }
    if (newPassword.length < 6) { toast.error('Пароль должен содержать минимум 6 символов'); return; }
    setIsSavingPassword(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    setIsSavingPassword(false);
    toast.success('Пароль изменен!');
  };

  const handleSaveContacts = async (e: React.FormEvent) => {
    e.preventDefault();
    const tgContact = isTelegramLinked ? `@${user?.telegramUsername}` : undefined;
    if (!phone && !tgContact && !viber) { toast.error('Укажите хотя бы один способ связи'); return; }
    setIsSavingContacts(true);
    try {
      await updateContacts({ phone: phone || undefined, telegram: tgContact, viber: viber || undefined });
      toast.success('Контакты обновлены!');
    } catch { toast.error('Ошибка'); }
    finally { setIsSavingContacts(false); }
  };

  const handleRequestLink = async () => {
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
            toast.success('Telegram успешно привязан!');
          }
        } catch {}
      }, 3000);
    } catch (e: any) {
      toast.error(e.message || 'Ошибка при запросе кода');
      setIsLinking(false);
    }
  };

  const handleUnlink = async () => {
    if (!confirm('Отвязать Telegram? Уведомления будут отключены.')) return;
    try {
      await telegramApi.unlink();
      await refreshUser();
      setNotifSettings(null);
      toast.success('Telegram отвязан');
    } catch (e: any) { toast.error(e.message || 'Ошибка при отвязке'); }
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
      toast.success(enabled ? 'Уведомления включены' : 'Уведомления выключены');
    } catch (e: any) { toast.error(e.message || 'Ошибка'); }
    finally { setNotifSaving(false); }
  };

  const handleSaveNotifSettings = async () => {
    setNotifSaving(true);
    try {
      const updated = await notificationsApi.updateSettings({ notification_radius_km: localRadius });
      setNotifSettings(updated);
      toast.success('Настройки уведомлений сохранены');
    } catch (e: any) { toast.error(e.message || 'Ошибка'); }
    finally { setNotifSaving(false); }
  };

  const formatTime = (sec: number) => `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;

  const hasAnyContact = phone || viber || isTelegramLinked || telegram;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Профиль</h1>
              <p className="text-sm text-gray-600">Управление личными данными</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 md:px-6 py-8 space-y-6">
        {/* Profile Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0">
              <User className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">{user?.name}</h2>
              <div className="flex items-center gap-2 text-gray-600 mt-1">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{user?.email}</span>
              </div>
              {user?.role && (
                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full mt-2 ${roleColors[user.role]}`}>
                  <Shield className="w-3 h-3" />
                  {roleLabels[user.role]}
                </span>
              )}
            </div>
          </div>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><Edit2 className="w-5 h-5" /> Личная информация</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Имя *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="Ваше имя" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="email@example.by" />
              </div>
            </div>
            <button type="submit" disabled={isSavingProfile} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 active:scale-[0.98] transition-all font-medium disabled:opacity-70">
              {isSavingProfile ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> Сохранить изменения</>}
            </button>
          </form>
        </div>

        {/* Password */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Lock className="w-5 h-5" /> Изменить пароль</h3>
          <form onSubmit={handleSavePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Текущий пароль</label>
              <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="••••••••" /></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Новый пароль</label>
              <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="••••••••" /></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Подтвердите новый пароль</label>
              <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="••••••••" /></div>
            </div>
            <button type="submit" disabled={isSavingPassword || !currentPassword || !newPassword || !confirmPassword} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 active:scale-[0.98] transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed">
              {isSavingPassword ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> Изменить пароль</>}
            </button>
          </form>
        </div>

        {/* Contacts Warning */}
        {!hasAnyContact && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-900 mb-1">Добавьте контакты</h3>
              <p className="text-sm text-amber-800">Укажите хотя бы один способ связи, чтобы иметь возможность создавать объявления.</p>
            </div>
          </div>
        )}

        {/* Contacts */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Контакты для связи</h3>
          <p className="text-sm text-gray-600 mb-6">Эти данные будут отображаться в ваших объявлениях. Укажите хотя бы один способ связи.</p>
          <form onSubmit={handleSaveContacts} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Телефон</label>
              <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="+375291234567" /></div>
            </div>

            {/* Telegram — linking inline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Telegram</label>
              {isTelegramLinked ? (
                <div className="flex items-center justify-between gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-3 min-w-0">
                    <MessageCircle className="w-5 h-5 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900">@{user?.telegramUsername}</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full"><Check className="w-3 h-3" /> Привязан</span>
                      </div>
                      {user?.telegramLinkedAt && <p className="text-xs text-gray-500 mt-0.5">{new Date(user.telegramLinkedAt).toLocaleDateString('ru-RU')}</p>}
                    </div>
                  </div>
                  <button type="button" onClick={handleUnlink} className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                    <Unlink className="w-3.5 h-3.5" /> Отвязать
                  </button>
                </div>
              ) : linkCode ? (
                <div className="space-y-4 border border-blue-200 bg-blue-50/50 rounded-lg p-4">
                  <div>
                    <p className="text-sm text-blue-800 mb-2">
                      <span className="font-semibold">1.</span> Откройте бота: <a href={botUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 underline inline-flex items-center gap-1">@{botUrl.split('/').pop()} <ExternalLink className="w-3 h-3" /></a>
                    </p>
                    <p className="text-sm text-blue-800"><span className="font-semibold">2.</span> Отправьте команду:</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white border border-blue-200 rounded-lg px-4 py-2.5 text-base font-mono font-bold text-blue-900 text-center tracking-wider">/link {linkCode}</code>
                    <button type="button" onClick={handleCopyCode} className="shrink-0 p-2.5 bg-white border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors" title="Копировать">
                      {codeCopied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-blue-600" />}
                    </button>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="flex items-center gap-1.5 text-gray-600"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse inline-block" /> Ожидание...</span>
                      <span className="text-gray-500 font-mono">{formatTime(timeLeft)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div className="bg-blue-500 h-1 rounded-full transition-all duration-1000" style={{ width: `${(timeLeft / 300) * 100}%` }} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { cleanupLinking(); setLinkCode(null); setIsLinking(false); }} className="flex-1 px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Отмена</button>
                    <button type="button" onClick={handleRequestLink} className="flex-1 px-3 py-1.5 text-sm text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors">Новый код</button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={handleRequestLink} disabled={isLinking} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-70">
                  <Link2 className="w-4 h-4" /> Привязать Telegram
                </button>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Viber</label>
              <div className="relative"><MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="tel" value={viber} onChange={e => setViber(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="+375291234567" /></div>
            </div>
            <button type="submit" disabled={isSavingContacts} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 active:scale-[0.98] transition-all font-medium disabled:opacity-70">
              {isSavingContacts ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> Сохранить контакты</>}
            </button>
          </form>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-500" />
            Уведомления
          </h3>
          <p className="text-sm text-gray-600 mb-5">Уведомления приходят, когда рядом с одним из ваших объявлений появляется новое</p>

          {!isTelegramLinked ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <BellOff className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-900 mb-1">Telegram не привязан</h4>
                <p className="text-sm text-amber-800">Привяжите Telegram в разделе «Контакты для связи», чтобы получать уведомления.</p>
              </div>
            </div>
          ) : notifLoading ? (
            <div className="flex items-center justify-center py-8"><div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div>
          ) : (
            <div className="space-y-6">
              {/* Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Уведомления в Telegram</h4>
                  <p className="text-sm text-gray-500">О новых объявлениях рядом с вашими</p>
                </div>
                <button onClick={() => handleToggleNotifications(!notifSettings?.notifications_enabled)} disabled={notifSaving}
                  className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${notifSettings?.notifications_enabled ? 'bg-blue-600' : 'bg-gray-300'}`}>
                  <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${notifSettings?.notifications_enabled ? 'translate-x-7' : ''}`} />
                </button>
              </div>

              {/* Radius */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">Радиус уведомлений</h4>
                  <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{localRadius} км</span>
                </div>
                <input type="range" min={1} max={10} step={0.5} value={localRadius} onChange={e => setLocalRadius(parseFloat(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                <div className="flex justify-between text-xs text-gray-400 mt-1"><span>1 км</span><span>5 км</span><span>10 км</span></div>
                <p className="text-xs text-gray-500 mt-2">Радиус считается от каждого вашего активного объявления</p>
              </div>

              <button onClick={handleSaveNotifSettings} disabled={notifSaving} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 active:scale-[0.98] transition-all font-medium disabled:opacity-70">
                {notifSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> Сохранить настройки уведомлений</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
