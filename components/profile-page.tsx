import { useState, useEffect } from 'react';
import { ArrowLeft, User, Mail, Phone, MessageCircle, Save, AlertCircle, Lock, Edit2, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

interface ProfilePageProps {
  onBack: () => void;
}

const roleLabels = {
  user: 'Пользователь',
  volunteer: 'Волонтёр',
  shelter: 'Приют',
  admin: 'Администратор'
};

const roleColors = {
  user: 'bg-gray-100 text-gray-700',
  volunteer: 'bg-blue-100 text-blue-700',
  shelter: 'bg-purple-100 text-purple-700',
  admin: 'bg-red-100 text-red-700'
};

export function ProfilePage({ onBack }: ProfilePageProps) {
  const { user, updateContacts, updateProfile } = useAuth();
  
  // Personal info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Contacts
  const [phone, setPhone] = useState('');
  const [telegram, setTelegram] = useState('');
  const [viber, setViber] = useState('');
  
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSavingContacts, setIsSavingContacts] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.contacts?.phone || '');
      setTelegram(user.contacts?.telegram || '');
      setViber(user.contacts?.viber || '');
    }
  }, [user]);

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
    } catch (error) {
      toast.error('Не удалось обновить профиль. Попробуйте снова.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Пароль должен содержать минимум 6 символов');
      return;
    }

    setIsSavingPassword(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // In real app, would verify currentPassword and update
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');

    setIsSavingPassword(false);
    toast.success('Пароль изменен!');
  };

  const handleSaveContacts = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone && !telegram && !viber) {
      toast.error('Укажите хотя бы один способ связи');
      return;
    }

    setIsSavingContacts(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    updateContacts({
      phone: phone || undefined,
      telegram: telegram || undefined,
      viber: viber || undefined,
    });

    setIsSavingContacts(false);
    toast.success('Контакты обновлены!');
  };

  const hasAnyContact = phone || telegram || viber;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Профиль</h1>
              <p className="text-sm text-gray-600">Управление личными данными</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-8 space-y-6">
        {/* Profile Info Card */}
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
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${roleColors[user.role]}`}>
                    <Shield className="w-3 h-3" />
                    {roleLabels[user.role]}
                  </span>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Edit2 className="w-5 h-5" />
              Личная информация
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Имя *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="Ваше имя"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="email@example.by"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingProfile}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 active:scale-[0.98] transition-all font-medium disabled:opacity-70"
            >
              {isSavingProfile ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Сохранить изменения
                </>
              )}
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Изменить пароль
          </h3>

          <form onSubmit={handleSavePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Текущий пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Новый пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Подтвердите новый пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingPassword || !currentPassword || !newPassword || !confirmPassword}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 active:scale-[0.98] transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSavingPassword ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Изменить пароль
                </>
              )}
            </button>
          </form>
        </div>

        {/* Contacts Warning */}
        {!hasAnyContact && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-900 mb-1">Добавьте контакты</h3>
              <p className="text-sm text-amber-800">
                Укажите хотя бы один способ связи, чтобы иметь возможность создавать объявления.
                Эти данные будут показаны в ваших объявлениях для связи с вами.
              </p>
            </div>
          </div>
        )}

        {/* Contacts Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Контакты для связи
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Эти данные будут отображаться в ваших объявлениях. Укажите хотя бы один способ связи.
          </p>

          <form onSubmit={handleSaveContacts} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Телефон
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="+375291234567"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telegram
              </label>
              <div className="relative">
                <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={telegram}
                  onChange={e => setTelegram(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="@username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Viber
              </label>
              <div className="relative">
                <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={viber}
                  onChange={e => setViber(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="+375291234567"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingContacts}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 active:scale-[0.98] transition-all font-medium disabled:opacity-70"
            >
              {isSavingContacts ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Сохранить контакты
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}