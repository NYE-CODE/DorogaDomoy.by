import { Eye, EyeOff, Lock } from 'lucide-react';
import type { useAuth } from '../../context/AuthContext';

type AuthUser = ReturnType<typeof useAuth>['user'];

const inputClass =
  'w-full pl-10 pr-12 py-3 border border-border rounded-lg bg-background text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50';

export interface ProfileSecurityTabProps {
  user: AuthUser;
  t: { profile: Record<string, string> };
  currentPassword: string;
  setCurrentPassword: (v: string) => void;
  newPassword: string;
  setNewPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  showCurrentPw: boolean;
  setShowCurrentPw: (v: boolean) => void;
  showNewPw: boolean;
  setShowNewPw: (v: boolean) => void;
  showConfirmPw: boolean;
  setShowConfirmPw: (v: boolean) => void;
  isSavingPassword: boolean;
  isDeletingAccount: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onDeleteAccount: () => void;
}

export function ProfileSecurityTab({
  user,
  t,
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
  isSavingPassword,
  isDeletingAccount,
  onSubmit,
  onDeleteAccount,
}: ProfileSecurityTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-orange-50 dark:bg-orange-950/20 border border-[#FF9800] rounded-lg p-4 mb-6">
        <h3 className="font-bold text-black dark:text-white mb-2">
          {user?.passwordSet === false
            ? (t.profile.setPasswordTitle)
            : t.profile.changePassword}
        </h3>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {user?.passwordSet === false
            ? (t.profile.setPasswordHint)
            : (t.profile.passwordHint)}
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <input type="hidden" autoComplete="username" value={user?.email || ''} readOnly />
        {user?.passwordSet !== false && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.profile.currentPassword?.replace(/\s*\*\s*$/, '').trim() || '?{t.profile.pointsBalanceLabel}?'} <span className="text-red-500">*</span></label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type={showCurrentPw ? 'text' : 'password'} autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder={t.profile.currentPasswordPlaceholder} className={inputClass} />
            <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" tabIndex={-1}>{showCurrentPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
          </div>
        </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.profile.newPassword.replace(/\s*\*\s*$/, '').trim()} <span className="text-red-500">*</span></label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type={showNewPw ? 'text' : 'password'} autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={t.profile.newPasswordPlaceholder} className={inputClass} />
            <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" tabIndex={-1}>{showNewPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.profile.confirmPassword.replace(/\s*\*\s*$/, '').trim()} <span className="text-red-500">*</span></label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type={showConfirmPw ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder={t.profile.confirmPasswordPlaceholder} className={inputClass} />
            <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" tabIndex={-1}>{showConfirmPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
          </div>
        </div>
        <div className="flex justify-end pt-4">
          <button type="submit" disabled={isSavingPassword || !newPassword || !confirmPassword || (user?.passwordSet !== false && !currentPassword)} className="flex items-center justify-center gap-2 h-12 px-8 bg-[#FF9800] text-white rounded-lg hover:bg-[#F57C00] transition-colors font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed">
            {isSavingPassword ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Lock className="w-5 h-5" /> {user?.passwordSet === false ? (t.profile.setPasswordTitle) : t.profile.changePassword}</>}
          </button>
        </div>
      </form>

      <div className="border border-red-200 dark:border-red-900/60 rounded-lg p-4 space-y-3">
        <h3 className="font-bold text-black dark:text-white">{t.profile.deleteAccount}</h3>
        <p className="text-sm text-gray-700 dark:text-gray-300">{t.profile.deleteAccountBody}</p>
        <button
          type="button"
          disabled={isDeletingAccount}
          onClick={onDeleteAccount}
          className="h-12 px-6 rounded-lg border border-red-500 text-red-600 dark:text-red-400 font-medium disabled:opacity-50"
        >
          {isDeletingAccount ? '…' : t.profile.deleteAccount}
        </button>
      </div>
    </div>
  );
}
