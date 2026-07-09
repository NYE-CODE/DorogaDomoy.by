import { Camera, Check, Copy, Mail, MessageCircle, Phone, Save, User } from 'lucide-react';
import { BELARUS_MOBILE_PHONE_PLACEHOLDER } from '../../utils/belarus-phone';
import { resolveAvatarUrl } from './profile-page-helpers';
import type { ProfileRoleDraft, ProfileTranslations } from './profile-page-types';
import type { useAuth } from '../../context/AuthContext';

type AuthUser = ReturnType<typeof useAuth>['user'];

const inputClass =
  'w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50';

export interface ProfilePersonalTabProps {
  user: AuthUser;
  t: {
    profile: Record<string, string>;
    auth: { nameMinLength: string };
  };
  pr: ProfileTranslations;
  name: string;
  setName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  viber: string;
  setViber: (v: string) => void;
  roleDraft: ProfileRoleDraft;
  setRoleDraft: (v: ProfileRoleDraft) => void;
  isSavingProfile: boolean;
  helperCopied: boolean;
  onCopyHelperCode: () => void;
  onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ProfilePersonalTab({
  user,
  t,
  pr,
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
  isSavingProfile,
  helperCopied,
  onCopyHelperCode,
  onAvatarUpload,
  onSubmit,
}: ProfilePersonalTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-border">
        <div className="relative">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 dark:border-gray-600 flex items-center justify-center bg-gradient-to-br from-[#FF9800]/20 to-orange-100 dark:from-orange-950/30 dark:to-gray-800">
            {user?.avatar ? (
              <img src={resolveAvatarUrl(user.avatar)} alt={user.name || 'Avatar'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User className="w-12 h-12 text-gray-400 dark:text-gray-500" />
            )}
          </div>
          <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 w-10 h-10 bg-[#FF9800] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#F57C00] transition-colors shadow-lg">
            <Camera className="w-5 h-5 text-white" />
            <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={onAvatarUpload} />
          </label>
        </div>
        <div className="text-center sm:text-left flex-1">
          <h3 className="font-bold text-black dark:text-white mb-1">
            {t.profile.photoTitle}
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            {t.profile.avatarHint}
          </p>
          <label htmlFor="avatar-upload-btn" className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium cursor-pointer dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
            <Camera className="w-[18px] h-[18px]" />
            {t.profile.uploadPhoto}
            <input id="avatar-upload-btn" type="file" accept="image/*" className="hidden" onChange={onAvatarUpload} />
          </label>
        </div>
      </div>

      <div className="rounded-md border border-gray-200 dark:border-gray-700 p-4 bg-gray-50/60 dark:bg-gray-800/40">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t.profile.helperIdLabel}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t.profile.helperIdHint}
            </div>
          </div>
          <button
            type="button"
            onClick={() => { void onCopyHelperCode(); }}
            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors"
            disabled={!user?.helperCode}
          >
            {helperCopied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
            <span className="font-mono text-sm">{user?.helperCode ?? '—'}</span>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="rounded-lg bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400">{t.profile.helperConfirmedCountLabel}</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{user?.helperConfirmedCount ?? 0}</div>
          </div>
          <div className="rounded-lg bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400">{t.profile.pointsBalanceLabel}</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{user?.pointsBalance ?? 0}</div>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t.profile.nameLabel.replace(/\s*\*\s*$/, '').trim()} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder={t.profile.namePlaceholder} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t.profile.emailLabel?.replace(/\s*\*\s*$/, '').trim() || 'Email'} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className={inputClass} />
            </div>
          </div>

          {user?.role === 'admin' && (
            <div className="md:col-span-2 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/40 p-4">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.profile.roleFieldLabel}
              </div>
              <div className="text-gray-900 dark:text-white font-medium">{t.profile.roles?.admin}</div>
            </div>
          )}

          {user?.role === 'user' && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.profile.roleFieldLabel}
              </label>
              <select
                value={roleDraft}
                onChange={(e) => setRoleDraft(e.target.value as ProfileRoleDraft)}
                className="w-full max-w-md rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF9800]"
              >
                <option value="user">{t.profile.roles?.user}</option>
                <option value="volunteer">{t.profile.roles?.volunteer}</option>
              </select>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{pr.roleUpgradeHint}</p>
            </div>
          )}

          {user?.role === 'volunteer' && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.profile.roleFieldLabel}
              </label>
              <select
                disabled
                value="volunteer"
                className="w-full max-w-md rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-900 px-3 py-3 text-gray-700 dark:text-gray-300 cursor-not-allowed opacity-90"
              >
                <option value="volunteer">{t.profile.roles?.volunteer}</option>
              </select>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {user.registeredAsVolunteer
                  ? (pr.roleHintRegVolunteer ?? '')
                  : (pr.roleUpgradeHint ?? '')}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t.profile.phone} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={BELARUS_MOBILE_PHONE_PLACEHOLDER} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.profile.viber}</label>
            <div className="relative">
              <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input type="tel" value={viber} onChange={(e) => setViber(e.target.value)} placeholder={BELARUS_MOBILE_PHONE_PLACEHOLDER} className={inputClass} />
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
  );
}
